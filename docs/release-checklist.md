# 모의지원앱 출시 체크리스트

> 작성: 2026-06-05 · 최종 점검: 2026-10-08 · 대상: Android(Play Store) / iOS(App Store)

## 1. 저장소 & 프로드 배포

**저장소 구조**: Hub는 허브 역할만, 각 위성앱은 별도 저장소. 이 앱의 저장소는 `withjoono/Mock_Application`.

### 1-A. Mock_Application 저장소 초기화 + push — 완료

2026-10-08 `main` 최초 커밋 및 `https://github.com/withjoono/Mock_Application.git` push 완료. `_legacy/`, `node_modules/`, 환경 파일, 스토어 키와 빌드 산출물은 `.gitignore` 처리됨.

### 1-B. Hub-Backend 배포 (ma_* API + 탈퇴 + 개인정보처리방침 페이지)

2026-10-08 Hub `main`의 `525b6d5`로 실제 경쟁률·내 순위·최초합/예상 추합 순위, `susi.susi_unit` 검색 전환, 시즌 운영 설정 및 개인정보처리방침을 배포했습니다.

2026-10-08 프로드 읽기 전용 실측(Cloud SQL Proxy 15432 + 신원 게이트): PostgreSQL 14.23/Linux, `susi_calculation_formula=1,267`, `susi_unit=33,770`, `ma_susi_application=0`, `ma_jungsi_application=0`. 정시 `js_admission`은 2026학년도 5,176행만 있고 2027행은 아직 없습니다. 따라서 서버는 시즌 학년도 이하의 최신 자료(현재 2026)를 선택하고 `target_data_year`에 저장하며, 앱에도 `2026학년도 자료`라고 명시합니다. 2027 데이터가 적재되면 별도 코드 변경 없이 2027 자료를 우선 사용합니다.

배포 결과: Prisma migration 및 전체 schema drift 검사 성공, App Engine `default` 버전 `20261008t083432` 배포 성공, Firebase Hosting 배포 성공, production smoke 11개 통과. 정책 URL은 HTTP 200이며 `성명: 강준호`가 반영되고 `[대표자명]`은 제거됐습니다.

2026-10-21 App Review 2.1 거절 대응: 프로덕션 `/mock-application/seasons`가 빈 배열을 반환하는 것을 재현했습니다. 과거 스키마 복구 과정에서 최초 시즌 마이그레이션은 적용 완료로 기록됐지만 시드 행이 누락됐고, 10월 8일 마이그레이션은 기존 행만 갱신해 복구하지 못한 것이 원인이었습니다. Hub `main`의 `afaf15e`가 네 시즌을 멱등 upsert했고, `a9a6f54`는 종료된 2027학년도 6·9월 모평을 일반 사용자에게 다시 닫고 Apple 심사용 계정에만 9월 시즌 접근을 허용했습니다. 후속 `dc38235`는 이 예외를 현재 심사용 2027학년도 9월 시즌으로만 제한해 향후 2028학년도 시즌에 영향을 주지 않게 했습니다. App Engine `default` 버전 `20261021t052707` 배포 로그에서 PostgreSQL 14.23/Linux, `susi_calculation_formula=1,267`, `susi_unit=33,770` 신원 게이트, 전체 schema drift 및 공용 DB 연결 예산 검사를 통과했습니다. 심사용 계정 실측으로 6월 `isOpen=false`, 9월 `isOpen=true`(심사 전용), 정시 모집단위 검색 30건, 지원 생성→조회→취소를 확인했으며 테스트 지원서는 즉시 삭제했습니다. 일반 계정의 종료 시즌 비공개 및 미래 학년도 예외 차단은 단위 테스트로 검증했습니다.

2026-10-22 App Review 5.1.1(v) / 2.3.3 재심사 대응: 계정 없이도 시즌 선택 → 대학·모집단위 검색 → 점수 입력 → 경쟁률·예상 내 순위·최초합 순위·예상 추합 순위를 조회하는 체험 흐름을 추가했습니다. 익명 입력은 서버에 저장하지 않고, 지원서 저장·취소·내 내역만 로그인을 요구합니다. Hub `523c20d`가 프로덕션에 배포됐고, Actions의 빌드·마이그레이션·schema drift·App Engine·CORS 검사가 모두 통과했습니다. 프로덕션 익명 API 실측으로 시즌 4개, 수시/정시 검색 각 30건, 저장 없는 합격예측 200 응답을 확인했습니다.

### 배포 후 검증 시나리오 (prod)

```bash
BASE=https://ts-back-nest-479305.du.r.appspot.com
# 1) 로그인 → 토큰 획득
curl -s -X POST $BASE/auth/login/email -H 'Content-Type: application/json' \
  -d '{"email":"<테스트계정>","password":"<비밀번호>"}'
# 2) 시즌 목록 (일반 계정은 종료 시즌 false, Apple 심사용 계정만 9월 true)
curl -s $BASE/mock-application/seasons -H "Authorization: Bearer $TOKEN"
# 3) 검색 (susi/jungsi 실데이터 조인 확인)
curl -s "$BASE/mock-application/search/jungsi?keyword=%EC%84%9C%EC%9A%B8&season_id=<시즌ID>&gun_type=%EA%B0%80" -H "Authorization: Bearer $TOKEN"
# 4) 지원 제출 → 군별 1회 제한 확인 (같은 군 2번째 제출 시 409)
# 5) Swagger: $BASE/swagger 의 'MockApplication (모의지원 ma_*)' 태그
```

검증 포인트: 시즌 4개 시드 / 검색이 실데이터 반환 / 수시 7번째 제출 409 / 가군 중복 409 / 탈퇴(DELETE /account/me) 후 로그인 불가.

## 2. 1차 출시 범위 (확정)

**포함**: 비회원 시즌·대학 검색 및 저장 없는 합격예측 + 로그인(이메일) 후 모의지원 저장(수시 6슬롯 / 모평·정시 가나다 3슬롯) → 실시간 경쟁률 → 취소 → 회원 탈퇴
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
- [x] EAS owner `junhokang` 웹 계정 일치 확인
- [x] eas.json iOS 제출 정보: Apple ID `withjoono@gmail.com`, ascAppId `6812627982`

### 사용자가 직접 해야 하는 것
- [ ] **개발자 계정**: Apple Developer($99/년), Google Play Console($25 1회) — geobukacademy@gmail.com 권장
- [x] ~~아이콘/스플래시 교체~~ — T 모지 브랜드 아이콘 4종 생성 완료 (#0B5FFF, T 모노그램 + 가나다 3점). 더 다듬으려면 디자이너 작업으로 교체 가능
- [x] **개인정보처리방침 공개본 갱신** — `https://www.tskool.kr/tmoji-privacy` HTTP 200, `성명: 강준호`, placeholder 없음
- [ ] **데이터 안전 설문**(Play Console) / **App Privacy**(App Store Connect) 작성
- [x] **심사용 테스트 계정** App Store Connect에 제공 (계정 기능 확인용; 합격예측 체험은 비회원으로도 가능)
- [ ] 스크린샷 업로드 (iPhone 6.7"/6.5", Android 폰 최소 2장) — `docs/store-screenshots/` 에 홈·시즌·검색·예측 4장 후보 생성 완료
- [x] 앱 이름 확정: **"T 모지"** / 설명: "수시·정시 모의지원 합격 예측" / 푸터: © T Skool (tskool.kr 링크)

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
