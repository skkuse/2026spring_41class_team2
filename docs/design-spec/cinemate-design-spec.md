# 씨네메이트 디자인 명세서

## 1. Purpose

### 1.1 Readership

본 문서는 씨네메이트 프로젝트의 설계 내용을 이해해야 하는 개발자, 프로젝트 팀원, 평가자 및 유지보수 담당자를 대상으로 한다. 독자는 본 문서를 통해 씨네메이트의 전체 시스템 구조, 프론트엔드와 백엔드 구성, API 통신 방식, 데이터베이스 설계, 테스트 계획 및 개발 환경을 파악할 수 있다.

### 1.2 Scope

본 문서는 씨네메이트의 소프트웨어 설계 범위를 다룬다. 씨네메이트는 사용자가 영화를 탐색하고, 리뷰와 찜하기를 관리하며, 개인 선호를 바탕으로 맞춤 추천, AI 추천 채팅, 캐릭터 대화 기능을 사용할 수 있도록 지원하는 웹 기반 영화 서비스이다.

본 문서의 설계 범위에는 전체 시스템 구조, 프론트엔드 화면 및 컴포넌트 구조, 백엔드 하위 시스템, API 프로토콜, 데이터베이스 구조, 테스트 계획, 개발 환경이 포함된다.

### 1.3 Objective

이 소프트웨어 설계 문서의 주요 목적은 씨네메이트 시스템의 기술적 설계를 설명하는 것이다. 본 문서는 씨네메이트 구현의 기반이 되는 프론트엔드, 백엔드, 데이터베이스, API, 외부 서비스 연동 구조를 정의한다.

모든 설계 내용은 씨네메이트의 소프트웨어 요구사항 명세서와 관련 API 명세, 데이터베이스 schema 문서, 구현 계획 문서를 기반으로 작성되었다.

### 1.4 Document Structure

1) Purpose: 본 문서의 목적, 예상 독자, 설계 범위 및 문서 구조를 설명한다.
2) Introduction: 본 문서에서 실제로 사용하는 다이어그램, 도구, 프로젝트 범위 및 참고 자료를 설명한다.
3) System Architecture - Overall: 씨네메이트의 전체 시스템 구조와 주요 구성 요소 간의 관계를 설명한다.
4) System Architecture - Frontend: 프론트엔드 화면 구조, 컴포넌트 구성, 상태 처리, API 연동 방식을 설명한다.
5) System Architecture - Backend: 백엔드 API 서버 구조와 주요 하위 시스템의 처리 흐름을 설명한다.
6) Protocol Design: 프론트엔드와 백엔드 사이의 통신 방식, 요청 및 응답 형식, API 목록을 설명한다.
7) Database Design: 씨네메이트에서 사용하는 주요 데이터와 ER Diagram, entity description을 설명한다.
8) Testing Plan: 씨네메이트의 개발 테스트, 릴리스 테스트, 사용자 테스트 계획을 설명한다.
9) Development Plan: 씨네메이트 구현에 사용되는 개발 환경, 기술, 제약사항 및 의존성을 설명한다.
10) Supporting Information: 문서 작성 기준과 문서 수정 이력을 설명한다.

## 2. Introduction

Design document는 씨네메이트 구현의 기반이 되는 설계를 제공한다. 본 문서는 앞서 정의된 요구사항을 바탕으로 시스템을 어떤 구조로 구현할지 설명하며, 다이어그램과 표를 통해 주요 설계 요소를 정리한다.

### 2.1 Objectives

이번 장에서는 씨네메이트 설계에 사용된 다이어그램, 작성 도구, 프로젝트 범위 및 참고 자료를 설명한다.

### 2.2 Applied Diagrams

#### 2.2.1 Used Tools

본 문서의 다이어그램은 draw.io, PlantUML, Markdown 표를 사용하여 작성한다. draw.io는 전체 시스템 구조, 백엔드 구조, ER Diagram과 같이 시각적 배치가 필요한 다이어그램 작성에 사용한다. PlantUML은 백엔드 하위 시스템의 sequence diagram 작성에 사용한다. Markdown 표는 API 목록, 데이터베이스 field 설명, 테스트 케이스와 같이 비교와 정리가 필요한 항목에 사용한다.

#### 2.2.2 System Architecture Diagram

System Architecture Diagram은 씨네메이트의 프론트엔드, 백엔드, 데이터베이스, 인증, 외부 API 및 데이터 소스가 전체 시스템 안에서 어떻게 연결되는지 표현한다. 본 문서에서는 전체 시스템 구조, 프론트엔드 구조, 백엔드 구조를 구분하여 주요 구성 요소와 데이터 흐름을 설명한다.

#### 2.2.3 Use Case Diagram

Use Case Diagram은 씨네메이트가 사용자에게 제공하는 주요 기능과 사용자 유형 간의 관계를 표현한다. 본 문서에서는 로그인, 로그아웃, 온보딩, 영화 검색, 영화 상세 조회, 찜하기, 리뷰 작성, 리뷰 좋아요, 맞춤 추천, AI 추천 채팅, 캐릭터 대화 기능을 중심으로 사용 사례를 나타낸다.

#### 2.2.4 Sequence Diagram

Sequence Diagram은 특정 기능이 수행될 때 사용자, 프론트엔드, 백엔드, 데이터베이스, 외부 API가 시간 순서에 따라 어떻게 상호작용하는지 표현한다. 본 문서에서는 사용자 관리, 영화 정보 조회, 리뷰와 찜하기, 온보딩과 맞춤 추천, AI 추천 채팅, 캐릭터 대화 기능의 처리 흐름을 sequence diagram으로 설명한다.

#### 2.2.5 Entity Relationship Diagram

Entity Relationship Diagram은 데이터베이스의 주요 table과 table 간 관계를 표현한다. 본 문서에서는 영화 카탈로그, 사용자 활동, 맞춤 추천, AI 추천 채팅, 캐릭터 대화 영역으로 나누어 ER Diagram을 제시하고, 각 table의 주요 field를 entity description에서 설명한다.

#### 2.2.6 Project Scope

씨네메이트는 영화 탐색과 개인화된 영화 경험을 제공하는 웹 기반 서비스이다. 사용자는 영화 검색과 상세 조회를 통해 영화 정보를 확인할 수 있으며, 로그인 후 찜하기, 리뷰 작성, 리뷰 좋아요, 온보딩, 맞춤 추천 기능을 사용할 수 있다. 또한 사용자는 AI 추천 채팅을 통해 자연어로 맞춤 추천을 요청할 수 있고, 영화 속 캐릭터와 대화하는 캐릭터 대화 기능을 사용할 수 있다.

본 문서의 설계 범위는 이러한 기능을 제공하기 위한 웹 프론트엔드, Next.js Route Handler 기반 백엔드, Supabase PostgreSQL 데이터베이스, Supabase Auth 인증, OpenAI API 연동, TMDB 및 MovieLens 기반 데이터 활용 구조를 포함한다.

#### 2.2.7 References

- IEEE Std 830-1998 IEEE Recommended Practice for Software Requirements Specifications
- TMDB API Documentation (https://developer.themoviedb.org/docs)
- MovieLens Dataset (https://grouplens.org/datasets/movielens/)
- Supabase Documentation (https://supabase.com/docs)
- OpenAI API Documentation (https://platform.openai.com/docs)

```{=latex}
\clearpage
```

## 3. System Architecture - Overall

### 3.1 Objectives

이 장에서는 씨네메이트의 전체 시스템 구조와 주요 구성 요소 간의 관계를 설명한다. 전체 시스템 구조는 사용자가 직접 이용하는 프론트엔드, 요청을 처리하는 백엔드, 영화 및 사용자 데이터를 저장하는 데이터베이스, 그리고 추천과 대화 응답 생성을 보조하는 외부 서비스로 구성된다.

### 3.2 System Organization

씨네메이트의 전체 시스템은 다음 구성 요소로 이루어진다.

- **프론트엔드**: Next.js 기반 사용자 화면을 제공한다. 홈, 검색, 영화 상세, 로그인, 온보딩, AI 추천 채팅, 캐릭터 대화, 맞춤 추천, 마이페이지 화면을 통해 사용자의 입력과 조회 요청을 처리한다.
- **백엔드**: Next.js Route Handlers를 통해 인증, 영화 조회, 찜하기/리뷰, 맞춤 추천, AI 추천 채팅, 캐릭터 대화, 마이페이지 기능을 처리한다. 프론트엔드 요청을 받아 입력값과 권한을 확인하고, 필요한 데이터 조회 및 저장을 수행한다.
- **데이터베이스**: Supabase DB에 사용자, 영화, 리뷰, 찜한 영화, 온보딩, 추천, 채팅 데이터를 저장한다. 맞춤 추천 결과는 사전 적재된 추천 데이터를 바탕으로 조회된다.
- **외부 API 및 데이터**: Supabase Auth는 사용자 인증에 사용된다. TMDB API는 MovieLens 데이터에 부족한 영화 메타데이터를 보충하기 위해 사용된다. MovieLens 데이터셋은 추천 데이터 구성에 활용되며, OpenAI API는 AI 추천 채팅과 캐릭터 대화 응답 생성에 사용된다.

### 3.2.1 System Diagram

![System Architecture](./assets/diagrams/system-architecture.png)

Figure 3.1: Overall System Architecture

### 3.3 Use Case Diagram

![Use Case Diagram](./assets/diagrams/use-case-diagram.png)

Figure 3.2: Use Case Diagram - Overall

## 4. System Architecture - Frontend

### 4.1 Objectives

이 장에서는 씨네메이트 프론트엔드의 화면 구조, 컴포넌트 구성, 상태 처리, API 연동 방식을 설명한다. 프론트엔드는 Next.js 기반 웹 화면으로 구성되며, 사용자가 영화 탐색, 리뷰와 찜하기, 온보딩, 맞춤 추천, AI 추천 채팅, 캐릭터 대화, 마이페이지 기능을 사용할 수 있도록 한다.

프론트엔드는 사용자 입력을 처리하고 필요한 데이터를 백엔드 API에 요청한 뒤, 응답 데이터를 화면에 표시한다. 각 화면은 공통 레이아웃과 재사용 가능한 UI 컴포넌트를 기반으로 구성되며, 화면의 성격에 따라 공개 화면, 인증 필요 화면, 개인화 및 대화형 화면으로 구분된다.

### 4.2 Frontend Structure

씨네메이트 프론트엔드는 Next.js App Router 구조를 기준으로 구성된다. 각 URL 경로는 page 단위의 화면으로 연결되고, 공통 레이아웃은 여러 화면에서 재사용된다. 사용자의 입력과 상호작용이 필요한 부분은 Client Component에서 처리하고, 화면 진입 시 필요한 데이터 조회와 정적 표시 영역은 Server Component를 우선 사용한다.

프론트엔드는 데이터베이스에 직접 접근하지 않고 백엔드 API를 통해 데이터를 요청한다. 영화 목록, 영화 상세, 리뷰, 찜하기, 추천, 채팅 데이터는 API 응답을 화면 표시 모델로 변환한 뒤 UI 컴포넌트에 전달된다.

| Element | Role |
| --- | --- |
| Page | URL 경로와 연결되는 화면 단위 |
| Layout | Header, Navigation 등 공통 화면 구조 |
| Shared Component | 여러 화면에서 재사용되는 UI 요소 |
| Feature Component | 영화 탐색, 리뷰, 추천, 채팅 등 기능별 UI 요소 |
| API Client | 백엔드 API 호출과 응답 처리 |

### 4.3 Screen Organization

씨네메이트의 화면은 접근 조건과 기능 성격에 따라 구분된다. 공개 화면은 비로그인 사용자도 접근할 수 있으며, 인증 필요 화면은 로그인한 사용자의 정보와 활동 데이터를 사용한다. 개인화 및 대화형 화면은 로그인 사용자 정보를 바탕으로 맞춤 추천과 채팅 기능을 제공한다.

#### 4.3.1 Public Screens

| Screen | Description |
| --- | --- |
| Home | 인기 영화, 평점 기반 영화, 주요 진입 경로를 제공한다. |
| Search | 검색어와 조건에 따라 영화 목록을 표시한다. |
| Movie Detail | 영화 줄거리, 장르, 출연진, 제작진, 리뷰 정보를 표시한다. |
| Login | Supabase Auth 기반 로그인을 시작하는 화면이다. |

#### 4.3.2 Authenticated Screens

| Screen | Description |
| --- | --- |
| Onboarding | 사용자가 선호 영화 5개를 선택하여 맞춤 추천의 기준 데이터를 만든다. |
| My Page | 사용자 프로필, 찜한 영화, 작성한 리뷰를 표시한다. |

#### 4.3.3 Personalized and Chat Screens

| Screen | Description |
| --- | --- |
| Recommendation | 온보딩 선호 영화를 기반으로 맞춤 추천 결과를 표시한다. |
| AI Recommendation Chat | 사용자의 자연어 입력에 대한 추천 응답과 추천 영화 카드를 표시한다. |
| Character Conversation | 영화 속 캐릭터와의 대화 화면을 제공한다. |

### 4.4 Component Structure

프론트엔드 컴포넌트는 공통 컴포넌트와 기능 컴포넌트로 구분된다. 공통 컴포넌트는 여러 화면에서 반복적으로 사용되는 UI 요소이며, 기능 컴포넌트는 특정 화면의 사용자 흐름과 API 응답 표시를 담당한다.

| Component Group | Components | Role |
| --- | --- | --- |
| Layout | Header, Navigation, Page Layout | 공통 화면 구조와 페이지 이동을 제공한다. |
| Movie | Movie Card, Movie List, Movie Detail, Cast List | 영화 목록과 상세 정보를 표시한다. |
| Review and Favorite | Favorite Button, Review Form, Review List, Review Like Button | 찜하기, 리뷰 작성, 리뷰 좋아요 상호작용을 처리한다. |
| Recommendation | Onboarding Movie Grid, Recommendation Section, Recommended Movie Card | 선호 영화 선택과 맞춤 추천 결과를 표시한다. |
| Chat | Chat Message List, Chat Input, Suggested Question List | AI 추천 채팅과 캐릭터 대화 메시지를 표시하고 입력을 처리한다. |
| My Page | Profile Summary, My Page Tabs, Bookmarked Movie List, My Review List | 사용자 활동 데이터를 개인화 화면에 표시한다. |

### 4.5 State and API Interaction

프론트엔드는 화면별 UI 상태를 관리하고, 사용자 액션에 따라 백엔드 API를 호출한다. 검색어, 페이지네이션, 선택한 영화, 찜하기 상태, 리뷰 입력값, 온보딩 선택 목록, 채팅 메시지는 화면 상태로 관리된다.

API 요청 중에는 loading state를 표시하고, 데이터가 없을 때는 empty state를 제공한다. 요청 실패 시에는 error state를 표시하며, 로그인이 필요한 액션에서 인증되지 않은 사용자는 로그인 화면으로 이동하거나 로그인 필요 상태를 확인할 수 있다.

| State | Usage |
| --- | --- |
| Loading | API 요청 중임을 표시한다. |
| Error | API 실패 또는 입력 오류를 표시한다. |
| Empty | 조회 결과가 없을 때 대체 화면을 표시한다. |
| Form State | 리뷰 입력, 채팅 메시지, 검색어를 관리한다. |
| Selection State | 온보딩 선호 영화 선택 상태를 관리한다. |
| Optimistic State | 찜하기처럼 즉시 반영이 필요한 사용자 액션에 사용한다. |

### 4.6 Navigation Flow

씨네메이트의 주요 화면 이동은 영화 탐색 흐름과 개인화 기능 흐름으로 나뉜다. 사용자는 홈 또는 검색 화면에서 영화 상세 화면으로 이동할 수 있고, 로그인 후 온보딩을 완료하면 맞춤 추천, AI 추천 채팅, 캐릭터 대화, 마이페이지 기능을 사용할 수 있다.

| Flow | Description |
| --- | --- |
| Home/Search to Movie Detail | 영화 카드 선택 시 영화 상세 화면으로 이동한다. |
| Login to Onboarding | 신규 사용자는 로그인 후 온보딩 화면에서 선호 영화를 선택한다. |
| Onboarding to Recommendation | 선호 영화 저장이 완료되면 맞춤 추천 화면으로 이동한다. |
| Recommendation to Movie Detail | 추천 영화 카드를 선택하면 영화 상세 화면으로 이동한다. |
| Chat to Movie Detail | AI 추천 채팅의 추천 영화 카드를 통해 영화 상세 화면으로 이동한다. |
| Character Conversation | 캐릭터 대화 가능 영화와 캐릭터를 선택한 뒤 대화 화면으로 이동한다. |
| My Page to Movie Detail | 찜한 영화 또는 내가 작성한 리뷰의 영화를 선택하면 영화 상세 화면으로 이동한다. |

```{=latex}
\clearpage
```

## 5. System Architecture - Backend

### 5.1 Objectives

이 장에서는 씨네메이트 백엔드의 구조와 주요 하위 시스템을 설명한다. 백엔드는 Next.js Route Handler 기반의 API 서버로 동작하며, 프론트엔드에서 전달된 요청을 받아 인증, 영화 조회, 리뷰와 찜하기, 온보딩, 맞춤 추천, AI 추천 채팅, 캐릭터 대화 기능을 처리한다.

백엔드는 요청의 입력값과 사용자 권한을 확인한 뒤, 필요한 경우 Supabase DB, Supabase Auth, OpenAI API와 연동하여 결과를 생성한다. 각 기능은 사용자 관리, 영화 정보, 사용자 활동, 추천, 채팅 관련 하위 시스템으로 나뉘어 동작한다.

### 5.2 Overall Backend Architecture

씨네메이트 백엔드는 프론트엔드 요청을 API 계층에서 수신하고, 서비스 계층과 저장소 계층을 거쳐 데이터베이스 또는 외부 API와 통신하는 구조로 구성된다.

![Backend Overall Architecture](./assets/diagrams/backend-overall-architecture.png)

Figure 5.1: Overall Backend Architecture

- **Route Handler**: 프론트엔드의 HTTP 요청을 수신하고, 요청 파라미터와 body를 검증한다. 인증이 필요한 요청에서는 현재 사용자를 확인한 뒤 service를 호출한다.
- **Service**: 백엔드 기능의 처리 흐름을 담당한다. 영화 조회, 리뷰 작성, 찜하기, 온보딩 저장, 맞춤 추천, AI 추천 채팅, 캐릭터 대화와 같은 유스케이스를 조립한다.
- **Repository**: Supabase DB에 저장된 영화, 사용자, 리뷰, 추천, 채팅 데이터를 조회하거나 저장한다.
- **External API**: Supabase Auth는 사용자 인증을 처리하고, OpenAI API는 AI 추천 채팅과 캐릭터 대화 응답 생성에 사용된다.

백엔드의 기본 요청 처리 흐름은 다음과 같다.

1. 사용자가 프론트엔드 화면에서 요청을 수행한다.
2. 프론트엔드는 Next.js API Route로 HTTP 요청을 보낸다.
3. Route Handler는 요청값과 인증 상태를 확인한다.
4. Service는 요청 목적에 맞는 비즈니스 흐름을 수행한다.
5. Repository 또는 외부 API를 통해 필요한 데이터를 조회하거나 저장한다.
6. 처리 결과를 JSON 응답으로 프론트엔드에 반환한다.

```{=latex}
\clearpage
```

### 5.3 Subcomponents

#### 5.3.1 User Management System

##### Overview

User Management System은 사용자 인증과 사용자 프로필 정보를 관리하는 하위 시스템이다. 로그인과 로그아웃은 Supabase Auth를 기반으로 처리하며, 백엔드는 인증된 사용자 정보를 바탕으로 사용자별 기능 접근을 제어한다.

##### Responsibilities

- 로그인 사용자 식별
- 사용자 프로필 조회
- 온보딩 완료 여부 확인
- 인증이 필요한 기능에 사용자 정보 제공
- 사용자별 데이터 접근 제어

##### Sequence Diagram

![User Management Sequence Diagram](./assets/diagrams/sequence/user-management-sequence.png){width=0.90\linewidth}

Figure 5.2: User Management Sequence Diagram

이 다이어그램은 사용자가 사용자 정보를 요청했을 때, 백엔드가 세션 확인과 프로필 조회를 거쳐 사용자 정보를 반환하는 흐름을 나타낸다. 인증되지 않은 요청은 사용자 정보 조회 없이 401 응답을 반환한다.

```{=latex}
\clearpage
```

#### 5.3.2 Movie Information System

##### Overview

Movie Information System은 영화 목록, 검색, 상세 조회에 필요한 영화 정보를 제공하는 하위 시스템이다. 백엔드는 영화 기본 정보, 장르, 출연진, 제작진, 통계 데이터를 조회하여 프론트엔드 화면에서 사용할 수 있는 형태로 반환한다.

##### Responsibilities

- 영화 목록 조회
- 영화 검색
- 영화 상세 정보 조회
- 장르, 출연진, 제작진 정보 제공
- 영화 카드 및 상세 화면 데이터 구성

##### Sequence Diagram

![Movie Information Sequence Diagram](./assets/diagrams/sequence/movie-information-sequence.png){width=0.90\linewidth}

Figure 5.3: Movie Information Sequence Diagram

이 다이어그램은 사용자가 영화 상세 정보를 요청했을 때, 백엔드가 영화 기본 정보와 장르, 출연진, 제작진 데이터를 조회하여 응답하는 흐름을 나타낸다.

```{=latex}
\clearpage
```

#### 5.3.3 Review and Favorite System

##### Overview

Review and Favorite System은 사용자의 영화 리뷰, 리뷰 좋아요, 찜하기 기능을 처리하는 하위 시스템이다. 백엔드는 로그인한 사용자 ID를 기준으로 리뷰 작성 권한과 찜하기 상태를 확인하고, 사용자 활동 데이터를 저장하거나 조회한다.

##### Responsibilities

- 리뷰 작성 및 조회
- 리뷰 좋아요 추가 및 취소
- 영화 찜하기 추가 및 해제
- 사용자별 리뷰와 찜한 영화 데이터 관리

##### Sequence Diagram

![Review and Bookmark Sequence Diagram](./assets/diagrams/sequence/review-bookmark-sequence.png){width=0.90\linewidth}

Figure 5.4: Review and Bookmark Sequence Diagram

이 다이어그램은 사용자가 리뷰를 작성했을 때, 백엔드가 인증 확인, 영화 존재 여부 확인, 리뷰 저장을 거쳐 작성 결과를 반환하는 흐름을 나타낸다. 인증되지 않은 요청은 리뷰 저장 단계로 진행하지 않고 401 응답을 반환한다.

```{=latex}
\clearpage
```

#### 5.3.4 Onboarding and Recommendation System

##### Overview

Onboarding and Recommendation System은 온보딩에서 선택한 선호 영화를 저장하고, 이를 기반으로 맞춤 추천 결과를 제공하는 하위 시스템이다. 백엔드는 사용자의 선호 영화와 MovieLens 기반 추천 데이터를 활용하여 추천 영화 목록을 구성한다.

##### Responsibilities

- 온보딩 선호 영화 저장
- 온보딩 완료 여부 갱신
- 선호 영화 기반 맞춤 추천 조회
- 영화 간 유사도와 태그 관련도 데이터 활용
- 추천 결과 영화 카드 데이터 구성

##### Sequence Diagram

![Onboarding and Recommendation Sequence Diagram](./assets/diagrams/sequence/onboarding-recommendation-sequence.png){width=0.90\linewidth}

Figure 5.5: Onboarding and Recommendation Sequence Diagram

이 다이어그램은 사용자가 맞춤 추천을 요청했을 때, 백엔드가 온보딩 선호 영화와 추천 데이터를 조회하여 추천 영화 목록을 반환하는 흐름을 나타낸다.

```{=latex}
\clearpage
```

#### 5.3.5 AI Recommendation Chat System

##### Overview

AI Recommendation Chat System은 사용자의 자연어 입력을 바탕으로 AI 추천 채팅을 처리하는 하위 시스템이다. 백엔드는 사용자의 메시지를 저장하고, OpenAI API를 활용하여 추천 조건을 분석한 뒤 추천 영화와 추천 사유를 생성한다.

##### Responsibilities

- 사용자 AI 추천 채팅 conversation 관리
- 사용자 메시지 저장
- 자연어 추천 요청 분석
- 추천 후보 영화 조회
- 추천 응답 메시지와 추천 영화 저장

##### Sequence Diagram

![AI Recommendation Chat Sequence Diagram](./assets/diagrams/sequence/ai-recommendation-chat-sequence.png){width=0.90\linewidth}

Figure 5.6: AI Recommendation Chat Sequence Diagram

이 다이어그램은 사용자가 AI 추천 채팅 메시지를 입력했을 때, 백엔드가 추천 의도 분석, 추천 후보 조회, 추천 사유 생성을 거쳐 응답을 반환하는 흐름을 나타낸다.

```{=latex}
\clearpage
```

#### 5.3.6 Character Conversation System

##### Overview

Character Conversation System은 사용자가 영화 속 캐릭터와 대화할 수 있도록 지원하는 하위 시스템이다. 백엔드는 캐릭터 정보, persona prompt, 영화 사건, 캐릭터별 관점 정보를 활용하여 캐릭터 대화 응답을 생성하고 대화 기록을 저장한다.

##### Responsibilities

- 영화별 캐릭터 목록 제공
- 캐릭터 기본 질문 제공
- 캐릭터 대화 conversation 관리
- 사용자 메시지와 캐릭터 응답 저장
- 캐릭터 persona와 사건 정보를 활용한 응답 생성

##### Sequence Diagram

![Character Chat Sequence Diagram](./assets/diagrams/sequence/character-chat-sequence.png){width=0.90\linewidth}

Figure 5.7: Character Chat Sequence Diagram

이 다이어그램은 사용자가 캐릭터에게 메시지를 입력했을 때, 백엔드가 캐릭터 context 조회, 응답 생성, 메시지 저장을 거쳐 캐릭터 응답을 반환하는 흐름을 나타낸다.

```{=latex}
\clearpage
```

## 6. Protocol Design

### 6.1 Objectives

이 장에서는 씨네메이트의 프론트엔드와 백엔드가 통신하는 방식을 설명한다. 씨네메이트는 HTTP 기반 REST API를 사용하며, 요청과 응답 데이터는 JSON 형식을 기본으로 한다.

Protocol Design은 사용자 인증, 영화 조회, 리뷰와 찜하기, 온보딩, 맞춤 추천, AI 추천 채팅, 캐릭터 대화 기능에서 사용되는 API 통신 규칙을 정의한다.

### 6.2 Communication Protocol

프론트엔드는 사용자의 화면 입력을 HTTP 요청으로 변환하여 Next.js Route Handler에 전달한다. 백엔드는 요청을 처리한 뒤 HTTP status code와 JSON 응답을 반환한다.

| Item | Description |
| --- | --- |
| Protocol | HTTP |
| API Style | REST API |
| Data Format | JSON |
| Client | Next.js frontend |
| Server | Next.js Route Handler |
| External Services | Supabase Auth, Supabase DB, OpenAI API, TMDB API |

### 6.3 Request and Response Format

씨네메이트의 API는 JSON 기반 요청과 응답을 사용한다. 조회 API는 path parameter와 query string을 사용하고, 생성, 수정, 메시지 전송 API는 request body를 사용한다.

| Request Element | Description | Example |
| --- | --- | --- |
| Path Parameter | 특정 리소스를 식별하는 값 | `/api/movies/{movieId}` |
| Query String | 검색어, 정렬, 페이지네이션 조건 | `/api/movies?query=avatar&page=1&size=20` |
| Request Body | 생성, 수정, 메시지 전송에 필요한 데이터 | `{ "rating": 4.5, "content": "..." }` |

성공 응답은 API 목적에 따라 단일 객체, 목록 객체, 작업 결과 객체를 반환한다.

| Response Type | Description |
| --- | --- |
| Single Resource | 사용자 정보, 영화 상세, 리뷰 작성 결과처럼 단일 데이터를 반환 |
| List Resource | 영화 목록, 리뷰 목록, 찜한 영화 목록처럼 여러 데이터를 반환 |
| Action Result | 삭제, 찜하기 해제처럼 작업 수행 결과를 반환 |

에러 응답은 다음 공통 형식을 사용한다.

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Authentication is required.",
    "requestId": "req_...",
    "details": {}
  }
}
```

### 6.4 API List

씨네메이트의 API는 기능 영역에 따라 사용자, 영화, 리뷰와 찜하기, 온보딩과 맞춤 추천, AI 추천 채팅, 캐릭터 대화 API로 구분된다.

#### 6.4.1 User API

User API는 현재 로그인한 사용자의 프로필과 서비스 이용 상태를 조회하는 데 사용된다. 로그인과 로그아웃은 Supabase Auth를 통해 처리되며, 백엔드는 인증된 사용자 ID를 기준으로 사용자 정보를 반환한다.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/me` | 현재 로그인한 사용자 정보와 온보딩 완료 여부를 조회한다. | Required |

#### 6.4.2 Movie API

Movie API는 홈, 검색, 영화 상세 화면에서 필요한 영화 정보를 제공하는 데 사용된다. 영화 목록과 상세 정보는 공개 데이터로 제공되며, 요청에 따라 검색어, 정렬, 페이지네이션 조건을 함께 전달할 수 있다.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/movies` | 영화 목록을 조회하거나 검색어와 정렬 조건에 맞는 영화 목록을 조회한다. | Optional |
| GET | `/api/movies/{movieId}` | 특정 영화의 상세 정보, 장르, 출연진, 제작진 정보를 조회한다. | Optional |
| GET | `/api/movies/{movieId}/similar` | 특정 영화와 유사한 영화를 조회한다. | Optional |
| GET | `/api/genres` | 영화 장르 목록을 조회한다. | None |

#### 6.4.3 Review and Favorite API

Review and Favorite API는 영화 상세 화면과 마이페이지에서 사용하는 사용자 활동 API이다. 리뷰 조회는 비로그인 사용자도 사용할 수 있지만, 리뷰 작성, 리뷰 좋아요, 찜하기 기능은 로그인한 사용자만 사용할 수 있다.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/me/bookmarked-movies` | 현재 사용자가 찜한 영화 목록을 조회한다. | Required |
| PUT | `/api/me/bookmarked-movies/{movieId}` | 특정 영화를 찜한 영화 목록에 추가한다. | Required |
| DELETE | `/api/me/bookmarked-movies/{movieId}` | 특정 영화를 찜한 영화 목록에서 삭제한다. | Required |
| GET | `/api/movies/{movieId}/reviews` | 특정 영화의 리뷰 목록을 조회한다. | Optional |
| POST | `/api/movies/{movieId}/reviews` | 특정 영화에 리뷰와 평점을 작성한다. | Required |
| GET | `/api/me/reviews` | 현재 사용자가 작성한 리뷰 목록을 조회한다. | Required |
| PUT | `/api/reviews/{reviewId}/like` | 특정 리뷰에 좋아요를 추가한다. | Required |
| DELETE | `/api/reviews/{reviewId}/like` | 특정 리뷰의 좋아요를 취소한다. | Required |

#### 6.4.4 Onboarding and Recommendation API

Onboarding and Recommendation API는 사용자의 선호 영화 선택과 맞춤 추천 결과 조회에 사용된다. 온보딩에서 저장된 선호 영화는 맞춤 추천의 기준 데이터로 활용된다.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/me/preferences/movies` | 현재 사용자가 온보딩에서 선택한 선호 영화 목록을 조회한다. | Required |
| PUT | `/api/me/preferences/movies` | 온보딩에서 선택한 선호 영화 5개를 저장한다. | Required |
| GET | `/api/me/recommendations/item-cf` | 온보딩 선호 영화 기반 맞춤 추천 섹션을 조회한다. | Required |

#### 6.4.5 AI Recommendation Chat API

AI Recommendation Chat API는 자연어 기반 AI 추천 채팅을 처리하는 데 사용된다. 사용자의 메시지를 기반으로 추천 조건을 분석하고, 추천 영화와 추천 사유를 포함한 응답을 반환한다.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/recommendation-chat/initial-questions` | AI 추천 채팅 화면의 초기 추천 질문 목록을 조회한다. | None |
| POST | `/api/recommendation-chat/messages` | 사용자의 추천 질문을 전송하고 AI 추천 응답을 생성한다. | Required |
| GET | `/api/recommendation-chat/conversations` | 현재 사용자의 AI 추천 채팅 대화 목록을 조회한다. | Required |
| GET | `/api/recommendation-chat/conversations/{conversationId}` | 특정 AI 추천 채팅 대화의 메시지와 추천 결과를 조회한다. | Required |

#### 6.4.6 Character Conversation API

Character Conversation API는 영화 속 캐릭터와의 대화를 처리하는 데 사용된다. 사용자는 캐릭터 대화가 가능한 영화를 선택하고, 특정 캐릭터와 대화 세션을 생성한 뒤 메시지를 주고받을 수 있다.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/character-chat/movies` | 캐릭터 대화가 가능한 영화 목록을 조회한다. | Required |
| GET | `/api/character-chat/movies/{movieId}/characters` | 특정 영화의 캐릭터 목록을 조회한다. | Required |
| POST | `/api/character-chat/conversations` | 선택한 캐릭터와의 대화 세션을 생성하고, 초기 인사와 캐릭터별 기본 추천 질문을 반환한다. | Required |
| POST | `/api/character-chat/conversations/{conversationId}/messages` | 캐릭터 대화 세션에 사용자 메시지를 전송하고 캐릭터 응답을 생성한다. | Required |

```{=latex}
\clearpage
```

## 7. Database Design

### 7.1 Objectives

이 장에서는 씨네메이트 시스템에서 사용하는 데이터베이스 구조를 설명한다. 씨네메이트는 Supabase PostgreSQL을 사용하며, Drizzle ORM schema를 기준으로 영화 정보, 사용자 정보, 리뷰와 찜하기, 온보딩, 맞춤 추천, AI 추천 채팅, 캐릭터 대화 데이터를 관리한다.

데이터베이스는 크게 다음 데이터로 구성된다.

- 영화 카탈로그 데이터: 영화의 기본 정보와 장르, 출연진, 제작진 정보를 저장한다.
- 사용자 활동 데이터: 프로필, 찜한 영화, 온보딩 선택 영화, 리뷰, 리뷰 좋아요를 저장한다.
- 추천 데이터: MovieLens 기반 통계, 영화 간 유사도, 태그 관련도를 저장한다.
- 채팅 데이터: AI 추천 채팅과 캐릭터 대화 기록을 저장한다.

### 7.2 ER Diagram

ERD는 영화 장르 및 인물 정보, 사용자 활동, 맞춤 추천, AI 추천 채팅, 캐릭터 대화 영역으로 구분하여 설명한다.

#### 7.2.1 Genre and People

![Genre and People ERD](./assets/diagrams/genre-people-erd.png)

Figure 7.1: Genre and People ERD

- `movies`: 영화 기본 정보
- `genres`: TMDB 장르 정보
- `movie_genres`: 영화와 장르의 연결 정보
- `people`: 배우 및 제작진 인물 정보
- `movie_casts`: 영화 출연진과 배역 정보
- `movie_crew`: 영화 제작진 정보

#### 7.2.2 Review and Bookmark

![Review and Bookmark ER Diagram](./assets/diagrams/review-bookmark-erd.png)

Figure 7.2: Review and Bookmark ER Diagram

- `profiles`: 사용자 프로필 정보
- `movies`: 영화 기본 정보
- `movie_bookmarks`: 사용자와 찜한 영화의 관계
- `reviews`: 영화 리뷰, 평점, 작성자 정보
- `review_likes`: 리뷰 좋아요 정보

#### 7.2.3 Onboarding and Recommendation

![Onboarding and Recommendation ERD](./assets/diagrams/onboarding-recommendation-erd.png)

Figure 7.3: Onboarding and Recommendation ERD

- `profiles`: 사용자 프로필 정보
- `movies`: 영화 기본 정보
- `user_onboarding_movies`: 사용자가 온보딩에서 선택한 선호 영화
- `movie_stats`: MovieLens 평점, 씨네메이트 리뷰 집계 등 영화 통계
- `movie_similarities`: Item CF 기반 영화 간 유사도
- `movie_tags`: MovieLens Tag Genome 태그
- `movie_tag_relevances`: 영화와 태그의 관련도
- `movie_tag_mapping_embeddings`: 태그 매핑용 embedding 정보

#### 7.2.4 AI Recommendation Chat

![AI Recommendation Chat ERD](./assets/diagrams/ai-recommendation-chat-erd.png)

Figure 7.4: AI Recommendation Chat ERD

- `profiles`: 사용자 프로필 정보
- `movies`: 영화 기본 정보
- `recommendation_chat_conversations`: 사용자별 AI 추천 채팅 대화
- `recommendation_chat_conversation_messages`: 대화 메시지와 분석 결과
- `recommendation_chat_conversation_message_movies`: 응답 메시지에 포함된 추천 영화와 추천 사유

#### 7.2.5 Character Chat

![Character Chat ERD](./assets/diagrams/character-chat-erd.png)

Figure 7.5: Character Chat ERD

- `movies`: 영화 기본 정보
- `profiles`: 사용자 프로필 정보
- `characters`: 영화별 캐릭터 정보, 설명, 첫 인사, persona prompt, 캐릭터 이미지 경로
- `character_chat_events`: 영화 대본에서 추출한 주요 사건 요약
- `character_chat_event_participants`: 특정 사건을 각 캐릭터가 어떻게 겪고 기억하는지에 대한 정보
- `character_chat_default_questions`: 캐릭터 대화 시작 시 보여줄 기본 추천 질문
- `character_chat_conversations`: 사용자와 캐릭터 사이의 대화 세션
- `character_chat_conversation_messages`: 캐릭터 대화 메시지 기록

### 7.3 Entity Descriptions

#### 7.3.1 Genre and People

##### movies

| Field                  | Type        | Description                     |
| ---------------------- | ----------- | ------------------------------- |
| `id`                   | bigint      | TMDB movie id                   |
| `movielens_id`         | bigint      | MovieLens movie id              |
| `title`                | text        | TMDB 요청 언어 기준 표시 제목             |
| `original_title`       | text        | 영화 원제                           |
| `overview`             | text        | 영화 줄거리                          |
| `release_date`         | date        | 개봉일                             |
| `release_year`         | int         | 개봉 연도                           |
| `runtime`              | int         | 러닝타임                            |
| `original_language`    | text        | 영화 원래 언어 코드                     |
| `production_countries` | jsonb       | 제작 국가 코드 목록                     |
| `poster_path`          | text        | 영화 포스터 이미지를 조회하기 위한 TMDB 이미지 경로 |
| `backdrop_path`        | text        | 영화 상세 화면 등에 사용하는 가로형 대표 이미지 경로  |
| `trailer_url`          | text        | 예고편 URL                         |
| `adult`                | boolean     | 성인 콘텐츠 여부                       |
| `created_at`           | timestamptz | 생성 시각                           |
| `updated_at`           | timestamptz | 수정 시각                           |

##### genres

| Field | Type | Description |
| --- | --- | --- |
| `id` | bigint | TMDB genre id |
| `name` | text | 장르 이름 |
| `name_ko` | text | 한국어 장르 이름 |

##### movie_genres

| Field | Type | Description |
| --- | --- | --- |
| `movie_id` | bigint | 영화 ID |
| `genre_id` | bigint | TMDB 장르 ID |

##### people

| Field | Type | Description |
| --- | --- | --- |
| `id` | bigint | TMDB person id |
| `name` | text | 표시 이름 |
| `profile_path` | text | 인물 프로필 이미지를 조회하기 위한 TMDB 이미지 경로 |
| `known_for_department` | text | 주요 분야 |
| `popularity` | numeric | TMDB 인물 popularity |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

##### movie_casts

| Field | Type | Description |
| --- | --- | --- |
| `movie_id` | bigint | 영화 ID |
| `person_id` | bigint | 배우 ID |
| `character_name` | text | 배역명 |
| `cast_order` | int | 출연 순서 |

##### movie_crew

| Field | Type | Description |
| --- | --- | --- |
| `movie_id` | bigint | 영화 ID |
| `person_id` | bigint | 인물 ID |
| `department` | text | 제작 부서 |
| `job` | text | 제작 역할 |

#### 7.3.2 Review and Bookmark

##### profiles

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | 사용자 ID |
| `name` | text | 표시 이름 |
| `email` | text | 이메일 |
| `profile_image_url` | text | 프로필 이미지 URL |
| `onboarding_completed` | boolean | 온보딩 완료 여부 |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

##### movie_bookmarks

| Field | Type | Description |
| --- | --- | --- |
| `user_id` | uuid | 사용자 ID |
| `movie_id` | bigint | 찜한 영화 ID |
| `created_at` | timestamptz | 생성 시각 |

##### reviews

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | 리뷰 ID |
| `user_id` | uuid | 작성자 ID |
| `movie_id` | bigint | 영화 ID |
| `rating` | numeric(2,1) | 0.5~5.0 평점 |
| `content` | text | 리뷰 본문 |
| `created_at` | timestamptz | 작성 시각 |

##### review_likes

| Field | Type | Description |
| --- | --- | --- |
| `review_id` | uuid | 리뷰 ID |
| `user_id` | uuid | 좋아요를 누른 사용자 ID |
| `created_at` | timestamptz | 생성 시각 |

#### 7.3.3 Onboarding and Recommendation

##### user_onboarding_movies

| Field | Type | Description |
| --- | --- | --- |
| `user_id` | uuid | 사용자 ID |
| `movie_id` | bigint | 온보딩에서 선택한 영화 ID |
| `position` | int | 사용자가 선택한 순서 |
| `created_at` | timestamptz | 생성 시각 |

##### movie_stats

| Field | Type | Description |
| --- | --- | --- |
| `movie_id` | bigint | 영화 ID |
| `movielens_avg_rating` | numeric(3,2) | MovieLens 평균 평점 |
| `movielens_rating_count` | int | MovieLens 평점 수 |
| `cinemate_rating_sum` | numeric(10,2) | 씨네메이트 리뷰 평점 합 |
| `cinemate_review_count` | int | 씨네메이트 리뷰 수 |
| `user_tag_count` | int | MovieLens 사용자 태그 수 |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

##### movie_similarities

| Field | Type | Description |
| --- | --- | --- |
| `source_movie_id` | bigint | 기준 영화 ID |
| `target_movie_id` | bigint | 함께 추천할 영화 ID |
| `score` | real | Item CF 유사도 점수 |
| `co_rating_count` | int | 두 영화를 함께 평가한 사용자 수 |

##### movie_tags

| Field | Type | Description |
| --- | --- | --- |
| `tag_id` | int | MovieLens Tag Genome tag id |
| `tag` | text | tag 이름 |

##### movie_tag_relevances

| Field | Type | Description |
| --- | --- | --- |
| `movie_id` | bigint | 영화 ID |
| `tag_id` | int | MovieLens Tag Genome tag id |
| `relevance` | real | tag와 영화의 관련도 점수 |

##### movie_tag_mapping_embeddings

| Field | Type | Description |
| --- | --- | --- |
| `tag_id` | int | MovieLens Tag Genome tag id |
| `embedding_model` | text | 태그 벡터 생성에 사용한 모델명 |
| `embedding` | vector(1536) | 사용자 입력 태그와 서비스 태그를 비교하기 위한 벡터 값 |
| `created_at` | timestamptz | 생성 시각 |

#### 7.3.4 AI Recommendation Chat

##### recommendation_chat_conversations

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | AI 추천 채팅 대화 ID |
| `user_id` | uuid | 사용자 ID |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

##### recommendation_chat_conversation_messages

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | 메시지 ID |
| `conversation_id` | uuid | 대화 ID |
| `role` | text | `request` 또는 `response` |
| `content` | text | 메시지 본문 |
| `analysis_result` | jsonb | LLM 추천 요청 분석 결과 JSON |
| `created_at` | timestamptz | 생성 시각 |

##### recommendation_chat_conversation_message_movies

| Field | Type | Description |
| --- | --- | --- |
| `message_id` | uuid | 추천 응답 메시지 ID |
| `movie_id` | bigint | 추천 영화 ID |
| `rank` | int | 추천 순위 |
| `reason` | text | LLM이 생성한 추천 사유 |

#### 7.3.5 Character Chat

##### characters

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | 캐릭터 ID |
| `movie_id` | bigint | 연결 영화 ID |
| `actor_person_id` | bigint | 배우 ID |
| `name` | text | 캐릭터 이름 |
| `description` | text | 캐릭터 설명 |
| `greeting` | text | 첫 인사 |
| `persona_prompt` | text | 캐릭터 대화 프롬프트 |
| `avatar_storage_path` | text | 캐릭터 이미지를 저장한 Supabase Storage 경로 |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

##### character_chat_events

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | 사건 ID |
| `movie_id` | bigint | 연결 영화 ID |
| `event_order` | int | 영화 대본 내 사건 순서 |
| `title` | text | 사건 짧은 제목 |
| `summary` | text | 사건 객관 요약 |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

##### character_chat_event_participants

| Field | Type | Description |
| --- | --- | --- |
| `event_id` | uuid | 사건 ID |
| `character_id` | uuid | 캐릭터 ID |
| `role` | text | 사건에서 캐릭터의 역할 |
| `perspective_summary` | text | 캐릭터 관점의 사건 요약 |
| `emotional_impact` | text | 사건이 캐릭터에게 남긴 감정과 변화 |
| `knowledge_state` | text | 이 사건 이후 캐릭터가 알고 있거나 모르는 사실 |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

##### character_chat_default_questions

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | 기본 추천 질문 ID |
| `character_id` | uuid | 캐릭터 ID |
| `question` | text | 기본 추천 질문 |
| `display_order` | int | 표시 순서 |

##### character_chat_conversations

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | 캐릭터 대화 ID |
| `user_id` | uuid | 사용자 ID |
| `character_id` | uuid | 캐릭터 ID |
| `created_at` | timestamptz | 생성 시각 |
| `updated_at` | timestamptz | 수정 시각 |

##### character_chat_conversation_messages

| Field | Type | Description |
| --- | --- | --- |
| `id` | uuid | 메시지 ID |
| `conversation_id` | uuid | 캐릭터 대화 ID |
| `sender_type` | text | `user` 또는 `character` |
| `content` | text | 메시지 본문 |
| `created_at` | timestamptz | 생성 시각 |

```{=latex}
\clearpage
```

## 8. Testing Plan

### 8.1 Objectives

이 장에서는 씨네메이트의 테스트 계획을 설명한다. 테스트는 개발 과정에서 발생할 수 있는 오류를 확인하고, 배포 전 주요 기능이 안정적으로 동작하는지 검증하며, 실제 사용자의 이용 흐름에서 문제가 없는지 확인하는 것을 목적으로 한다.

씨네메이트의 테스트는 개발 테스트, 릴리스 테스트, 사용자 테스트로 구분한다. 각 테스트는 인증, 영화 탐색, 리뷰와 찜하기, 온보딩, 맞춤 추천, AI 추천 채팅, 캐릭터 대화 기능을 중심으로 수행한다.

### 8.2 Testing Policy

#### 8.2.1 Development Testing

Development Testing은 개발 과정에서 기능 단위의 오류를 발견하고 수정하기 위한 테스트이다. 프론트엔드 화면, 백엔드 API, 데이터베이스 접근 로직, 외부 API 연동이 각각 의도한 방식으로 동작하는지 확인한다.

Performance 측면에서는 사용자의 주요 요청이 정해진 시간 안에 처리되는지 확인한다.

- 영화 검색 결과는 3초 이내에 화면에 표시되어야 한다.
- 영화 상세 조회 결과는 3초 이내에 화면에 표시되어야 한다.
- 리뷰 작성, 리뷰 좋아요, 찜하기 요청은 3초 이내에 처리 결과가 화면에 반영되어야 한다.
- 온보딩 영화 선택 결과는 3초 이내에 저장되어야 한다.
- 맞춤 추천 결과는 5초 이내에 화면에 표시되어야 한다.
- AI 추천 채팅과 캐릭터 대화 응답은 5초 이내에 화면에 표시되어야 한다.

Reliability 측면에서는 각 하위 시스템이 독립적으로 동작한 뒤 전체 흐름에서도 정상적으로 연결되는지 확인한다.

- 로그인 사용자의 세션 정보가 백엔드 API에서 올바르게 식별되어야 한다.
- 영화 데이터, 리뷰 데이터, 찜하기 데이터가 서로 일관된 관계를 유지해야 한다.
- 추천 결과에 존재하지 않는 영화가 포함되지 않아야 한다.
- 채팅 메시지와 추천 영화 정보가 대화 기록에 올바르게 저장되어야 한다.

Security 측면에서는 인증이 필요한 기능에 대해 사용자 권한이 올바르게 적용되는지 확인한다.

- 로그인하지 않은 사용자는 리뷰 작성, 찜하기, 온보딩 저장, 맞춤 추천, 채팅 기능을 사용할 수 없어야 한다.
- 사용자는 다른 사용자의 리뷰 수정, 찜하기 목록, 채팅 기록에 접근할 수 없어야 한다.
- API 응답에는 인증 토큰, 내부 오류 stack, 외부 API key 등 민감한 정보가 포함되지 않아야 한다.

#### 8.2.2 Release Testing

Release Testing은 씨네메이트의 배포 버전이 최신의 완전한 상태로 동작하는지 확인하기 위한 테스트이다. 릴리스 테스트는 실제 배포 전에 수행하며, 개발 테스트에서 확인한 기능들이 하나의 서비스로 통합된 뒤에도 정상적으로 작동하는지 검토한다.

본 시스템은 기본 기능이 구현된 알파 버전에서 개발 테스트를 수행하고, 이후 주요 기능이 통합된 베타 버전을 대상으로 릴리스 테스트를 진행한다. 베타 버전에서는 인증, 영화 탐색, 리뷰와 찜하기, 온보딩, 맞춤 추천, AI 추천 채팅, 캐릭터 대화 기능이 실제 배포 환경에서도 정상적으로 연결되는지 확인한다. 또한 Supabase DB, Supabase Auth, TMDB API, OpenAI API와 같은 외부 의존성이 배포 환경에서 올바르게 동작하는지 함께 점검한다.

베타 버전에 대한 릴리스 테스트가 완료된 뒤에는 사용자 테스트를 통해 실제 사용자의 피드백을 수집하고, 발견된 오류나 개선점을 반영한 후 최종 배포를 진행한다.

#### 8.2.3 User Testing

User Testing은 실제 사용자가 씨네메이트를 사용하는 흐름을 기준으로 수행한다. 사용자는 영화 탐색부터 개인 활동 관리, 추천 기능, 채팅 기능까지 주요 기능을 직접 사용해 보고 화면 구성과 기능 동작에 문제가 없는지 확인한다.

사용자 테스트 시나리오는 다음과 같다.

- 사용자가 로그인한 뒤 온보딩에서 선호 영화를 선택한다.
- 사용자가 영화를 검색하고 상세 정보를 확인한다.
- 사용자가 관심 있는 영화를 찜하고 마이페이지에서 확인한다.
- 사용자가 영화 리뷰를 작성하고 다른 리뷰에 좋아요를 누른다.
- 사용자가 맞춤 추천 결과를 확인하고 추천된 영화의 상세 화면으로 이동한다.
- 사용자가 AI 추천 채팅에서 조건을 입력하고 추천 영화를 확인한다.
- 사용자가 영화 캐릭터를 선택하고 캐릭터와 대화를 진행한다.

#### 8.2.4 Testing Case

| Test ID | Test Target | Scenario | Expected Result |
| --- | --- | --- | --- |
| TC-01 | User Management | 사용자가 Google 로그인을 수행한다. | 로그인 후 사용자 프로필이 생성되거나 조회된다. |
| TC-02 | Movie Search | 사용자가 검색어를 입력해 영화를 검색한다. | 검색어와 관련된 영화 목록이 표시된다. |
| TC-03 | Movie Detail | 사용자가 영화 상세 화면에 진입한다. | 영화 기본 정보, 장르, 출연진, 리뷰 정보가 표시된다. |
| TC-04 | Favorite | 로그인 사용자가 영화를 찜한다. | 해당 영화가 찜한 영화 목록에 추가된다. |
| TC-05 | Review | 로그인 사용자가 리뷰를 작성한다. | 작성한 리뷰가 영화 상세 화면에 표시된다. |
| TC-06 | Review Like | 로그인 사용자가 리뷰 좋아요를 누른다. | 리뷰 좋아요 수와 사용자의 좋아요 상태가 갱신된다. |
| TC-07 | Onboarding | 사용자가 온보딩에서 선호 영화를 선택한다. | 선택한 영화가 저장되고 온보딩 완료 상태가 반영된다. |
| TC-08 | Recommendation | 사용자가 맞춤 추천 화면에 진입한다. | 사용자 선호 기반 추천 영화 목록이 표시된다. |
| TC-09 | AI Recommendation Chat | 사용자가 AI 추천 채팅에 메시지를 입력한다. | AI 응답과 추천 영화 목록이 대화에 표시된다. |
| TC-10 | Character Conversation | 사용자가 캐릭터에게 질문을 입력한다. | 캐릭터의 설정에 맞는 응답이 대화에 표시된다. |

```{=latex}
\clearpage
```

## 9. Development Plan

### 9.1 Objectives

이 장에서는 씨네메이트의 개발 환경, 사용 기술, 제약사항, 시스템 의존성을 설명한다. 씨네메이트는 웹 기반 영화 서비스이므로 프론트엔드, 백엔드, 데이터베이스, 외부 API가 함께 동작하는 구조를 기준으로 개발한다.

### 9.2 Frontend Environment

#### 9.2.1 Next.js

<p align="center">
  <img src="./assets/logos/nextjs-logo.png" width="96" alt="Next.js Logo" />
</p>

<p align="center"><em>Figure 9.1: Next.js Logo</em></p>

Next.js는 React 기반 웹 애플리케이션 프레임워크이다. 씨네메이트에서는 App Router를 사용하여 화면 경로를 구성하고, 서버 컴포넌트와 클라이언트 컴포넌트를 기능에 따라 분리한다.

#### 9.2.2 React

<p align="center">
  <img src="./assets/logos/react-logo.png" width="96" alt="React Logo" />
</p>

<p align="center"><em>Figure 9.2: React Logo</em></p>

React는 사용자 인터페이스를 컴포넌트 단위로 구성하기 위한 라이브러리이다. 씨네메이트에서는 영화 카드, 리뷰 목록, 찜하기 버튼, 추천 영화 목록, 채팅 메시지 영역과 같은 UI를 재사용 가능한 컴포넌트로 구현한다.

#### 9.2.3 TypeScript

<p align="center">
  <img src="./assets/logos/typescript-logo.png" width="96" alt="TypeScript Logo" />
</p>

<p align="center"><em>Figure 9.3: TypeScript Logo</em></p>

TypeScript는 JavaScript에 정적 타입을 추가한 언어이다. 씨네메이트에서는 API 응답, 컴포넌트 props, 서비스 입력값의 타입을 명확히 정의하여 프론트엔드와 백엔드 사이의 데이터 구조를 안정적으로 관리한다.

#### 9.2.4 Tailwind CSS

<p align="center">
  <img src="./assets/logos/tailwindcss-logo.png" width="96" alt="Tailwind CSS Logo" />
</p>

<p align="center"><em>Figure 9.4: Tailwind CSS Logo</em></p>

Tailwind CSS는 유틸리티 클래스 기반의 스타일링 도구이다. 씨네메이트에서는 화면 레이아웃, 간격, 색상, 반응형 UI를 빠르게 구성하기 위해 사용한다.

### 9.3 Backend Environment

#### 9.3.1 Next.js Route Handler

<p align="center">
  <img src="./assets/logos/nextjs-logo.png" width="96" alt="Next.js Logo" />
</p>

<p align="center"><em>Figure 9.5: Next.js Route Handler Logo</em></p>

Next.js Route Handler는 씨네메이트의 백엔드 API endpoint를 구현하는 데 사용한다. 각 API는 요청 파싱, 인증 확인, 입력 검증, 서비스 호출, 응답 생성을 담당한다.

#### 9.3.2 Supabase

<p align="center">
  <img src="./assets/logos/supabase-logo.png" width="96" alt="Supabase Logo" />
</p>

<p align="center"><em>Figure 9.6: Supabase Logo</em></p>

Supabase는 인증과 PostgreSQL 기반 데이터베이스를 제공한다. 씨네메이트에서는 Supabase Auth를 통해 사용자 로그인을 처리하고, Supabase PostgreSQL에 영화, 사용자 활동, 추천, 채팅 데이터를 저장한다.

#### 9.3.3 Drizzle ORM

<p align="center">
  <img src="./assets/logos/drizzle-logo.png" width="96" alt="Drizzle ORM Logo" />
</p>

<p align="center"><em>Figure 9.7: Drizzle ORM Logo</em></p>

Drizzle ORM은 TypeScript 기반 ORM이다. 씨네메이트에서는 데이터베이스 schema를 코드로 관리하고, 백엔드 repository 계층에서 영화, 리뷰, 찜하기, 추천, 채팅 데이터를 조회하거나 저장할 때 사용한다.

#### 9.3.4 OpenAI API

<p align="center">
  <img src="./assets/logos/openai-logo.png" width="96" alt="OpenAI Logo" />
</p>

<p align="center"><em>Figure 9.8: OpenAI Logo</em></p>

OpenAI API는 AI 추천 채팅과 캐릭터 대화 기능에 사용한다. 사용자의 입력 메시지와 서비스에서 관리하는 영화 또는 캐릭터 정보를 바탕으로 자연어 응답을 생성한다.

#### 9.3.5 TMDB API

<p align="center">
  <img src="./assets/logos/tmdb-logo.png" width="96" alt="TMDB Logo" />
</p>

<p align="center"><em>Figure 9.9: TMDB Logo</em></p>

TMDB API는 영화 기본 정보, 장르, 포스터 이미지, 출연진과 제작진 정보를 수집하는 데 사용한다. 씨네메이트는 TMDB 기반 영화 ID와 이미지 path를 사용하여 영화 카탈로그 데이터를 구성한다.

#### 9.3.6 MovieLens Dataset

<p align="center">
  <img src="./assets/logos/movielens.png" width="96" alt="MovieLens Logo" />
</p>

<p align="center"><em>Figure 9.10: MovieLens Logo</em></p>

MovieLens Dataset은 영화 평점과 태그 기반 추천 데이터를 구성하는 데 사용한다. 씨네메이트는 MovieLens의 평점, 태그, 영화 매핑 데이터를 활용하여 맞춤 추천과 추천 채팅에 필요한 추천 데이터를 준비한다.

### 9.4 Constraints

씨네메이트는 다음 제약사항을 고려하여 설계하고 구현한다.

- 사용자는 웹 브라우저를 통해 서비스를 이용한다.
- 기존에 널리 사용되는 웹 기술과 오픈소스 라이브러리를 중심으로 개발한다.
- 인증이 필요한 기능은 로그인한 사용자만 사용할 수 있다.
- 클라이언트는 데이터베이스에 직접 접근하지 않고 백엔드 API를 통해 데이터를 요청한다.
- 사용자의 주요 요청은 Testing Plan에서 정의한 성능 기준을 만족할 수 있도록 구현한다.
- 사용자가 편리하게 이용할 수 있도록 화면 흐름과 UI를 구성한다.
- 시스템 비용과 유지보수 비용을 고려하여 개발한다.
- 향후 기능 확장과 데이터 확장을 고려하여 시스템을 설계한다.
- 소스 코드는 유지보수성을 고려하여 작성하고, 필요한 경우 주석을 통해 의도를 설명한다.
- 사용자 인증 정보, API key, 내부 오류 정보는 화면이나 API 응답에 노출되지 않아야 한다.
- 추천 결과와 채팅 응답은 사용자 입력과 데이터 상태에 따라 달라질 수 있다.

### 9.5 Assumptions and Dependencies

본 문서는 다음 가정을 기반으로 작성되었다.

- 사용자는 인터넷 연결이 가능한 환경에서 씨네메이트를 이용한다.
- 사용자는 최신 웹 브라우저 환경에서 서비스를 이용한다.
- Supabase Auth와 Supabase PostgreSQL이 정상적으로 동작한다.
- TMDB API를 통해 필요한 영화 메타데이터를 수집할 수 있다.
- MovieLens Dataset을 기반으로 추천 계산에 필요한 데이터를 준비할 수 있다.
- OpenAI API를 통해 AI 추천 채팅과 캐릭터 대화 응답을 생성할 수 있다.
- 캐릭터 대화에 필요한 캐릭터 설정, 사건 정보, 기본 질문 데이터가 사전에 준비되어 있다.

```{=latex}
\clearpage
```

## 10. Supporting Information

### 10.1 Software Design Specification

본 문서는 소프트웨어 요구사항 명세서 IEEE 권장사항(IEEE Recommended Practice for Software Requirements Specifications, IEEE-Std-830)을 참고하여 작성되었다.

### 10.2 Document History

| Date | Description | Version | Writer |
| --- | --- | --- | --- |
| 2026/05/24 | Purpose, Introduction, System Architecture - Overall 작성 | 1.0 | 서동규 |
| 2026/05/24 | System Architecture - Frontend, Backend 작성 | 1.0 | 왕지훈 |
| 2026/05/24 | Protocol Design, Database Design 작성 | 1.0 | 이진성 |
| 2026/05/24 | Testing Plan, Development Plan, Supporting Information 작성 | 1.0 | 정다연 |
