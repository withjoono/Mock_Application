---
name: auth-and-api-clients
description: T모지의 Hub 이메일 로그인·토큰 저장(SecureStore)·axios 클라이언트 4종과 환경별 API 베이스, prod 에서 유효하지 않은 플레이스홀더 URL
type: reference
---

# 인증 · API 클라이언트

## 1. 인증은 Hub 계정 — 다만 sso_code 흐름이 아니다

다른 위성앱(웹)은 `sso_code` 를 백엔드가 Hub 로 교환하는 Backend Token Exchange 를 쓴다.
이 앱은 **모바일**이라 브라우저 리다이렉트를 쓰지 않고, Hub 백엔드로 **이메일/비밀번호를 직접** 보낸다.

`lib/api/features/auth/apis.ts`

| 함수 | 클라이언트 | Hub 라우트 |
|---|---|---|
| `loginWithEmailAPI` | `hubPublicClient` | `POST /auth/login/email` |
| (프로필 조회) | `hubAuthClient` | `GET /auth/me` |
| (로그아웃) | `hubAuthClient` | `POST /auth/logout` |
| (회원 탈퇴) | `hubAuthClient` | `DELETE /account/me` |

**계정·JWT 의 주인은 Hub 다.** 자체 회원 테이블·자체 로그인 화면·소셜 로그인을 임의로 추가하지 말 것
(소셜 로그인을 넣으면 Apple 로그인 제공이 의무가 된다 — `docs/release-checklist.md` 5절 참고).

상태 관리는 `lib/contexts/AuthContext.tsx` 의 `AuthProvider`(App.tsx 최상위) + `useAuthContext()`.

### 회원 탈퇴는 제거 금지

`DELETE /account/me` 는 **Apple/Google 스토어 심사 필수 요건**이다(앱 내 계정 삭제).
MainScreen 프로필 아래에서 2단계 확인 후 실행된다. Hub 쪽에서 개인정보 익명화 + 계정 정지 + `ma_*` 데이터 삭제를 수행한다.

미해결로 남은 항목(체크리스트 3절, **확인 필요**):
- 탈퇴 시 refresh token 서버측 블랙리스트 없음 — 익명화로 재로그인은 막히지만 **발급된 access token 은 최대 2h 유효**.
- `JwtAuthGuard` 가 `account_stop_yn='Y'` 계정을 거부하는지 미확인.

## 2. 토큰 저장 — SecureStore, 웹은 AsyncStorage 폴백

`lib/api/token-manager.ts`

```ts
const isSecureStoreAvailable = Platform.OS !== 'web';
// 네이티브: expo-secure-store (iOS Keychain / Android Keystore)
// 웹(react-native-web): AsyncStorage 폴백 (SecureStore 미지원)
```

- 키: `accessToken` · `refreshToken`.
- 구버전 AsyncStorage 토큰 → SecureStore **1회 마이그레이션** 로직이 있다(SecureStore 가 비어 있을 때만 이전).
- **토큰 저장을 AsyncStorage 로 되돌리지 말 것.** 스토어 심사·보안 리스크다.

## 3. axios 클라이언트 4종

`lib/api/instances.ts`

| 클라이언트 | 베이스 | 인증 |
|---|---|---|
| `publicClient` | `config.apiUrlNest` | 없음 |
| `authClient` | `config.apiUrlNest` | Bearer |
| `hubPublicClient` | `config.apiUrlHub` | 없음 |
| `hubAuthClient` | `config.apiUrlHub` | Bearer |
| (spring 계열) | `config.apiUrlSpring` | — |

공통 동작:

- 요청/응답 키를 `humps` 로 snake_case ↔ camelCase 변환.
- 401 → refresh 시도 → 재시도. 실패 시 토큰 정리 + 주입된 `onLogout` 콜백 호출(`setLogoutHandler`).
- 타임아웃 30초, `retryCount: 3`, `retryDelay: 1000` (`config.ts`).
- 에러 코드 매핑은 `lib/api/error-codes.ts`.

## 4. ⚠️ 환경별 API 베이스 — prod 에서 유효한 것은 Hub 것뿐

`lib/api/config.ts`

| 키 | development | staging | production |
|---|---|---|---|
| `apiUrlHub` | `http://localhost:4000` | `https://ts-back-nest-479305.du.r.appspot.com` | `https://ts-back-nest-479305.du.r.appspot.com` ✅ |
| `apiUrlNest` | `http://localhost:3001` ❓ | `https://staging-api.example.com` ❌ | `https://api.example.com` ❌ |
| `apiUrlSpring` | `http://localhost:8080` ❓ | `https://staging-spring.example.com` ❌ | `https://spring.example.com` ❌ |

- `example.com` 주소들은 **플레이스홀더**다. 실제 서비스 주소로 착각하지 말 것.
- 모의지원 본 기능과 인증은 전부 **Hub 클라이언트**를 쓰므로 영향이 없다.
- 영향을 받는 것: `lib/api/features/jungsi/apis.ts` — `authClient`(= `apiUrlNest`) 로
  `/jungsi/calculate`, `/jungsi/calculate/raw`, `/jungsi/calculate/standard`, `/jungsi/scores`,
  `/jungsi/recalculate/:id`, `/jungsi/universities`, `/jungsi/calculation/recent|save` 를 호출한다.
  → **prod 빌드에서는 존재하지 않는 도메인을 부르므로 동작하지 않는다.**
- 다행히 `useJungsi` 훅(`lib/hooks/useJungsi.ts`)은 `lib/hooks/index.ts` 에서 export 만 되고
  **화면 어디에서도 호출되지 않는다**(2026-09-03 실측). 그래서 현재 사용자에게 드러나는 문제는 없다.
- 정시 환산 기능을 살리려면 **먼저 `apiUrlNest`/`apiUrlSpring` 의 실제 주소를 정하는 것**이 선행 작업이다.
  Jungsi 백엔드는 App Engine `jungsi-backend` 이므로 그쪽 주소가 후보다 — **확인 필요.**
- dev 의 `apiUrlNest: http://localhost:3001` 도 의심스럽다. 전역 포트 레지스트리에서 **3001 은 Susi 프런트**다.
  Jungsi 백엔드 dev 포트는 4002 다. **확인 필요.**

## 5. 환경 선택 방식

```ts
const envVar = process.env.EXPO_PUBLIC_ENV;                       // EAS 빌드 프로필이 주입
const releaseChannel = Constants.expoConfig?.extra?.releaseChannel; // 레거시 폴백
const channel = envVar || releaseChannel;
// 'production' | 'staging' | 그 외 → development
```

`eas.json` 의 각 프로필이 `env.EXPO_PUBLIC_ENV` 를 넣는다(development / staging / production).

> **`EXPO_PUBLIC_ENV` 없이 빌드하면 development 로 떨어져 `localhost` 를 부른다.**
> 스토어 빌드는 반드시 `--profile production` 으로 만들 것.

## 6. 데이터 타입

- `lib/types/mock-application.ts` · `lib/types/score-analysis.ts`
- `lib/api/features/mock-application/interfaces.ts` — `IMaSeason` · `IMaSusiApplication` · `IMaJungsiApplication` ·
  `IMyApplicationsResponse` · `ICreateSusiApplicationRequest` · `ICreateJungsiApplicationRequest` ·
  `IMaStats` · `MaStatsTargetType` · `ISusiSearchResult` · `IJungsiSearchResult` · `GunType`

이 인터페이스들은 **Hub 컨트롤러 응답의 거울**이다. Hub 를 고치지 않고 여기만 바꾸면 런타임에서 어긋난다.
