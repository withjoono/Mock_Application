# T 모지 — 수시/정시 무료 모의지원 앱

거북스쿨(T Skool) 생태계의 모의지원 위성앱. Expo(React Native) 모바일 전용.

**3대 기능** (시즌 기반 UI — `ma_season`이 단일 진실):

| 시즌 | 기능 | 지원 규칙 |
|---|---|---|
| 6월/9월 모의평가 | 모평 모의지원 | 가/나/다 군별 1회 (총 3회) |
| 수시 | 수시 모의지원 | 슬롯 1~6 (총 6회) |
| 정시 | 정시 모의지원 | 가/나/다 군별 1회 (총 3회) |

## 아키텍처

- **백엔드**: Hub-Backend(`withjoono/Hub`)의 `/mock-application/*` 모듈 (ma_* 테이블, hub 스키마)
- **인증**: Hub 통합계정 (이메일 로그인 → JWT, expo-secure-store 저장)
- **DB 설계**: `docs/ma-db-schema-design.md`

## 개발

```bash
npm install
npm start          # Expo dev server
npx playwright test  # e2e (web)
```

- dev API: Hub-Backend `localhost:4000` (`lib/api/config.ts`)
- 프로덕션 환경은 EAS 빌드 프로필의 `EXPO_PUBLIC_ENV`로 분기

## 출시

`docs/release-checklist.md` 참조 (EAS 빌드/제출, 스토어 요건, 배포 검증 시나리오).

## 구조

```
screens/        화면 (MainScreen=시즌 홈, SeasonApplyScreen=모의지원)
components/     공용 컴포넌트 (AppFooter, 차트 등)
lib/api/        Hub API 클라이언트 (axios + humps, features/mock-application, features/auth)
lib/hooks/      useMockApplication 등
docs/           설계·출시 문서
_legacy/        구버전 + 제거된 Convex 코드 (git 미추적)
```

© T Skool · https://www.tskool.kr
