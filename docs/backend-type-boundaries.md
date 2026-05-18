# Backend Type Boundaries

이 문서는 backend 계층에서 사용하는 타입을 왜 분리하는지 설명한다.

기본 흐름은 다음과 같다.

```txt
route.ts
  HTTP DTO 검증
  -> Service input 생성
  -> service 호출
  -> Service output을 HTTP response DTO로 변환

service.ts
  Service input과 RequestContext로 use case 실행
  -> Repository params 생성
  -> repository 호출
  -> Domain 또는 Service output 반환

repository.ts
  Repository params로 DB query 실행
  -> Row를 Domain 또는 Repository result로 변환
```

`server/<domain>/<domain>-types.ts`의 타입 그룹은 필요한 항목만 사용하며, 기본 순서는 다음과 같다.

```ts
// HTTP DTO
// Service input
// Service output
// Domain
// Repository params
// Repository results
// Repository port
```

## HTTP DTO

HTTP DTO는 외부 API 계약이다. request body, query string, path param, response JSON처럼 HTTP 경계에 드러나는 모양을 표현한다.

```ts
// HTTP DTO
export type UpdateProfileRequestDto = {
  avatarUrl?: string | null
}

export type UpdateProfileResponseDto = {
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}
```

DTO는 클라이언트와 맞추는 이름을 사용할 수 있다. 예를 들어 API에서는 `avatarUrl`이라고 부르지만, 내부 domain에서는 같은 값을 `profileImageUrl`이라고 부를 수 있다.

```ts
// route.ts
const dto = updateProfileRequestSchema.parse(await request.json())

const input: UpdateProfileInput = {
  profileImageUrl: dto.avatarUrl,
}
```

DTO를 service나 repository까지 넘기면 내부 코드가 HTTP 표현에 묶인다. API 필드명을 바꾸는 일이 service/repository 수정으로 번지기 쉽다.

## Service Input

Service input은 use case를 실행하기 위해 service가 받는 입력이다. DTO와 모양이 같아 보여도 의미가 다르다.

```ts
// Service input
export type UpdateProfileInput = {
  profileImageUrl?: string | null
}
```

route는 HTTP DTO를 검증한 뒤 service input을 만든다.

```ts
// route.ts
const dto = updateProfileRequestSchema.parse(await request.json())

await userService.updateProfile(context, {
  profileImageUrl: dto.avatarUrl,
})
```

path, query, body, session 값을 합쳐야 할 때 service input의 의미가 더 분명해진다.

```ts
// HTTP DTO: body만 표현한다.
export type CreateReviewRequestDto = {
  rating: number
  content: string
}

// Service input: use case 실행에 필요한 전체 입력이다.
export type CreateReviewInput = {
  movieId: number
  rating: number
  content: string
}
```

```ts
// route.ts
const movieId = Number(params.movieId)
const dto = createReviewRequestSchema.parse(await request.json())

await reviewService.createReview(context, {
  movieId,
  rating: dto.rating,
  content: dto.content,
})
```

`userId` 같은 인증 정보는 보통 `RequestContext`에 있으므로 service input에 중복해서 넣지 않는다. service는 `context.user.id`와 input을 함께 사용한다.

## Service Output

Service output은 use case 실행 결과다. HTTP response DTO가 아니라 service의 반환 계약이다.

```ts
// Service output
export type CreateReviewOutput = {
  review: Review
  movieStats: {
    reviewCount: number
    averageRating: number
  }
}
```

service는 use case 관점에서 필요한 결과를 반환한다.

```ts
// service.ts
async function createReview(
  context: AuthenticatedRequestContext,
  input: CreateReviewInput,
): Promise<CreateReviewOutput> {
  const review = await deps.reviewRepository.createReview({
    userId: context.user.id,
    movieId: input.movieId,
    rating: input.rating,
    content: input.content,
  })

  const movieStats = await deps.reviewRepository.findMovieReviewStats({
    movieId: input.movieId,
  })

  return { review, movieStats }
}
```

route는 service output을 response DTO로 변환한다.

```ts
// route.ts
const output = await reviewService.createReview(context, input)

const response: CreateReviewResponseDto = {
  review: {
    id: output.review.id,
    rating: output.review.rating,
    content: output.review.content,
  },
  reviewCount: output.movieStats.reviewCount,
}
```

이 분리 덕분에 service는 JSON 응답 모양이 아니라 use case 결과를 표현한다. 응답 필드를 추가하거나 이름을 바꾸는 일은 route의 변환 로직에서 처리할 수 있다.

## Domain

Domain 타입은 비즈니스에서 다루는 핵심 개념이다. HTTP, DB, 특정 endpoint 이름에 묶이지 않는다.

```ts
// Domain
export type Profile = {
  id: string
  name: string
  email: string
  profileImageUrl: string | null
  onboardingCompleted: boolean
}

export type Review = {
  id: string
  userId: string
  movieId: number
  rating: number
  content: string
  createdAt: Date
}
```

Domain 타입은 service와 rules에서 주로 사용한다. repository가 row를 domain으로 변환해 반환할 수도 있다.

```ts
// repository.ts
function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    userId: row.userId,
    movieId: row.movieId,
    rating: row.rating,
    content: row.content,
    createdAt: row.createdAt,
  }
}
```

Domain 타입에는 `Dto`, `RepoParams`, `Row` 같은 계층 접미사를 붙이지 않는다. 내부 비즈니스 언어를 그대로 사용한다.

## Repository Params

Repository params는 repository query에 필요한 입력이다. service가 만든다.

```ts
// Repository params
export type UpdateProfileRepoParams = {
  userId: string
  profileImageUrl?: string | null
}

export type CreateReviewRepoParams = {
  userId: string
  movieId: number
  rating: number
  content: string
}
```

service input과 repo params가 비슷해 보일 수 있지만 책임이 다르다.

```ts
// Service input
export type UpdateProfileInput = {
  profileImageUrl?: string | null
}

// Repository params
export type UpdateProfileRepoParams = {
  userId: string
  profileImageUrl?: string | null
}
```

`userId`는 HTTP body가 아니라 인증 context에서 온다. route가 repo params를 만들면 repository 계약을 알게 되므로 계층이 새어 나간다. service가 context와 service input을 조합해 repo params를 만든다.

```ts
// service.ts
await deps.userRepository.updateProfile({
  userId: context.user.id,
  profileImageUrl: input.profileImageUrl,
})
```

## Repository Results

Repository result는 repository 전용 조회 결과다. 단일 domain 모델로 표현하기 어려운 join, projection, aggregate 결과에 사용한다.

```ts
// Repository results
export type MovieReviewStatsRepoResult = {
  movieId: number
  reviewCount: number
  averageRating: number
}

export type ReviewListItemRepoResult = {
  review: Review
  movie: {
    id: number
    title: string
    posterPath: string | null
  }
}
```

repository가 domain 모델 하나를 그대로 반환할 수 있으면 별도 `RepoResult`를 만들지 않는다.

```ts
// 좋은 예: domain 그대로 반환 가능
findProfileById(userId: string): Promise<Profile | null>
```

join이나 aggregate처럼 domain 하나가 아닌 결과는 `RepoResult`로 분리한다.

```ts
// 좋은 예: review와 movie projection이 섞인 조회 결과
findUserReviews(params: FindUserReviewsRepoParams): Promise<ReviewListItemRepoResult[]>
```

service는 repo result를 그대로 HTTP response로 내보내지 않는다. 필요하면 service output으로 다시 정리한다.

```ts
// service.ts
const rows = await deps.reviewRepository.findUserReviews({ userId: context.user.id })

return {
  reviews: rows.map((row) => ({
    review: row.review,
    movieTitle: row.movie.title,
  })),
}
```

## Repository Port

Repository port는 service가 의존하는 repository 인터페이스다. 테스트에서 fake repository를 주입할 수 있게 한다.

```ts
// Repository port
export type UserRepository = {
  findProfileById(userId: string): Promise<Profile | null>
  updateProfile(params: UpdateProfileRepoParams): Promise<Profile>
}

export type ReviewRepository = {
  createReview(params: CreateReviewRepoParams): Promise<Review>
  findMovieReviewStats(params: FindMovieReviewStatsRepoParams): Promise<MovieReviewStatsRepoResult>
}
```

service는 구현체가 아니라 port에 의존한다.

```ts
export type ReviewServiceDeps = {
  reviewRepository: ReviewRepository
}

export function createReviewService(deps: ReviewServiceDeps) {
  return {
    async createReview(
      context: AuthenticatedRequestContext,
      input: CreateReviewInput,
    ): Promise<CreateReviewOutput> {
      return createReviewUseCase(context, input, deps.reviewRepository)
    },
  }
}
```

테스트에서는 같은 port를 만족하는 fake repository를 넣는다.

```ts
const service = createReviewService({
  reviewRepository: {
    createReview: vi.fn().mockResolvedValue(review),
    findMovieReviewStats: vi.fn().mockResolvedValue(stats),
  },
})
```

## Row

Row 타입은 Drizzle select 결과 같은 영속성 모델이다. repository 내부에서만 다룬다.

```ts
// server/db/schema.ts
export type ProfileRow = typeof profiles.$inferSelect
```

```ts
// repository.ts
function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    profileImageUrl: row.profileImageUrl,
    onboardingCompleted: row.onboardingCompleted,
  }
}
```

Row를 service로 반환하면 DB column 이름, nullable 처리, join 방식이 service까지 퍼진다. repository에서 domain 또는 repo result로 변환한 뒤 반환한다.

## 의존 방향 요약

각 계층이 봐도 되는 타입은 다음과 같다.

| 계층 | 사용 가능 | 사용하지 않음 |
| --- | --- | --- |
| `route.ts` | HTTP DTO, `RequestContext`, Service input, Service output | Repository params, Repository results, Row |
| `service.ts` | `RequestContext`, Service input, Service output, Domain, Repository params, Repository results, Repository port | HTTP DTO, Row, `Request`, `Response`, cookie/header 직접 접근 |
| `repository.ts` | Repository params, Repository results, Domain, Row | HTTP DTO, Service input, Service output, `RequestContext`, `Request`, `Response` |
| `schema.ts` | HTTP DTO schema, response DTO schema | Repository params, Repository results, Row |
| `rules.ts` | Domain, 순수 rule input/output | HTTP DTO, Repository params, Repository results, Row, `RequestContext` |

핵심 원칙은 외부 표현과 내부 use case, DB 접근 계약을 섞지 않는 것이다. 모양이 같은 타입도 계층 책임이 다르면 분리한다.
