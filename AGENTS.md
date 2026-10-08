# AGENTS.md — Mock_Application (T모지)

> Codex가 이 파일을 자동으로 읽는다. **여기 적힌 것은 링크가 아니라 규칙이다.**
> 세부 배경은 `docs/context/` 에 있고, 아래 색인에서 필요한 것만 열어 본다.

## 이 리포는 무엇인가

**T모지 — 수시/정시 무료 모의지원 앱.** 합격예측을 위한 모의지원을 받고 실시간 경쟁률·분포를 보여준다.
**Expo(SDK 52) + React Native 0.76, 모바일 전용.** 웹 프런트도 Firebase Hosting site 도 **없다.**

- `App.tsx` / `index.ts` — Expo `registerRootComponent`, React Navigation native-stack
- `screens/` (11) · `components/` (16) · `lib/{api,contexts,hooks,types}` · `assets/` · `docs/` · `tests/e2e`(Playwright, web 대상)
- `_legacy/` — 구버전 + 제거된 Convex 코드 보관. **`.gitignore` 대상이고 빌드와 무관하다. 참조 금지**
- 시즌 기반 UI — `ma_season` 이 단일 진실. 수시 슬롯 1~6(6회), 6/9월 모평·정시는 가/나/다 군별 1회(3회)
- 앱스토어 출시 예정 (`docs/release-checklist.md`)

### 🔴 백엔드는 이 리포에 없다 — Hub 의 `/mock-application/*` 이다

이 앱에는 **서버 코드도, Prisma 스키마도, `app.yaml` 도 없는 것이 정상**이다. 여기서 백엔드를 찾지 말 것.

- API 계약의 주인: **`withjoono/Hub`** 의 `Hub-Backend/src/modules/mock-application/`
  (`@Controller('mock-application')`) — App Engine **`default`** 서비스에 실린다.
- 테이블도 Hub 소유: Hub-Backend `prisma/schema.prisma` 의 `ma_season` · `ma_susi_application` ·
  `ma_jungsi_application` · `ma_application_stats`, 전부 **`@@schema("hub")`**.
- **API 계약을 바꾸려면 Hub 리포를 고쳐 배포해야 한다.** 이 리포만 고치면 아무 일도 일어나지 않는다.
- 자세한 라우트·필드·제약은 `docs/context/hub-backend-contract.md` 를 볼 것.

**인증은 Hub(tskool.kr)에 전부 위임한다. 자체 로그인·자체 회원 DB를 만들지 말 것.**
다만 모바일이라 브라우저 리다이렉트 SSO 가 아니라 **Hub 백엔드로 이메일/비밀번호를 직접 보내는 방식**이다
(`POST /auth/login/email`). 계정과 JWT 의 주인은 여전히 Hub 다.

DB는 Cloud SQL `geobukschool_prod` 를 **스키마 격리로 공유**하지만, 이 앱은 **DB에 직접 접속하지 않는다** — 전부 Hub API 경유다.

## 🚨 생태계 공통 규칙 (읽지 않고 작업 금지)

이 5개는 링크가 아니라 본문이다. 전 리포 공통이며, 위반 시 프로덕션 데이터가 깨진다.

### 1. DB 접속 직후 신원 게이트 — 생략 금지

**"접속 성공"은 prod에 붙었다는 증거가 전혀 아니다.** 로컬에도 `geobukschool_prod` 라는 **같은 이름의 DB**가 있고 `tsuser` 자격증명까지 통과하므로, 포트·DB명·유저·비밀번호가 **전 단계 모두 통과**하면서도 엉뚱한 DB를 보게 된다.

> 실제 사고 (2026-08-19): `cloud-sql-proxy --port 5433` 이 로컬 postgres의 5433 점유로 기동 실패했는데 `netstat` LISTENING만 보고 떴다고 오인. prod를 "환산식 0행 / susi_unit 없음"으로 보고했으나 실제 prod는 formula 1,267행·susi_unit 33,770행으로 정상 가동 중이었다. 멀쩡한 작업 메모를 거짓으로 판정할 뻔했다.

접속 직후 **무조건** 이 쿼리부터 실행한다:

```sql
SELECT current_database(), inet_server_port(), version();
--  prod  = "PostgreSQL 14.x on x86_64-pc-linux-gnu"
--  로컬  = "PostgreSQL 18.x on x86_64-windows"   ← 즉시 중단

SELECT count(*) FROM susi.susi_calculation_formula;  -- prod ≈ 1,267 (year 2027)
SELECT count(*) FROM susi.susi_unit;                 -- prod ≈ 33,770
```

행 수가 기대치와 다르면 **그건 prod가 아니다.** 스키마 존재 여부만으로 판정하지 말 것 — 로컬에도 같은 스키마가 있다.

- **5433을 프록시 포트로 쓰지 말 것.** 로컬 Windows postgres 상시 점유 대역이다. 15432·15433 등 비어 있는 포트를 쓴다.
- 프록시는 **분리 실행**하고 기동 성공을 프로세스/로그로 확인한다. `netstat` LISTENING은 근거가 안 된다(누가 듣고 있는지 알 수 없음).
- `app.yaml` 은 Secret에서 재생성되므로 그 파일의 접속 정보를 신뢰하지 말 것.
- 메모에 "prod 실측 확인"이라 적을 때는 **위 게이트 출력을 함께 붙인다.** 출력이 없으면 미확인으로 취급한다.
- 저장된 메모와 실측이 충돌하면 **메모보다 접속 대상을 먼저 의심한다.**

### 2. 척도 3컬럼 — `max_score` / `real_max_score` / `score_scale`

`susi.susi_calculation_formula` 의 세 컬럼은 서로 다른 척도다. 혼동하면 환산점수가 통째로 틀린다.

| 컬럼 | 의미 |
|---|---|
| `max_score` | **환산식 내부 만점.** 대학마다 제각각(1·10·100·125·400·720…). 시드 JSON 유래. |
| `real_max_score` | **대학별 실제 환산 만점**(유웨이 크롤값). `rescale-formulas.py` 의 `UW_MAXSCORE` 딕셔너리가 원본. |
| `score_scale` | `real_max_score / max_score`. 엔진 raw 점수를 **입결 척도로 올리는 배율**. |

적용 지점:

- **저장** — 엔진 원점수(raw) 그대로 저장한다. 척도 보정을 하지 않는다.
- **조회** — `convertedScore = raw × score_scale`. **조회 시점 적용**이므로 값을 바꿔도 `susi_user_factor_score` 재계산·캐시 무효화가 필요 없다.
- **백분율 분모** — `real_max_score` 우선, 없으면 `max_score` 폴백. 내 환산점수와 예상컷(환산 50컷/70컷)이 **둘 다 입결 척도**이므로 분모도 입결 척도여야 한다.
- 엔진이 실척도를 직접 산출하는 경우 `score_scale` 은 **반드시 1** — 이중 보정 금지.

### 3. 권위 테이블은 `susi.susi_unit`

- `susi.susi_unit` — **2027 모집단위 권위 테이블** (prod 33,770행). `conversion_factor_id` 가 이미 붙어 있다.
- `hub.susi_kyokwa_recruitment` — **비어 있는 레거시.** 개념 중복이 아니라 그냥 빈 테이블이다.

→ `susi_unit` 생성·적재·크로스워크 작업은 **전부 불필요하다.** 이 테이블을 "만들어야 한다"고 판단했다면 잘못된 DB를 보고 있는 것이다(규칙 1로 돌아갈 것).

### 4. DRY-RUN 기본, 쓰기는 `--apply` 명시

DB를 수정하는 모든 스크립트는 **인자 없이 실행하면 DRY-RUN**이어야 한다.

- 기본 동작: 변경 대상과 before/after를 출력만 하고 **커밋하지 않는다**(`conn.rollback()`).
- 실제 쓰기: `--apply` 를 **명시적으로** 붙였을 때만. `conn.autocommit = False` + 명시적 `commit()`.
- 출력에 현재 접속 대상(규칙 1의 게이트 출력)과 영향 행 수를 반드시 찍는다.
- 기존 스크립트에 이 플래그가 없다면 **먼저 추가하고 나서** 실행한다. 예외 없다.

### 5. 어디가 대조 베이스라인 50.2% — 떨어지면 즉시 롤백

환산 엔진 관련 변경은 반드시 **어디가 대조를 재실행**해서 검증한다.

- 현재 베이스라인: **일치 + 근사 50.2%** (화이트리스트 대학 기준).
- 변경 후 이 수치보다 **올라가야 정상**이다. 떨어지면 **즉시 롤백**한다.
- 나머지 절반은 엔진을 켜면 틀린 환산점수를 노출하므로 **화이트리스트 대학만** 엔진을 적용한다.
- 배율이 큰 대학(가톨릭대 10배)·하향 조정 대학(건국대)은 자동 수치만 믿지 말고 **개별 육안 확인**한다.

---

## 🔒 Mock_Application 고유 규칙

### 1. 백엔드 작업은 Hub 리포에서 한다

`lib/api/features/mock-application/apis.ts` 의 함수 10개가 Hub 컨트롤러 10개 라우트와 **1:1** 이다.

| 클라이언트 함수 | Hub 라우트 |
|---|---|
| `fetchSeasonsAPI` | `GET /mock-application/seasons` |
| `fetchMyApplicationsAPI` | `GET /mock-application/my?seasonId=` |
| `createSusiApplicationAPI` | `POST /mock-application/susi` |
| `deleteSusiApplicationAPI` | `DELETE /mock-application/susi/:id` |
| `createJungsiApplicationAPI` | `POST /mock-application/jungsi` |
| `deleteJungsiApplicationAPI` | `DELETE /mock-application/jungsi/:id` |
| `searchSusiTargetsAPI` | `GET /mock-application/search/susi?keyword=` |
| `searchJungsiTargetsAPI` | `GET /mock-application/search/jungsi?keyword=&seasonId=&gunType=` |
| `fetchStatsAPI` | `GET /mock-application/stats?seasonId=&targetType=&targetId=` |

- 필드를 추가하거나 응답을 바꾸려면 **Hub 를 먼저 고쳐 배포**하고, 그다음 여기 `interfaces.ts` 를 맞춘다.
- `ma_*` 테이블 마이그레이션·시즌 시드는 Hub 의 `.github/workflows/deploy-backend.yml` 이
  Cloud SQL 프록시로 `prisma migrate deploy` 를 돌려 처리한다(`docs/release-checklist.md`).
- 이 앱에서 **`prisma db push` 를 실행할 일은 없다.** Hub 쪽에서도 금지다 —
  2026-07 에 `prisma db push` 로 공용 `hub` 스키마가 3회 wipe 됐고, `ma_*` 는 바로 그 `hub` 스키마에 있다.
  즉 **이 앱의 데이터는 그 사고의 폭발 반경 안**이다. Hub 스키마 변경은 반드시 `prisma migrate deploy` 로.
- DB 를 직접 볼 일이 생기면 접속 직후 공통 규칙 1의 신원 게이트부터 실행한다.

### 2. 세 개의 API 베이스 중 prod 에서 유효한 것은 Hub 것뿐이다

`lib/api/config.ts` 는 환경별로 세 베이스를 갖는다.

| axios 클라이언트 | 베이스 | development | production |
|---|---|---|---|
| `hubPublicClient` / `hubAuthClient` | `apiUrlHub` | `http://localhost:4000` | `https://ts-back-nest-479305.du.r.appspot.com` ✅ |
| `publicClient` / `authClient` | `apiUrlNest` | `http://localhost:3001` | **`https://api.example.com`** ❌ 플레이스홀더 |
| spring 클라이언트 | `apiUrlSpring` | `http://localhost:8080` | **`https://spring.example.com`** ❌ 플레이스홀더 |

- 모의지원 본 기능과 인증은 **전부 Hub 클라이언트**를 쓰므로 영향이 없다.
- 그러나 `lib/api/features/jungsi/apis.ts`(`/jungsi/calculate`, `/jungsi/scores`, `/jungsi/universities` …)는
  `authClient` 를 쓴다 → **prod 빌드에서는 존재하지 않는 도메인을 부른다. 동작하지 않는다.**
- 현재 `useJungsi` 훅은 `lib/hooks/index.ts` 에서 export 만 되고 **화면 어디서도 호출되지 않는다**(실측 확인).
  정시 환산 기능을 살리려면 **먼저 `apiUrlNest`/`apiUrlSpring` 의 실제 주소를 정하는 것**이 선행 작업이다.
- dev 의 `apiUrlNest: http://localhost:3001` 도 의심스럽다 — 전역 포트 레지스트리에서 **3001 은 Susi 프런트**다.
  백엔드 주소로는 맞지 않는다. **확인 필요.**
- `api.example.com`·`spring.example.com` 을 실제 서비스 주소로 착각하지 말 것.

### 3. 인증 — Hub 계정, 이메일 로그인, SecureStore

`lib/api/features/auth/apis.ts` + `lib/contexts/AuthContext.tsx`

```
POST   /auth/login/email     (hubPublicClient) → accessToken / refreshToken
GET    /auth/me              (hubAuthClient)
POST   /auth/logout          (hubAuthClient)
DELETE /account/me           (hubAuthClient)  ← 앱 내 회원 탈퇴
```

- **sso_code 교환 흐름이 아니다.** 모바일이라 브라우저 리다이렉트를 쓰지 않고 Hub 백엔드로 자격증명을 직접 보낸다.
  그래도 **계정·JWT 의 주인은 Hub** 이며, 자체 회원 테이블이나 자체 로그인 화면을 만들지 말 것.
- 토큰 저장: `lib/api/token-manager.ts` — 네이티브는 `expo-secure-store`(Keychain/Keystore),
  웹(react-native-web)은 SecureStore 미지원이라 `AsyncStorage` 폴백. 구버전 AsyncStorage 토큰의 1회 마이그레이션 로직이 있다.
  **토큰을 AsyncStorage 로 되돌리지 말 것** — 스토어 심사 리스크다.
- `instances.ts` 는 401 시 refresh → 재시도, 실패 시 `onLogout` 콜백을 태운다. 요청/응답은 `humps` 로 snake↔camel 변환된다.
- **`DELETE /account/me`(앱 내 회원 탈퇴)는 Apple/Google 심사 필수 요건이다. 제거 금지.**
  탈퇴는 개인정보 익명화 + 계정 정지 + `ma_*` 데이터 삭제로 동작한다(Hub 쪽 구현).

### 4. 브랜드 자산은 자동 동기화 대상이 아니다 — 수동 처리

Hub 의 `brand/apps.json` 에 이 앱은 이렇게 등록돼 있다:

```json
{ "key": "tmoji", "name": "T모지", "tagline": "모의지원 합격 예측",
  "root": "E:/Dev/github/Mock_Application", "kind": "expo", "site": "https://www.tskool.kr" }
```

`brand/sync_brand.py` 는 `app["kind"] == "expo"` 를 만나면 곧바로

```
MANUAL tmoji         Expo 앱 — assets/ 아이콘 별도 처리
```

를 찍고 **아무것도 복사하지 않고 건너뛴다.**

- 따라서 `assets/icon.png` · `adaptive-icon.png` · `splash-icon.png` · `favicon.png` 는 **이 리포에서 직접 교체**한다.
  `python brand/sync_brand.py` 를 돌려도 이 앱은 갱신되지 않는다.
- 다만 **앱 표시명·부제의 SSOT 는 여전히 Hub `brand/apps.json`** 이다. 이름을 바꾸려면
  `app.json` 의 `expo.name`(현재 `"T 모지"`)과 `apps.json` 의 `name`(현재 `"T모지"`)을 **함께** 맞춘다.
  (현재 공백 유무가 서로 다르다 — 손댈 때 정리할 것.)
- 개인정보처리방침 페이지는 이 리포가 아니라 **Hub-Frontend 의 `public/tmoji-privacy.html`** 에 있다
  (배포되면 `https://www.tskool.kr/tmoji-privacy.html`). 앱 푸터가 이 링크를 건다.

### 5. Firebase Hosting 이 없다 — hosting 블록을 만들지 말 것

모바일 전용이라 이 앱에는 Firebase site 도 `firebase.json` 도 `.firebaserc` 도 **없다.**

- 생태계 배포 규칙 **`firebase deploy --only hosting:<자기-target>` / `--only hosting` 단독 금지**는
  이 리포에 **해당 사항이 없다.**
- 그러나 반대 방향의 위험이 있다: 다른 위성앱 설정을 복사해 와 여기에 hosting 블록을 만들면,
  target 없는 배포가 **Hub 의 `ts-front-479305` site 를 덮을 수 있다**(2026-05-16 사고와 같은 형태).
  **hosting 설정을 이 리포에 추가하지 말 것.**

### 6. 출시 경로는 EAS 다

- `eas build --platform android|ios --profile production` → `eas submit -p android|ios`.
- production 프로필: `autoIncrement: true`, `env.EXPO_PUBLIC_ENV = "production"`.
  이 값이 `lib/api/config.ts` 의 환경 선택을 좌우한다 — **`EXPO_PUBLIC_ENV` 없이 빌드하면 development URL(localhost)로 나간다.**
- Android production 은 `buildType` 을 지정하지 않아 기본값 **AAB** 로 빌드된다(Play Store 필수). APK 로 되돌리지 말 것.
- 번들 ID / 패키지명: **`kr.tskool.mockapply`** (iOS·Android 동일). 변경 금지 — 새 스토어 메타에 물려 있다.
- `eas.json` 의 `submit.production.ios.ascAppId` 는 새 App Store Connect 앱 **`6812627982`** 다.
- `submit.production.android.serviceAccountKeyPath: ./play-service-account.json` — 이 파일은 `.gitignore` 대상이며 리포에 없다.
  로컬에 두고 쓰되 **절대 커밋하지 말 것.** `*.jks` · `*.p8` · `*.p12` · `*.key` · `google-services.json` 도 마찬가지다.
- 남은 출시 항목은 `docs/release-checklist.md` 의 체크박스로 관리한다(개발자 계정, Play 데이터 안전 설문 /
  App Store App Privacy, 심사용 테스트 계정, 스크린샷, 크래시 리포팅).

### 7. ⚠️ 이 폴더는 git 리포가 아니다 (2026-09-03 실측)

- `Mock_Application/` 에 **`.git` 이 없다.** `docs/release-checklist.md` 의 1-A 항목이
  *"샌드박스에서 git init 시 메타데이터가 손상되어 저장소 초기화는 PC에서 직접 실행해야 함"* 이라고 적어 둔
  그 단계가 **아직 끝나지 않은 상태**로 보인다.
- 커밋·PR 작업 전에 `git init -b main` + `git remote add origin https://github.com/withjoono/Mock_Application.git`
  상태를 **먼저 확인**할 것. 원격에 이미 내용이 있는지도 확인 필요.
- 별도로 `github/Mock-Application(Native)/` 폴더가 있다 — 구 React Native CLI 버전(`src/`, `metro.config.js`,
  `Susi_재사용자산_매핑.md`)이고 자체 `.git` 을 갖고 있다. **이 리포가 아니다. 혼동 금지.**

### 8. 미완성 화면은 `__DEV__` 게이트 뒤에 있다 — 걷어내지 말 것

- `components/HamburgerMenu.tsx`: `const DEMO_MENU_ENABLED = __DEV__;`
- `screens/MainScreen.tsx`: `if (__DEV__ && type === 'JUNGSI') { ... }`

실데이터가 연결되지 않은 화면(`StandardScoreInput` · `CollegeSelect` · `SupportStatus` · `SupportCut` ·
`Strategy` · `SupportStrategy` · `MockApply` · `ScoreAnalysis`)이 이 게이트로 **프로덕션 빌드에서 숨겨진다.**
게이트를 걷어내면 미완성 화면이 스토어 빌드에 그대로 노출된다. 1차 출시 범위는
**로그인 → 시즌 홈 → 모의지원(`SeasonApplyScreen`) → 실시간 경쟁률 → 취소 → 회원 탈퇴** 다.

### 9. 개발 포트

- 이 앱은 모바일이라 전역 포트 레지스트리에 **자기 포트가 없다.** Metro/Expo dev server 포트를 리포에서 따로 설정하지 않는다(Expo 기본값 사용).
- 반면 `lib/api/config.ts` 의 dev 대상 포트는 **다른 앱의 레지스트리 값**이다 — Hub 백엔드 **4000** 은 고정이며 변경 금지.
- `apiUrlNest`(3001) · `apiUrlSpring`(8080) 은 위 2번대로 검증되지 않았다.

---

## 📇 파일 색인 — `docs/context/`

| 파일 | 언제 읽나 |
|---|---|
| `hub-backend-contract.md` | 모의지원 API·`ma_*` 테이블·제약을 건드릴 때 (**백엔드는 Hub 에 있다**) |
| `auth-and-api-clients.md` | 로그인·토큰·axios 클라이언트·환경별 API 베이스 작업 |
| `release-and-store.md` | EAS 빌드·스토어 제출·브랜드 자산·git 리포 상태 |

> 리포 자체 문서: `docs/ma-db-schema-design.md`(설계안 + 구현 변경 노트), `docs/release-checklist.md`(출시 체크리스트).

---

## 명령어

```bash
npm install
npx expo install --fix        # SDK 52 버전 정렬

npm start                     # = npx expo start
npm run android               # expo run:android
npm run ios                   # expo run:ios
npm run web                   # expo start --web

npx playwright test           # tests/e2e (web 대상)

# 출시 빌드 — EXPO_PUBLIC_ENV 는 eas.json 프로필이 주입한다
eas build --platform android --profile production   # AAB
eas build --platform ios --profile production
eas submit -p android
eas submit -p ios             # eas.json 의 ascAppId 를 먼저 채울 것
```

**포트는 생태계 전역 레지스트리다.** 이 앱은 자체 포트가 없고, dev 에서 부르는 Hub 백엔드 4000 은 변경 금지.
