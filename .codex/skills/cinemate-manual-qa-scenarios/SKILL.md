---
name: cinemate-manual-qa-scenarios
description: Cinemate 프로젝트에서 사용자가 브라우저로 직접 QA할 수 있도록 간단한 수동 QA 시나리오를 usecase별로 작성할 때 사용한다.
---

# Cinemate Manual QA Scenarios

내가 브라우저에서 직접 QA해보게 시나리오를 아래와 같이 작성한다.

```text
1. [Usecase 이름]
- /[page 이름]에서 버튼 클릭 -> 내용 뜨는지 확인 -> ...

2. [Usecase 이름]
- /[page 이름]에서 입력 -> 버튼 클릭 -> 결과 확인 -> ...
```

규칙:
- Cinemate 프로젝트 범위의 실제 페이지와 기능 기준으로 작성한다.
- 구현 설명, 테스트 코드 설명, 긴 배경 설명은 넣지 않는다.
- 사용자가 브라우저에서 따라할 수 있는 행동과 확인 포인트만 쓴다.
