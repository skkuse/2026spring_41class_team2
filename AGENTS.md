# Commit 규칙

- 커밋 제목은 한국어로 작성한다.
- 제목은 50자 안팎으로 요약한다.
- 본문에는 변경 내용을 bullet로 정리한다.
- 여러 성격의 변경은 분리 커밋한다.
- 사용자가 명시하지 않으면 untracked 파일은 커밋하지 않는다.

# 패키지 관리 규칙

- 패키지 매니저는 `pnpm`을 사용한다.
- 의존성 추가/변경은 `pnpm add`, `pnpm add -D`, `pnpm remove`를 사용한다.
- `package-lock.json`, `yarn.lock`, `bun.lockb`를 생성하지 않는다.

# 프로젝트 작업 원칙

- 사용자는 프론트엔드 구현 세부를 Codex에게 위임한다.
- Codex는 기존 UI/UX 패턴을 먼저 파악한 뒤 구현한다.
- 사용자가 명시하지 않은 세부 UI는 Next.js, React, 접근성, 반응형 UI 관점에서 합리적으로 결정한다.

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

# 테스트 용이성 및 DI 규칙

- 폴더 구조와 모듈 설계는 테스트 작성 용이성을 최우선 기준으로 정한다.
- 테스트 파일은 대상 코드 옆에 `*.test.ts` 또는 `*.test.tsx`로 둔다.
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
