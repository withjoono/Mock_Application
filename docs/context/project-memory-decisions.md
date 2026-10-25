---
name: project-memory-decisions
description: claude.ai 프로젝트 기억(2026-06~09)에서 옮겨온 결정·교훈 중 저장소 문서에 없던 것만. 이미 있는 내용은 링크로만 연결
type: project
source: claude.ai Project "Mock_Application" 메모리 (2026-10-25 이관)
---

# 프로젝트 기억에서 옮긴 결정 · 교훈

> 이 파일은 claude.ai 프로젝트 기억을 2026-10-25에 저장소로 옮긴 것이다.
> **저장소에 이미 있던 내용은 다시 쓰지 않고 아래 1절에서 링크만 건다.**
> 기억과 현재 코드가 다르면 **코드가 우선**이다(5절).

## 1. 이미 저장소에 있는 내용 — 여기를 볼 것

| 주제 | 위치 |
|---|---|
| 3대 기능 · 시즌 기반 UI · 지원 회수(수시 6 / 가나다 3) | `README.md`, `AGENTS.md` "이 리포는 무엇인가" |
| 백엔드 = Hub `/mock-application/*`, `ma_*` 4테이블(hub 스키마, member_id VARCHAR(30), 물리 삭제) | `docs/context/hub-backend-contract.md`, `docs/ma-db-schema-design.md` |
| 이메일 로그인 · SecureStore · 회원 탈퇴 필수 | `docs/context/auth-and-api-clients.md` |
| Convex 제거 · `__DEV__` 데모 게이트 · 1차 출시 범위 | `AGENTS.md` 고유 규칙 8, `docs/context/release-and-store.md` 8절 |
| 번들 ID · AAB · `EXPO_PUBLIC_ENV` · EAS 제출 | `AGENTS.md` 고유 규칙 6, `docs/context/release-and-store.md` |
| 개인정보처리방침 위치(Hub-Frontend, 대표자명 미기입) · 아이콘 4종 | `docs/context/release-and-store.md` 2절 |
| Hub 배포 = main push 시 Actions가 마이그레이션까지 자동 | `docs/context/hub-backend-contract.md` 5절 |

## 2. 가격 · 정책 · 범위 경계

- **가격:** 앱 자체는 **무료**("수시/정시 무료 모의지원 앱"). 유료 기능·인앱결제 결정은 없음.
  유료화를 넣으려면 스토어 결제 정책 검토가 선행돼야 한다(새 결정 필요).
- **저장소 경계:** Hub 리포는 **허브 역할만**, 위성앱 git 은 각자 분리. `ma_*` 백엔드 API 는
  이 리포가 아니라 **Hub-Backend 모듈로 유지**한다(사용자 승인 결정, 2026-06).
- **웹 불필요:** 모바일 전용. `npm run web`/Playwright 는 테스트 편의일 뿐 배포 대상이 아니다.
- **소셜 로그인(Google/Naver) 미구현.** 계획은 "추후 Hub SSO 웹뷰" 방식이며, 넣는 순간 Apple 로그인 의무가 생긴다.
  임의로 추가하지 말 것.
- **앱 푸터 구성:** `© T Skool` + `tskool.kr` + 개인정보처리방침 링크 — `components/AppFooter.tsx`.

## 3. API 규칙 (코드에서 놓치기 쉬운 것)

- 클라이언트는 `seasonId`·`gunType` 처럼 camelCase 로 보내지만 `humps` 가 snake_case 로 바꾼다.
  → **Hub 컨트롤러는 쿼리 파라미터를 snake_case 로 받는다**(`@Query('season_id')`). Hub 쪽에 새 쿼리를 추가할 때도 snake_case.
- **예외: Hub `POST /auth/refresh`** 의 DTO 는 camelCase(`refreshToken`)다. 그래서 `lib/api/instances.ts` 의
  `refreshAccessToken` 은 humps 인스턴스가 아닌 **bare axios** 로 호출한다. 이 호출을 humps 클라이언트로 바꾸지 말 것.
- 정시/모평 지원의 **군 검증**은 Hub 서비스가 `jungsi.js_admission` 을 raw 쿼리로 조회해서 한다.
- 회수 제한은 UNIQUE 제약 + 서비스 사전 검증 이중 구조다(상세는 `hub-backend-contract.md` 4절).

## 4. 데이터 위치

| 용도 | 위치 |
|---|---|
| 수시 검색 | Hub `/mock-application/search/susi` — raw SQL `susi.ss_recruitment_unit → ss_admission → ss_university` 조인 |
| 정시·모평 검색 | Hub `/mock-application/search/jungsi` — `jungsi.js_admission LEFT JOIN ss_university`, 군 필터 |
| 시즌 시드 | Hub 마이그레이션 `20260605000003_create_mock_application_tables` 안에 **2027 시즌 시드 포함** |
| 탈퇴 처리 | Hub `AccountModule` (`DELETE /account/me`): 익명화 + 계정 정지 + `ma_*` 삭제 |
| 구버전 코드 | `_legacy/` (2026-06-05 `a0-project` 를 루트로 승격하면서 구버전 보관, gitignore·참조 금지) |

## 5. 기억과 현재 코드가 다른 값 — 코드가 맞다

| 항목 | 옛 기억(2026-06) | 현재 저장소(2026-10-25 실측) |
|---|---|---|
| 번들 ID / 패키지 | `kr.geobukschool.mockapply` | **`kr.tskool.mockapply`** (`app.json`) |
| Expo / RN | SDK 52, RN 0.76, screens ~4.4.0, safe-area 4.12.0 | **Expo ^54, RN 0.81.5, screens ~4.16.0, safe-area ~5.6.0** (`package.json`) |
| git 상태 | "샌드박스에서 init 불가, PC에서 직접" | **이미 독립 리포**(`main`, origin = withjoono/Mock_Application) |

## 6. 사고 교훈

- **Cowork/샌드박스 VM 마운트에서 `git init` 하면 `.git/config` 가 손상됐다**(2026-06).
  저장소 초기화 같은 git 메타데이터 작업은 사용자 PC 터미널에서 한다.
- **샌드박스 마운트가 큰 파일의 꼬리를 동기화하지 못해 VM 의 `tsc` 가 거짓 구문 오류를 보고했다**
  (Hub-Backend mock-application 파일, 호스트 파일은 정상). → 원격/VM 에서 이상한 구문 오류가 나면
  **먼저 PC 에서 같은 파일을 열어 확인**하고, 빌드·`prisma generate` 검증은 PC 에서 한다.
- DB·`prisma db push` 관련 사고 교훈은 `AGENTS.md` 공통 규칙 1·고유 규칙 1에 이미 있다.
