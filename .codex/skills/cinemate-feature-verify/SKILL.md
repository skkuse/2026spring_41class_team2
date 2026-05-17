---
name: cinemate-feature-verify
description: Cinemate 프로젝트에서 구현 완료된 기능의 추가 검증을 수행하는 skill이다. 필요한 경우 integration_test_planner, e2e_test_planner subagent로 repository integration test와 Playwright E2E test 범위를 정하고, 필요한 테스트를 추가 및 실행한 뒤 결과를 보고한다. cinemate-feature-dev 이후 통합 검증이나 핵심 사용자 흐름 검증이 필요할 때 사용한다.
---

# Cinemate Feature Verify

## 전제

이 skill은 `cinemate-feature-dev` 또는 동등한 구현 작업이 완료되어 unit test가 통과한 상태를 가정한다.

구현 범위나 기대 동작이 불명확하면 검증 테스트를 추가하기 전에 사용자 또는 관련 문서로 범위를 확인한다.

이 skill을 사용하라는 요청은 필요한 검증 계획 수립을 위한 planner subagent 사용 요청을 포함한다.

## 진행 흐름

1. 구현된 기능 범위와 이미 통과한 unit test를 확인한다.
2. 필요한 경우 `integration_test_planner`, `e2e_test_planner` subagent로 추가 검증 범위를 수립한다.
3. planner 결과를 바탕으로 integration/E2E 테스트 계획을 짧게 정리한다.
4. 필요한 repository integration test 또는 Playwright E2E test를 추가한다.
5. 관련 테스트를 실행한다.
6. 실패가 있으면 원인을 좁혀 구현 또는 테스트를 수정한다.
7. 최종 테스트 결과와 변경 요약을 보고한다.

## 테스트 원칙

- Repository integration test는 unit test와 분리한다.
- 조회 중심 repository integration test는 원격 Supabase seed data를 참조할 수 있다.
- 쓰기 integration test는 전용 test marker와 cleanup을 사용한다.
- E2E는 핵심 사용자 흐름만 Playwright로 검증한다.
- Playwright E2E는 토큰과 실행 시간이 큰 편이므로, 기능당 대표 흐름 위주로 최소화한다.
- LLM 호출은 fake/stub client로 대체한다.

## 구현 원칙

- `AGENTS.md`를 최우선 프로젝트 규칙으로 따른다.
- 테스트 파일은 대상 코드 옆에 둔다.
- Client Component는 `server/**`를 import하지 않는다.
- 기존 코드 패턴과 UI/UX 패턴을 우선한다.
- 검증 중 발견한 결함만 수정하고, 무관한 리팩터링은 피한다.

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
