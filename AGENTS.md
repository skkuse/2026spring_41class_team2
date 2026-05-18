# Commit 규칙

- 커밋 제목은 한국어로 작성한다.
- 제목은 50자 안팎으로 요약한다.
- 본문에는 변경 내용을 bullet로 정리한다.
- 여러 성격의 변경은 분리 커밋한다.

# 패키지 관리 규칙

- 패키지 매니저는 `pnpm`을 사용한다.
- 의존성 추가/변경은 `pnpm add`, `pnpm add -D`, `pnpm remove`를 사용한다.
- `package-lock.json`, `yarn.lock`, `bun.lockb`를 생성하지 않는다.

# 프로젝트 작업 원칙

- 사용자는 프론트엔드 구현 세부를 Codex에게 위임한다.
- Codex는 기존 UI/UX 패턴을 먼저 파악한 뒤 구현한다.
- 사용자가 명시하지 않은 세부 UI는 Next.js, React, 접근성, 반응형 UI 관점에서 합리적으로 결정한다.
- 문서 수정 작업 시 `docs/software-requirements-spec/**`는 아카이브된 산출물로 간주하고 수정하지 않는다.

# 로그 규칙

- 서버 로그는 `server/logger.ts`의 공통 logger를 사용하고, route/service에서 `console.*`를 직접 호출하지 않는다.
- 로그 레벨은 `debug`, `info`, `warn`, `error`를 사용한다.
- 개발단계(`NODE_ENV !== "production"`)에서는 `debug`를 포함해 상세 로그를 남기고, 배포단계(`NODE_ENV === "production"`)에서는 `debug`를 출력하지 않는다.
- 개발단계에서는 request body, query params, 주요 중간값을 `debug` 로그에 적극적으로 남긴다.
- 배포단계에서는 request body를 로그에 남기지 않는다.
- 성공 로그는 중요 이벤트만 `info`로 남긴다.
- 비정상 흐름은 `warn`, 실패/예외는 `error`로 남긴다.
- 로그에는 가능한 한 `requestId`, `route`, `userId`, `event`를 포함한다.
- 이메일, 토큰, 쿠키, authorization header, password, secret, api key류는 로그에 남기지 않는다.
- `requestId`는 route 시작 시점에 생성하고 `RequestContext`에 전달한다.
- 로그 호출부는 한 줄로 작성한다.
- 로그는 일반 기능 테스트의 검증 대상이 아니다.

# Next.js 작업 규칙

- App Router 기준으로 구현한다.
- 기본은 Server Component로 작성하고, 상태 관리, 이벤트 핸들러, `useEffect`, 브라우저 API가 필요한 부분만 Client Component로 분리한다.
- `'use client'`는 필요한 가장 작은 컴포넌트 경계에만 선언한다.
- `window`, `document`, `localStorage` 같은 브라우저 API는 Client Component에서만 사용하고 렌더링 중 직접 접근하지 않는다.
- 새 컴포넌트와 유틸리티는 TypeScript(`.tsx`, `.ts`)로 작성한다.
- 기존 `components/ui/*`, `lib/utils.ts`, `@/*` import alias 패턴을 우선 사용한다.

# 폴더 구조 규칙

- API endpoint는 `app/api/**/route.ts`에 둔다.
- `route.ts`는 요청 파싱, 인증/권한 확인, 입력 검증, service 호출, 응답 생성만 담당하는 얇은 adapter로 유지한다.
- 실제 백엔드 비즈니스 로직은 도메인별 `server/<domain>/**`에 둔다.
- 서버 전용 공통 코드는 `server/db`, `server/http`, `server/auth`처럼 `server/**` 하위에 둔다.
- `lib/**`는 클라이언트와 서버 양쪽에서 안전하게 사용할 수 있는 순수 유틸만 둔다.
- `components/**`와 Client Component는 `server/**`를 import하지 않는다.

# 서버 도메인 설계 규칙

- 각 도메인은 필요에 따라 `*-service.ts`, `*-repository.ts`, `*-schema.ts`, `*-types.ts`, `*-rules.ts`를 둔다.
- `service`는 유스케이스 흐름과 비즈니스 규칙 조립을 담당한다.
- `repository`는 DB 또는 외부 데이터 소스 접근만 담당한다.
- `schema`는 Zod 기반 요청/응답 검증을 담당한다.
- `rules`는 DB나 ORM 없이 테스트 가능한 순수 비즈니스 규칙을 담당한다.
- `server/**` 파일은 서버 전용이며, 필요한 경우 파일 상단에 `import 'server-only'`를 선언한다.

# ORM과 도메인 로직 규칙

- ORM은 Drizzle ORM을 기본으로 사용한다.
- DB는 Supabase Postgres를 기준으로 설계한다.
- 서버 측 DB 접근은 `server/db`의 Drizzle 클라이언트와 도메인별 `repository`를 통해 수행한다.
- Supabase Auth와 Storage는 Supabase client를 사용하고, 일반 DB 비즈니스 쿼리는 Drizzle을 우선 사용한다.
- Vercel Serverless 환경에서는 Supabase Connection Pooler 사용을 전제로 하고, Drizzle 연결에는 transaction pool 제약을 고려한다.
- DB schema 변경은 Drizzle schema(`server/db/schema.ts`)와 Supabase migration SQL(`supabase/migrations/*.sql`)에 항상 함께 반영한다.
- `drizzle-kit generate`는 사용하지 않고, `supabase/migrations/*.sql`은 직접 작성한다.
- RLS, grant, trigger, `auth.users` FK처럼 Supabase 전용인 항목은 migration SQL에서 관리한다.
- ORM Entity/Row는 영속성 모델로 간주하고 비즈니스 로직을 넣지 않는다.
- ORM model과 별도의 도메인 객체는 처음부터 만들지 않고, 불변식/상태 전이가 복잡해진 도메인에만 도입을 검토한다.
- service/rules 테스트는 DB나 ORM 없이 실행 가능해야 한다.

# 계층 간 타입 및 검증 규칙

- Route Handler, service, repository 사이에 전달되는 객체는 명시적인 TypeScript 타입을 정의한다.
- `request.json()` 결과를 타입 단언으로 바로 사용하지 않는다.
- 외부 입력값은 Zod schema로 런타임 검증한 뒤 service에 전달한다.
- schema에서 파생 가능한 input 타입은 `z.infer<typeof schema>`로 정의한다.
- 인증/세션 등 요청 공통 정보는 `RequestContext` 타입으로 정의하고 service에 명시적으로 전달한다.
- service는 `Request`, `Response`, cookie, header에 직접 의존하지 않는다.
- 백엔드 도메인 타입 파일은 기본적으로 `server/<domain>/<domain>-types.ts`에 모으고, 파일 내부 주석으로 계층을 그룹핑한다.
- 타입 그룹 주석은 필요한 항목만 사용하며, `// HTTP DTO`, `// Service input`, `// Service output`, `// Domain`, `// Repository params`, `// Repository results`, `// Repository port` 순서를 기본으로 한다.
- HTTP 요청/응답 경계 타입은 `Dto`, repository 메서드 인자 타입은 `RepoParams`, repository 반환 전용 타입은 `RepoResult`, Drizzle row 타입은 `Row` 접미사를 사용한다.
- service input은 service의 유스케이스 호출 계약이며, HTTP DTO와 모양이 같아도 별도 타입으로 정의한다.
- service output은 service의 유스케이스 결과 계약이며, HTTP response DTO와 분리한다.
- route.ts는 외부 입력을 Zod로 검증한 HTTP DTO를 service input으로 변환해 service에 전달한다.
- route.ts는 service output을 HTTP response DTO로 변환한 뒤 response schema로 검증한다.
- route.ts는 repository 타입이나 `RepoParams`, `RepoResult`를 직접 만들거나 import하지 않는다.
- service는 HTTP DTO를 직접 사용하지 않고 service input/output과 domain 타입을 사용한다.
- service는 service input과 `RequestContext`를 바탕으로 repository `RepoParams`를 생성해 repository에 전달한다.
- Domain 타입은 여러 유스케이스, rules, repository에서 공유되는 핵심 비즈니스 개념에만 둔다.
- 특정 유스케이스 전용 projection/result는 억지로 Domain으로 만들지 않고 service output에 둔다.
- Domain 타입에는 `Dto`, `Input`, `Output`, `RepoParams`, `RepoResult`, `Row` 접미사를 붙이지 않는다.
- repository는 HTTP DTO와 service input/output을 직접 사용하지 않는다.
- repository는 domain 모델 또는 repository 전용 `RepoResult`를 반환한다.
- Drizzle row 타입은 repository 내부에서만 다루고 service로 반환하지 않는다.
- join/projection처럼 domain 모델 하나로 표현하기 어려운 조회 결과는 `RepoResult` 접미사를 사용한다.
- repository가 domain 모델을 그대로 반환할 수 있는 경우에는 불필요한 `RepoResult` alias를 만들지 않는다.

# 테스트 용이성 및 DI 규칙

- 폴더 구조와 모듈 설계는 테스트 작성 용이성을 최우선 기준으로 정한다.
- 테스트 파일은 대상 코드 옆에 `*.test.ts` 또는 `*.test.tsx`로 둔다.
- 기능 개발은 TDD를 기본으로 한다.
- Backend는 `rules/service/schema`, Frontend는 작은 Client Component/API client/상태 전이 테스트를 우선한다.
- Route Handler 테스트는 인증, 입력 검증, 에러 매핑만 얇게 작성한다.
- Repository integration test는 unit test와 분리한다.
- 조회 중심 integration test는 원격 Supabase seed data를 참조할 수 있고, 쓰기 테스트는 전용 데이터와 cleanup을 사용한다.
- E2E는 Playwright로 핵심 사용자 흐름만 검증한다.
- LLM 자동 테스트는 fake/stub client를 사용한다.
- Next.js에는 NestJS식 DI 컨테이너를 기본 도입하지 않는다.
- Service는 `createXService(deps)` factory를 제공하여 테스트에서 의존성을 fake/mock으로 주입할 수 있게 한다.
- 기본 런타임용 인스턴스는 `export const xService = createXService(defaultDeps)`로 제공한다.
- 시간, 랜덤 값, 외부 API, repository처럼 테스트에서 바뀌어야 하는 의존성은 필요한 경우 service factory의 deps로 받는다.
- 구현체가 하나뿐인 인터페이스나 과도한 class 계층은 만들지 않는다.
- 비즈니스 로직은 `service`와 `rules` 테스트에서 우선 검증한다.

# Vercel Serverless 설계 규칙

- 서버 코드는 Vercel Serverless 환경을 기준으로 stateless하게 설계한다.
- module-level 변수에 사용자 상태, 세션, 요청별 데이터, 비즈니스 데이터를 저장하지 않는다.
- `export const xService = createXService(defaultDeps)`는 의존성 조립 편의용으로만 사용하고 런타임 상태 저장에 사용하지 않는다.
- `userId`, `session`, `requestId`, `locale` 같은 요청별 값은 service 함수 인자로 전달한다.
- 영속 상태는 DB, 쿠키, Redis/KV, 외부 스토리지에 저장한다.
- 로컬 파일 시스템 쓰기에 의존하지 않는다.
