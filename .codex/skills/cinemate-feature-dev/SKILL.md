---
name: cinemate-feature-dev
description: Cinemate 프로젝트에서 합의된 개발 입력을 기준으로 TDD 방식으로 기능을 완성하는 skill이다. 테스트 계획에는 frontend/backend/integration/E2E test planner subagent를 사용하고, unit test 작성 후 실패 확인, 기능 구현 완료, 필요한 integration/E2E 검증까지 진행한다.
---

# Cinemate Feature Dev

## 전제

이 skill은 `cinemate-drill-me` 또는 사용자와의 논의를 통해 확정된 개발 입력이 있다고 가정한다.

합의된 개발 입력이 없거나 충돌이 발견되면 구현하지 않고, 먼저 `cinemate-drill-me`로 요구사항을 정리한다.

이 skill을 사용하라는 요청은 테스트 계획 수립을 위한 planner subagent 사용 요청을 포함한다.

## 진행 흐름

1. 합의된 개발 입력을 확인한다.
2. `backend_test_planner`, `frontend_test_planner` subagent로 unit test 계획을 수립한다.
3. planner 결과를 바탕으로 테스트 케이스 계획을 짧게 정리한다.
4. frontend/backend unit test를 먼저 작성한다.
5. 테스트 실패를 확인한다.
6. Unit Test를 통과하도록 합의된 기능 범위를 완성한다.
7. 필요한 경우 `integration_test_planner`, `e2e_test_planner` subagent로 추가 검증 범위를 수립한다.
8. 필요한 repository integration test 또는 Playwright E2E test를 추가한다.
9. 관련 테스트를 실행한다.
10. 최종 테스트 결과와 변경 요약을 보고한다.

## 테스트 원칙

- Backend는 `rules`, `service`, `schema` unit test를 우선한다.
- Route Handler는 인증, 입력 검증, service 호출, 에러 매핑만 얇게 테스트한다.
- Frontend는 작은 Client Component, API client, 상태 전이를 우선 테스트한다.
- Repository integration test는 unit test와 분리한다.
- 조회 중심 repository integration test는 원격 Supabase seed data를 참조할 수 있다.
- 쓰기 integration test는 전용 test marker와 cleanup을 사용한다.
- E2E는 핵심 사용자 흐름만 Playwright로 검증한다.
- LLM 호출은 fake/stub client로 대체한다.

## 구현 원칙

- `AGENTS.md`를 최우선 프로젝트 규칙으로 따른다.
- 테스트 파일은 대상 코드 옆에 둔다.
- service는 `createXService(deps)` 형태로 테스트 가능하게 작성한다.
- Client Component는 `server/**`를 import하지 않는다.
- 기존 코드 패턴과 UI/UX 패턴을 우선한다.
- 프론트엔드 세부 구현은 접근성, 반응형, 기존 디자인 일관성 기준으로 Codex가 결정한다.

## 최종 보고

완료 후 다음을 짧게 보고한다.

```text
변경 요약:
- ...

테스트:
- ...

남은 리스크:
- ...
```
