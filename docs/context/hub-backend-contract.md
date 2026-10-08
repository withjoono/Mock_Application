---
name: hub-backend-contract
description: T모지의 백엔드가 Hub 리포의 /mock-application/* 모듈이라는 사실과, 라우트·ma_* 테이블·회수 제한 제약·변경 절차
type: reference
---

# 백엔드 계약 — Hub 의 `/mock-application/*`

## 1. 백엔드는 이 리포에 없다

이 앱에는 서버 코드·Prisma 스키마·`app.yaml` 이 **없는 것이 정상**이다. 여기서 찾지 말 것.

| 항목 | 위치 |
|---|---|
| 컨트롤러/서비스 | `withjoono/Hub` → `Hub-Backend/src/modules/mock-application/` (`mock-application.{controller,service,module}.ts`) |
| App Engine 서비스 | Hub 의 **`default`** (자체 서비스 없음) |
| prod 베이스 URL | `https://ts-back-nest-479305.du.r.appspot.com` |
| 테이블 정의 | Hub-Backend `prisma/schema.prisma` — `MaSeason` / `MaSusiApplication` / `MaJungsiApplication` / `MaApplicationStats` |
| 마이그레이션 | Hub-Backend `prisma/migrations/20260605000003_create_mock_application_tables` |
| Swagger | `{prod}/swagger` 의 **`MockApplication (모의지원 ma_*)`** 태그 |

Hub 컨트롤러는 `@Controller('mock-application')` 이고 전역 `JwtAuthGuard` 아래에서 `req.memberId` 를 쓴다.

## 2. 라우트 ↔ 클라이언트 함수 대응 (10개, 1:1)

`lib/api/features/mock-application/apis.ts` — 전부 `hubAuthClient` 사용.

| 클라이언트 함수 | Hub 라우트 |
|---|---|
| `fetchSeasonsAPI()` | `GET /mock-application/seasons` |
| `fetchMyApplicationsAPI(seasonId)` | `GET /mock-application/my?seasonId=` |
| `createSusiApplicationAPI(payload)` | `POST /mock-application/susi` |
| `deleteSusiApplicationAPI(id)` | `DELETE /mock-application/susi/:id` |
| `createJungsiApplicationAPI(payload)` | `POST /mock-application/jungsi` |
| `deleteJungsiApplicationAPI(id)` | `DELETE /mock-application/jungsi/:id` |
| `searchSusiTargetsAPI(keyword)` | `GET /mock-application/search/susi?keyword=` |
| `searchJungsiTargetsAPI(keyword, seasonId, gunType?)` | `GET /mock-application/search/jungsi?keyword=&seasonId=&gunType=` |
| `fetchStatsAPI(seasonId, targetType, targetId)` | `GET /mock-application/stats?seasonId=&targetType=&targetId=` |

응답은 Hub 의 `SuccessResponseInterceptor` 로 `{ success, data }` 래핑되므로 클라이언트가 `response.data.data` 를 꺼낸다.

## 3. `ma_*` 테이블 — `hub` 스키마에 있다

`docs/ma-db-schema-design.md` 의 **구현 노트**가 본문 설계와 달라진 점을 밝히고 있다. 요약:

1. **스키마 위치** — 신규 `mock_application` 스키마가 아니라 **`hub` 스키마**에 만들었다.
   Hub-Backend 의 datasource 가 `schemas = ["hub"]` 단일 구성이고, `susi_*` 도 hub 스키마에 두는 기존 패턴을 따랐다.
   Prisma 모델에 `@@schema("hub")` 로 명시돼 있다.
2. **`member_id` 타입** — `BIGINT` 가 아니라 **`VARCHAR(30)`**. `hub.auth_member.id` 가 문자열 PK 이기 때문.
3. **취소 정책** — 소프트 삭제가 아니라 **물리 삭제**(슬롯 재사용 단순화, UNIQUE 유지).

테이블 4개:

```
ma_season                 시즌 마스터 (MOCK_JUNE / MOCK_SEPT / SUSI / JUNGSI)
ma_susi_application       수시 모의지원 (시즌당 슬롯 1~6)
ma_jungsi_application     정시·모평 모의지원 (시즌당 가/나/다 각 1회)
ma_application_stats      모집단위별 지원 현황 집계 캐시 (경쟁률·분포)
```

`ma_season` 은 `@@unique([year, seasonType])`, `isActive` 플래그로 활성 시즌을 고른다.
모평(6/9월)과 정시는 구조가 같아 `ma_jungsi_application` 하나로 통합하고 **시즌으로 구분**한다.

## 4. 회수 제한은 DB 제약으로 강제된다

Susi/Jungsi 기존 테이블에는 군별·회수 제한이 DB 에 없어 앱 로직에만 의존했다. `ma_*` 는 다르다.

- 수시 6회 → `UNIQUE(member_id, season_id, slot_no)` + `CHECK (slot_no BETWEEN 1 AND 6)`
- 정시/모평 가·나·다 3회 → `UNIQUE(member_id, season_id, gun_type)`

→ **7번째 수시 제출이나 같은 군 2번째 제출은 409 로 떨어진다.** 클라이언트에서 회수 제한을 임의로 완화해도
서버가 거부한다. 반대로 제한을 바꾸려면 **DB 제약부터** 바꿔야 한다.

대학/모집단위 데이터는 재사용한다 — 수시는 `susi.ss_recruitment_unit`, 정시·모평은 `jungsi.js_admission` 을
ID 로 참조하고, 지원 시점 점수는 **스냅샷으로 복사 저장**한다. cross-schema 하드 FK 는 걸지 않는다(ID 참조 + 인덱스).

## 5. 변경 절차

계약을 바꾸는 작업은 **Hub 리포에서 시작한다.**

1. Hub-Backend `prisma/schema.prisma` + 마이그레이션 추가
2. Hub-Backend `src/modules/mock-application/` 수정
3. Hub `main` push → `.github/workflows/deploy-backend.yml` 이
   install → build → **Cloud SQL 프록시로 `prisma migrate deploy`** → App Engine 배포까지 자동 수행
4. 배포 확인 후 이 리포의 `lib/api/features/mock-application/interfaces.ts` · `apis.ts` 를 맞춘다

**이 리포만 고치면 아무것도 바뀌지 않는다.**

## 6. DB 안전 규칙 — 이 앱의 데이터는 `hub` 스키마에 있다

`ma_*` 가 `hub` 스키마에 있다는 사실은 위험 측면에서 중요하다.

> **2026-07 에 `prisma db push` 로 공용 `hub` 스키마가 3회 wipe 됐다**(`hub.auth_member` 유실 → 전 생태계 로그인 마비).
> `ma_*` 는 **바로 그 `hub` 스키마 안**에 있다. 즉 이 앱의 모의지원 데이터는 그 사고의 폭발 반경 안이다.

- Hub 쪽에서도 `prisma db push` · `migrate reset` 금지. 스키마 변경은 **`prisma migrate deploy`** 로만.
- 이 앱에서 DB 를 직접 볼 일이 생기면 접속 직후 **공통 규칙 1의 신원 게이트**부터 실행한다
  (`SELECT current_database(), inet_server_port(), version();` + `susi.susi_calculation_formula` / `susi.susi_unit` 행 수).
- Cloud SQL 프록시 포트로 5433 을 쓰지 말 것(로컬 Windows postgres 상시 점유). 15432·15433 등을 쓴다.

## 7. prod 검증 시나리오 (`docs/release-checklist.md` 에서)

```bash
BASE=https://ts-back-nest-479305.du.r.appspot.com
# 1) 로그인 → 토큰 획득    POST $BASE/auth/login/email
# 2) 시즌 목록             GET  $BASE/mock-application/seasons        (활성 시즌이 isOpen=true)
# 3) 검색                  GET  "$BASE/mock-application/search/jungsi?keyword=...&season_id=...&gun_type=..."
# 4) 지원 제출 → 군별 1회 제한 확인 (같은 군 2번째 제출 시 409)
# 5) Swagger $BASE/swagger 의 'MockApplication (모의지원 ma_*)' 태그
```

검증 포인트: 시즌 4개 시드 / 검색이 실데이터 반환 / 수시 7번째 제출 409 / 가군 중복 409 /
탈퇴(`DELETE /account/me`) 후 로그인 불가. **자격증명은 문서에 적지 말 것** — 테스트 계정 값은 별도로 관리한다.
