# 모의지원앱 출시 체크리스트

> 작성: 2026-06-05 · 최종 점검: 2026-10-08 · 대상: Android(Play Store) / iOS(App Store)

## 1. 저장소 & 프로드 배포

**저장소 구조**: Hub는 허브 역할만, 각 위성앱은 별도 저장소. 이 앱의 저장소는 `withjoono/Mock_Application`.
(샌드박스에서 git init 시 메타데이터가 손상되어 저장소 초기화는 PC에서 직접 실행해야 함)

### 1-A. Mock_Application 저장소 초기화 + push (PC에서)

```bash
cd E:\Dev\github\Mock_Application
git init -b main
git remote add origin https://github.com/withjoono/Mock_Application.git
git add -A
git commit -m "feat: T 모지 v1.0 — 시즌 기반 모의지원 (수시 6회 / 모평·정시 가나다 3회)"
git push -u origin main
```

(_legacy/, node_modules/, 스토어 키 파일은 .gitignore 처리되어 있음)

### 1-B. Hub-Backend 배포 (ma_* API + 탈퇴 + 개인정보처리방침 페이지)

기존 `ma_*` 모듈과 탈퇴 API는 2026-10-05 프로드 배포가 확인됐습니다. 이번에 추가한 실제 경쟁률·내 순위·최초합/예상 추합 순위, `susi.susi_unit` 검색 전환, 6·9월 모평 시즌 연장은 아직 로컬 변경이므로 별도 배포가 필요합니다. Hub 현재 작업트리에는 다른 미완 변경이 함께 있으므로 아래 예전 일괄 `git add` 명령을 그대로 실행하지 말고 T모지 관련 파일만 분리해 배포합니다.

2026-10-08 프로드 읽기 전용 실측(Cloud SQL Proxy 15432 + 신원 게이트): PostgreSQL 14.23/Linux, `susi_calculation_formula=1,267`, `susi_unit=33,770`, `ma_susi_application=0`, `ma_jungsi_application=0`. 정시 `js_admission`은 2026학년도 5,176행만 있고 2027행은 아직 없습니다. 따라서 서버는 시즌 학년도 이하의 최신 자료(현재 2026)를 선택하고 `target_data_year`에 저장하며, 앱에도 `2026학년도 자료`라고 명시합니다. 2027 데이터가 적재되면 별도 코드 변경 없이 2027 자료를 우선 사용합니다.

배포는 GitHub Actions가 자동 처리합니다 (`.github/workflows/deploy-backend.yml`).
main에 push하면: yarn install(→prisma generate 자동) → build → **Cloud SQL 프록시로 `prisma migrate deploy` 자동 실행**(ma_* 테이블 + 2027 시즌 시드 생성) → App Engine 배포. Hub-Frontend 변경(`public/tmoji-privacy.html`)은 별도 frontend workflow가 Firebase Hosting에 배포.

```bash
cd E:\Dev\github\Hub
git add Hub-Backend/prisma Hub-Backend/src/modules/mock-application Hub-Backend/src/modules/account Hub-Backend/src/app.module.ts Hub-Frontend/public/tmoji-privacy.html CLAUDE.md
git commit -m "feat: 모의지원(ma_*) 모듈 + 셀프 회원탈퇴 + T모지 개인정보처리방침"
git push origin main
# 진행 확인: gh run watch -R withjoono/Hub
```

### 배포 후 검증 시나리오 (prod)

```bash
BASE=https://ts-back-nest-479305.du.r.appspot.com
# 1) 로그인 → 토큰 획득
curl -s -X POST $BASE/auth/login/email -H 'Content-Type: application/json' \
  -d '{"email":"<테스트계정>","password":"<비밀번호>"}'
# 2) 시즌 목록 (6·9월 모평 시즌이 isOpen=true로 나와야 함)
curl -s $BASE/mock-application/seasons -H "Authorization: Bearer $TOKEN"
# 3) 검색 (susi/jungsi 실데이터 조인 확인)
curl -s "$BASE/mock-application/search/jungsi?keyword=%EC%84%9C%EC%9A%B8&season_id=<시즌ID>&gun_type=%EA%B0%80" -H "Authorization: Bearer $TOKEN"
# 4) 지원 제출 → 군별 1회 제한 확인 (같은 군 2번째 제출 시 409)
# 5) Swagger: $BASE/swagger 의 'MockApplication (모의지원 ma_*)' 태그
```

검증 포인트: 시즌 4개 시드 / 검색이 실데이터 반환 / 수시 7번째 제출 409 / 가군 중복 409 / 탈퇴(DELETE /account/me) 후 로그인 불가.

## 2. 1차 출시 범위 (확정)

**포함**: 로그인(이메일) → 시즌 홈 → 모의지원(수시 6슬롯 / 모평·정시 가나다 3슬롯) → 실시간 경쟁률 → 취소 → 회원 탈퇴
**Convex 완전 제거됨** (관련 파일은 `_legacy/convex-removed/` 보관, `convex` 의존성 제거 — `npm install` 재실행 필요)
**잔여 데모 화면** (StandardScoreInput, CollegeSelect, SupportStatus/Cut, Strategy, SupportStrategy, MockApply, ScoreAnalysis): `__DEV__` 게이트로 **프로덕션 빌드에서 비노출 처리 완료** (HamburgerMenu + MainScreen 폴백). 개발 빌드에서는 그대로 접근 가능. v1.1에서 실데이터 연동 후 노출 예정

## 3. 계정·보안 (구현 완료)

- [x] 앱 내 회원 탈퇴 (Apple/Google 필수) — `DELETE /account/me`: 개인정보 익명화 + 계정 정지 + ma_* 데이터 삭제. MainScreen 프로필 아래 2단계 확인 후 실행
- [x] 토큰 SecureStore(Keychain/Keystore) 저장 + AsyncStorage 1회 마이그레이션 (`expo-secure-store` 의존성 추가 — `npm install` 필요)
- [ ] (선택) 탈퇴 시 refresh token 서버측 블랙리스트 — 현재는 익명화로 재로그인 차단, 발급된 access token은 최대 2h 유효
- [ ] (확인) JwtAuthGuard가 `account_stop_yn='Y'` 계정을 거부하는지 — 거부 안 하면 가드에 체크 추가 권장

## 4. 스토어 메타데이터

### 반영 완료
- [x] 번들 ID/패키지명: `kr.tskool.mockapply` (Apple App ID 및 App Store Connect 신규 등록)
- [x] iOS: `supportsTablet: false`, `ITSAppUsesNonExemptEncryption: false` (심사 단축)
- [x] Android production 빌드: APK → **AAB**(Play Store 필수, buildType 제거로 기본값)
- [x] EAS 프로필별 `EXPO_PUBLIC_ENV` 주입 → `lib/api/config.ts`가 prod URL 선택
- [x] eas.json submit 정보 골격 (ascAppId는 App Store Connect 앱 생성 후 입력)

### 사용자가 직접 해야 하는 것
- [ ] **개발자 계정**: Apple Developer($99/년), Google Play Console($25 1회) — geobukacademy@gmail.com 권장
- [x] ~~아이콘/스플래시 교체~~ — T 모지 브랜드 아이콘 4종 생성 완료 (#0B5FFF, T 모노그램 + 가나다 3점). 더 다듬으려면 디자이너 작업으로 교체 가능
- [ ] **개인정보처리방침 공개본 갱신** — URL은 현재 열리지만 공개본에 `[대표자명]`이 남아 있음. 로컬 `Hub-Frontend/public/tmoji-privacy.html`은 `강준호`로 수정 완료했으므로 Hub Frontend 배포 후 공개본 재확인
- [ ] **데이터 안전 설문**(Play Console) / **App Privacy**(App Store Connect) 작성
- [ ] **심사용 테스트 계정** 제공 (로그인 필수 앱이므로 양쪽 모두 요구)
- [ ] 스크린샷 (iPhone 6.7"/6.5", Android 폰 최소 2장)
- [x] 앱 이름 확정: **"T 모지"** / 설명: "수시/정시 무료 모의지원 앱" / 푸터: © T Skool (tskool.kr 링크)

### 빌드·제출 명령

```bash
npm install                       # 2026-10-08 성공
npx expo install --check          # 2026-10-08 SDK 52 정렬 확인
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit -p android / eas submit -p ios
```

## 5. 남은 기술 항목 (출시 전 권장)

- [x] 로컬 production Metro 및 iOS·Android Hermes 번들 스모크 테스트
- [x] TypeScript 검사 (`_legacy`는 빌드 대상에서 제외)

- [ ] 크래시 리포팅 (Sentry expo SDK)
- [ ] e2e 테스트 갱신 (Convex 가정 제거, 시즌 플로우 반영)
- [ ] 소셜 로그인 (추가 시 Apple 로그인 의무 발생 주의)
- [ ] 시즌 `result_open_at` 운영 정책 결정 (실시간 공개 vs 마감 후 공개)
