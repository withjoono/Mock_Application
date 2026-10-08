# T 모지 — iOS 앱스토어 제출 구현 계획

> 작성: 2026-10-08 · 대상: App Store (iOS) 1차 제출
> 상태 기준: 번들ID `kr.tskool.mockapply`, ascAppId `6812627982`, Apple ID `geobukacademy@gmail.com` (eas.json 반영 완료)

## 전제: 제출 전 반드시 통과해야 하는 선행 조건

2026-10-08 실측 기준입니다. P1은 완료됐고, P2~P4의 남은 조치가 끝나야 제출할 수 있습니다.

| # | 상태 | 선행 조건 | 2026-10-08 확인 결과 |
|---|------|-----------|----------------------|
| P1 | **완료** | `npm install` + 로컬 실행 | SDK 52 의존성 정렬, TypeScript 통과, production Metro 기동, iOS·Android Hermes 번들 생성 성공 |
| P2 | **추가 배포 필요** | Hub-Backend 프로드 배포 | 기존 `ma_*` 라우트는 이미 프로드에 배포됨. 이번 순위·경쟁률·권위 수시 검색·시즌 연장 변경은 별도 push/Actions 배포 필요 |
| P3 | **배포 필요** | 개인정보처리방침 URL 라이브 | URL은 HTTP 200. 로컬 정책의 대표자명을 `강준호`로 수정했으나 공개본은 아직 `[대표자명]`이므로 Hub Frontend 배포 필요 |
| P4 | **미확인** | `owner: "junhokang"`와 EAS 계정 일치 | 현재 CLI는 `Not logged in`. `eas login` 후 `eas whoami`와 프로젝트 연결 확인 필요 |

P1 보완 과정에서 `expo-asset`, `expo-font`를 명시적 의존성으로 추가했고 `react-native-svg`를 SDK 52 호환 버전으로 정렬했습니다. `npm audit` 경고 65건은 남아 있으나, 자동 강제 수정은 Expo/RN 주버전을 깨뜨리므로 적용하지 않습니다.

프로덕션 DB 신원 게이트 후 확인한 결과 기존 `ma_susi_application`·`ma_jungsi_application`은 모두 0행이고, 정시 모집단위는 2026학년도 5,176행만 있습니다. 서버는 2027 시즌에서 최신 가용 2026 자료를 선택해 `target_data_year`로 보존하고 앱에 기준 학년을 명시합니다. 2027 모집단위가 적재되면 자동으로 2027 자료로 전환됩니다.

---

## 1. iOS production 빌드 업로드

**담당: 사용자 인증 필요 (Expo/Apple 로그인 단계)**

```bash
cd E:\Dev\github\Mock_Application
npm install                  # P1 완료; 잠금파일 기준 재현 설치
npx expo install --check    # SDK 52 버전 정렬 확인
eas login                   # owner 계정으로 로그인
eas build --platform ios --profile production
# 빌드 완료 후 (TestFlight 자동 업로드):
eas submit --platform ios --profile production
```

- 번들ID `kr.tskool.mockapply` / ascAppId `6812627982` → eas.json에 이미 설정됨
- `eas submit`이 App Store Connect로 바이너리 전송 → 처리까지 수십 분
- **App Store Connect → TestFlight/빌드 항목**에서 처리 완료된 빌드를 "앱 버전 1.0 제출"의 빌드로 선택

> 체크: 빌드 전 `app.json`의 `buildNumber`/`version`(현재 1 / 1.0.0) 확인. 재제출 시 buildNumber 올려야 함(production 프로필 autoIncrement가 처리).

## 2. 앱 스크린샷 등록

**담당: 사용자 촬영 / Claude는 촬영할 화면·구성 가이드 제공**

- 촬영처: iOS 시뮬레이터(Xcode) 또는 실기기. App Store는 **6.7"(iPhone 15 Pro Max 등) 필수**, 6.5"는 선택
- 최소 1장, 권장 4~6장. 촬영 대상:
  1. 시즌 홈 (로그인 후 — 6/9월 모평·수시·정시 카드)
  2. 수시 모의지원 (6슬롯 화면)
  3. 정시/모평 모의지원 (가·나·다 3슬롯)
  4. 실시간 경쟁률·순위 조회
  5. (선택) 로그인 화면
- 캡처는 **P2 배포 후 실데이터가 떠야** 제대로 나옴. 데모 데이터로 찍지 말 것
- 시뮬레이터 캡처: `Cmd+S` 또는 `xcrun simctl io booted screenshot shot.png`

## 3. 앱 심사 정보 입력 (App Store Connect → 앱 심사 정보)

**담당: 사용자 입력 / Claude가 메모 문안·테스트 계정 요건 작성**

- **테스트 계정**: Hub 계정으로 로그인하는 심사용 계정 1개 생성 필요 (이메일+비밀번호). 모의지원 시즌이 열려 있어야 기능 확인 가능
- **담당자 연락처**: 이름·전화번호·이메일 (geobukacademy@gmail.com)
- **심사 메모 (예시 문안)**:
  > 본 앱은 거북스쿨(T Skool) 통합계정으로 로그인합니다. 제공된 테스트 계정(ID/PW)으로 로그인 후, 홈 화면의 시즌 카드(수시/정시/모평)를 선택해 모의지원을 체험할 수 있습니다. 모의지원 제출→경쟁률 조회→취소→회원탈퇴 순으로 확인 가능합니다. 소셜 로그인은 현재 미제공, 이메일 로그인만 지원합니다.

## 4. 앱 정보 항목 완료

**담당: 사용자 입력 / Claude가 각 답변 가이드**

| 항목 | 값/가이드 |
|------|-----------|
| 연령 등급 | 폭력·성·도박 없음 → **4+** 예상. 설문은 전부 "없음"/"아니오" |
| 개인정보처리방침 URL | https://www.tskool.kr/tmoji-privacy.html (P3 라이브 후) |
| App Privacy (데이터 수집) | 수집함: **연락처 정보**(이메일·이름·전화 = 계정), **사용자 콘텐츠**(성적 입력값·지원 내역), **식별자**(계정 ID). 용도: 앱 기능. 제3자 공유 없음. 추적(ATT) 없음 |
| 콘텐츠 권리 | 제3자 콘텐츠 없음 → "아니오" |
| 수출 규정(암호화) | HTTPS 표준 암호화만 사용 → 면제. `ITSAppUsesNonExemptEncryption: false` 이미 Info.plist에 설정됨 |

## 5. 기능 검증 (제출 전 실기기/시뮬레이터 스모크 테스트)

**담당: 사용자 실행 / Claude가 체크리스트 + 버그 수정 지원**

P2(백엔드 배포) 후 production 또는 preview 빌드로 아래 전 항목 통과 확인:

- [ ] 로그인 (이메일) + 토큰 유지(앱 재시작 후 로그인 상태 유지)
- [ ] 6월·9월 평가원 모의지원 (가·나·다 각 1회, 군 중복 시 차단)
- [ ] 수시 모의지원 (슬롯 1~6, 7번째 차단, 같은 모집단위 중복 차단)
- [ ] 정시 모의지원 (가·나·다)
- [ ] 모집단위 검색 (대학명/모집단위명)
- [ ] 경쟁률·순위·분포 조회
- [ ] 지원 취소
- [ ] 회원 탈퇴 (2단계 확인 → 익명화 → 재로그인 불가)

---

## 담당 분리 요약

**Claude가 지금 할 수 있는 것** (코드/문안):
- `(Native)` 폴더 아카이브 정리
- 개인정보처리방침 `[대표자명]` 자리 외 문안 확정, App Privacy/심사메모 문안 작성 (본 문서에 포함)
- 스모크 테스트에서 나온 버그 수정
- 스크린샷용 화면 구성·문구 다듬기

**사용자만 할 수 있는 것** (계정/빌드/입력):
- P1 `npm install`·로컬 실행, P2 `git push`(배포), P3 정책 배포, P4 EAS 계정 확인
- `eas build`/`eas submit` 실행 (Apple 인증)
- App Store Connect 폼 입력(심사정보·앱정보·App Privacy·스크린샷 업로드)
- 심사용 테스트 계정 생성

## 권장 실행 순서

P1 로컬 실행 → P2 백엔드 배포 → P4 EAS 계정 확인 → 5번 기능 검증(dev) → P3 정책 배포 → 1번 production 빌드/submit → 2번 스크린샷 → 3·4번 ASC 폼 입력 → 앱 버전 제출
