---
name: release-and-store
description: T모지 EAS 빌드·스토어 제출 상태, Expo 라 브랜드 자산 동기화가 MANUAL 인 점, git 리포 미초기화 상태, __DEV__ 게이트로 숨긴 미완성 화면
type: project
---

# 출시 · 스토어 · 자산

원본 체크리스트: `docs/release-checklist.md` (2026-06-05 작성). 아래는 2026-09-03 리포 실측으로 재확인한 내용이다.

## 1. ⚠️ 이 폴더는 git 리포가 아니다

`Mock_Application/` 에 **`.git` 디렉터리가 없다**(실측 확인).

`docs/release-checklist.md` 1-A 가 그 이유를 적어 두었다 —
*"샌드박스에서 git init 시 메타데이터가 손상되어 저장소 초기화는 PC에서 직접 실행해야 함"*.
그 단계가 **아직 끝나지 않은 상태**로 보인다.

```bash
git init -b main
git remote add origin https://github.com/withjoono/Mock_Application.git
git add -A && git commit -m "..."
git push -u origin main
```

- 커밋·PR 작업 전에 **원격에 이미 내용이 있는지 먼저 확인**할 것(덮어쓰기 위험).
- `.gitignore` 는 이미 준비돼 있다: `node_modules/`, `.expo/`, `dist/`, `web-build/`, `_legacy/`,
  `*.jks` `*.p8` `*.p12` `*.key` `*.mobileprovision`, `play-service-account.json`, `google-services.json`,
  `.env*`, `playwright-report/`, `test-results/`.
- ⚠️ 별도 폴더 **`github/Mock-Application(Native)/`** 가 존재한다. 구 React Native CLI 버전이고
  자체 `.git` 을 갖고 있다(`src/`, `metro.config.js`, `Susi_재사용자산_매핑.md`, `모의지원_분석_API_요청서.md`).
  **이 리포가 아니다. 혼동 금지.**

## 2. 브랜드 자산은 자동 동기화 대상이 아니다

Hub 의 `brand/apps.json` 등록 내용:

```json
{ "key": "tmoji", "name": "T모지", "tagline": "모의지원 합격 예측",
  "root": "E:/Dev/github/Mock_Application", "kind": "expo", "site": "https://www.tskool.kr" }
```

`brand/sync_brand.py` 의 `sync()` 는 `kind == "expo"` 를 만나면

```python
if app["kind"] == "expo":
    report.append(f"  MANUAL {key:<13} Expo 앱 — assets/ 아이콘 별도 처리")
    return
```

로 **아무것도 복사하지 않고 즉시 반환**한다. Vite/Next 앱처럼 `public/{logo.png,favicon.ico,og-image.png}` 를
받아오거나 `index.html` 마커 블록이 패치되는 일이 **이 앱에는 일어나지 않는다.**

→ 아이콘·스플래시는 **이 리포에서 직접 교체**한다:

```
assets/icon.png            앱 아이콘
assets/adaptive-icon.png   Android adaptive (background #0F0D0B)
assets/splash-icon.png     스플래시 (background #ffffff, resizeMode contain)
assets/favicon.png         web
```

현재 상태: T 모지 브랜드 아이콘 4종 생성 완료(#0B5FFF, T 모노그램 + 가나다 3점). 디자이너 교체 가능.

**이름의 SSOT 는 여전히 Hub `brand/apps.json`** 이다. 표시명을 바꾸려면
`app.json` 의 `expo.name` 과 `apps.json` 의 `name` 을 **함께** 맞춘다.
(현재 `app.json` 은 `"T 모지"`, `apps.json` 은 `"T모지"` — 공백 유무가 다르다. 손댈 때 정리할 것.)

개인정보처리방침은 이 리포가 아니라 **Hub-Frontend `public/tmoji-privacy.html`** 에 있다
(배포되면 `https://www.tskool.kr/tmoji-privacy.html`). 앱 푸터가 이 링크를 건다.
체크리스트에 *"[대표자명] 채워넣은 후 배포할 것"* 이라는 미완 항목이 남아 있다.

## 3. Firebase Hosting 이 없다 — 만들지도 말 것

모바일 전용이라 `firebase.json` · `.firebaserc` · Firebase site 가 **없다.**
생태계 배포 규칙 `firebase deploy --only hosting:<자기-target>`(및 `--only hosting` 단독 금지)은
이 리포에 **해당 사항 없음**이다.

반대 방향의 위험만 남는다: 다른 위성앱 설정을 복사해 여기에 hosting 블록을 만들면
target 없는 배포가 **Hub 의 `ts-front-479305` site 를 덮을 수 있다**(2026-05-16 사고와 동일 형태).
**hosting 설정을 이 리포에 추가하지 말 것.**

## 4. EAS 빌드 프로필 (`eas.json`)

| 프로필 | `EXPO_PUBLIC_ENV` | 특징 |
|---|---|---|
| `development` | development | `developmentClient: true`, internal 배포, iOS simulator, Android **APK** |
| `preview` | staging | internal 배포, Android **APK** |
| `production` | production | `autoIncrement: true`, Android `buildType` 미지정 → **AAB** (Play Store 필수) |

- `cli.appVersionSource: "remote"`.
- **production 을 APK 로 되돌리지 말 것.**
- `EXPO_PUBLIC_ENV` 가 `lib/api/config.ts` 의 환경 선택을 좌우한다. 프로필 없이 빌드하면 localhost 로 나간다.

## 5. 앱 식별자 (`app.json`) — 변경 금지

```
expo.name             "T 모지"
expo.slug             "mock-application"
expo.version          "1.0.0"
ios.bundleIdentifier  kr.tskool.mockapply           buildNumber "1"
android.package       kr.tskool.mockapply           versionCode 1
expo.owner            junhokang
expo.primaryColor     #0B5FFF
runtimeVersion.policy appVersion
```

- `ios.supportsTablet: false`, `ITSAppUsesNonExemptEncryption: false` (심사 단축 목적).
- Android 권한은 `INTERNET` 하나.
- 번들 ID/패키지명은 스토어 메타에 물려 있다. **바꾸면 새 앱이 된다.**

## 6. 제출 설정 (`eas.json` `submit.production`)

- iOS `appleId: geobukacademy@gmail.com`,
  **`ascAppId: "6812627982"`** — 새 App Store Connect 앱 `T모지`에 연결되어 있다.
- Android `serviceAccountKeyPath: ./play-service-account.json`, `track: internal`.
  이 파일은 `.gitignore` 대상이며 리포에 없다. 로컬에 두고 쓰되 **절대 커밋 금지.**

## 7. 남은 출시 항목

`docs/release-checklist.md` 기준 미완(`[ ]`):

- [ ] 개발자 계정 — Apple Developer($99/년), Google Play Console($25 1회). `geobukacademy@gmail.com` 권장
- [ ] Play Console **데이터 안전 설문** / App Store Connect **App Privacy** 작성
- [ ] 심사용 테스트 계정 제공 (로그인 필수 앱이라 양쪽 모두 요구)
- [ ] 스크린샷 — iPhone 6.7"/6.5", Android 폰 최소 2장
- [ ] 크래시 리포팅(Sentry expo SDK)
- [ ] e2e 테스트 갱신 (`tests/e2e` — Convex 가정 제거, 시즌 플로우 반영)
- [ ] 탈퇴 시 refresh token 서버측 블랙리스트 (선택)
- [ ] `JwtAuthGuard` 의 `account_stop_yn='Y'` 거부 여부 확인
- [ ] 시즌 `result_open_at` 운영 정책 결정(실시간 공개 vs 마감 후 공개)

완료(`[x]`): 번들ID/패키지명 확정, iOS 심사 단축 플래그, production AAB, `EXPO_PUBLIC_ENV` 주입,
앱 내 회원 탈퇴, SecureStore 토큰 저장, 브랜드 아이콘 4종, 개인정보처리방침 페이지 작성, 앱 이름·설명 확정.

## 8. 1차 출시 범위와 `__DEV__` 게이트

**포함:** 로그인(이메일) → 시즌 홈 → 모의지원(수시 6슬롯 / 모평·정시 가나다 3슬롯) → 실시간 경쟁률 → 취소 → 회원 탈퇴.
핵심 화면은 `screens/SeasonApplyScreen.tsx` 와 `screens/MainScreen.tsx`.

**Convex 는 완전히 제거됐다.** 관련 파일은 `_legacy/convex-removed/` 에 보관돼 있고 의존성도 빠졌다.
`_legacy/` 는 gitignore 대상이며 **참조 금지**(낡은 사본이다).

**잔여 데모 화면**은 `__DEV__` 게이트 뒤에 있다:

- `components/HamburgerMenu.tsx` — `const DEMO_MENU_ENABLED = __DEV__;`
- `screens/MainScreen.tsx` — `if (__DEV__ && type === 'JUNGSI') { ... }` (폴백 경로)

대상 화면: `StandardScoreInput` · `CollegeSelect` · `SupportStatus` · `SupportCut` · `Strategy` ·
`SupportStrategy` · `MockApply` · `ScoreAnalysis`. (모두 `App.tsx` 의 스택에는 등록돼 있고, **진입 경로만** 막혀 있다.)

> **게이트를 걷어내면 실데이터가 없는 미완성 화면이 스토어 빌드에 그대로 노출된다.**
> v1.1 에서 실데이터를 연동한 뒤 노출하는 것이 계획이다. 그 전에는 `__DEV__` 조건을 제거하지 말 것.
