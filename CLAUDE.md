# CLAUDE.md — Mock_Application (T모지)

Claude Code 는 이 파일을 자동으로 읽는다. 규칙 본문과 문서 색인은 아래 두 파일에 있으며 함께 자동 로드된다.

@AGENTS.md
@docs/context/README.md

## Claude Code 작업 규칙

- 답변·보고는 **한국어**로 한다.
- 비밀번호·API 키·서비스 계정 키·학생/학부모 개인정보는 커밋하지도, 문서에 적지도 않는다.
- 기본 브랜치는 **`main`** 이다(`master` 아님).
- **이 리포에는 자동 배포(`.github/workflows`)가 없다.** 스토어 빌드는 `eas build`/`eas submit` 을 사람이 실행한다.
  그러니 push 해도 앱이 배포되지는 않는다. 작업이 끝나면 `main` 에 커밋하고 push 해서 PC·핸드폰 세션이
  같은 상태를 보게 한다. 단 `eas build`/`eas submit` 은 사용자가 요청할 때만 실행한다.
- 커밋할 때는 내가 만든 파일만 스테이징한다(`git add -A` 금지 — 스크린샷 등 사용자 미추적 파일이 섞인다).
- 백엔드(API·`ma_*` 테이블) 변경은 이 리포가 아니라 `withjoono/Hub` 에서 한다(AGENTS.md 고유 규칙 1).
