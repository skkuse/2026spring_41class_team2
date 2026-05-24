# Cinemate 디자인 명세서 목차안

## 1. Purpose

| 목차 | 핵심 내용 |
|---|---|
| 1.1 Readership | 문서 대상 독자: 개발팀, 교수/조교, 평가자, 프로젝트 이해관계자 |
| 1.2 Scope | Cinemate가 제공하는 영화 탐색, 리뷰, 북마크, 추천, AI 채팅 기능의 설계 범위 |
| 1.3 Objective | 요구사항 명세서를 기반으로 시스템 구조, 주요 기능, DB, API, 테스트 계획을 설명 |
| 1.4 Document Structure | 각 장에서 다루는 내용을 간단히 소개 |

## 2. Introduction

| 목차 | 핵심 내용 |
|---|---|
| 2.1 Objectives | Cinemate 설계 문서의 배경과 설계 관점 소개 |
| 2.2 Applied Diagrams | 문서에 사용할 다이어그램 종류 설명 |
| 2.2.1 Used Tools | draw.io, Figma, Mermaid, ERD 도구 등 사용 도구 |
| 2.2.2 Use Case Diagram | 사용자, 회원, 시스템 간 주요 기능 관계 |
| 2.2.3 Sequence Diagram | 로그인, 영화 검색, 리뷰 작성, 추천 요청 등의 흐름 |
| 2.2.4 Class Diagram | 프론트엔드/백엔드 주요 모듈 구조 |
| 2.2.5 Context Diagram | Cinemate, 사용자, 외부 영화 데이터/API, DB 간 관계 |
| 2.2.6 Entity Relationship Diagram | 사용자, 영화, 리뷰, 북마크, 추천 관련 DB 구조 |
| 2.2.7 Project Scope | Cinemate의 핵심 기능과 제외 범위 |
| 2.2.8 References | 요구사항 명세서, API 문서, DB schema 문서, 사용 기술 문서 |

## 3. System Architecture - Overall

| 목차 | 핵심 내용 |
|---|---|
| 3.1 Objectives | 전체 시스템 구조 설명 목적 |
| 3.2 System Organization | 사용자, Next.js 프론트엔드, API Route, Supabase DB, 추천/AI 기능의 구성 |
| 3.2.1 System Diagram | 전체 아키텍처 다이어그램 |
| 3.3 Use Case Diagram | 비회원/회원 사용자가 수행할 수 있는 기능: 영화 탐색, 로그인, 리뷰, 북마크, 추천, 채팅 |

## 4. System Architecture - Frontend

| 목차 | 핵심 내용 |
|---|---|
| 4.1 Objectives | 프론트엔드 화면 구조와 사용자 흐름 설명 |
| 4.1.1 Authentication | 로그인, 회원가입, 세션 상태에 따른 화면 처리 |
| 4.1.2 Movie Browsing | 영화 목록, 검색, 상세 페이지 구성 |
| 4.1.3 Review and Bookmark | 리뷰 작성/조회/삭제, 북마크 추가/해제 UI 흐름 |
| 4.1.4 Recommendation | 선호 영화 기반 추천, Item-CF 추천 결과 화면 |
| 4.1.5 Chat Interface | 영화 추천 챗봇, 캐릭터 챗봇 화면 구성 |
| 4.1.6 My Page | 내 리뷰, 북마크, 선호 정보, 활동 내역 확인 화면 |

## 5. System Architecture - Backend

| 목차 | 핵심 내용 |
|---|---|
| 5.1 Objectives | 백엔드 구조와 주요 서비스 역할 설명 |
| 5.2 Overall Backend Architecture | Route Handler, Service, Repository, DB의 계층 구조 |
| 5.3 Subcomponents | 백엔드 기능별 하위 시스템 소개 |
| 5.3.1 User Management System | 회원가입, 로그인, 세션, 사용자 정보 관리 |
| 5.3.2 Movie Information System | 영화 목록, 상세 정보, 출연진, 장르 데이터 제공 |
| 5.3.3 Review and Bookmark System | 리뷰와 북마크 생성/조회/삭제 처리 |
| 5.3.4 Recommendation System | 온보딩 선호 영화, Item-CF 기반 추천 처리 |
| 5.3.5 Chat System | 추천 채팅, 캐릭터 채팅 요청 처리 |

## 6. Protocol Design

| 목차 | 핵심 내용 |
|---|---|
| 6.1 Objectives | 프론트엔드와 백엔드 간 통신 방식 설명 |
| 6.2 REST API and JSON | HTTP 기반 API, JSON request/response 사용 |
| 6.3 HTTPS | 배포 환경에서의 보안 통신 |
| 6.4 Authentication | 세션/쿠키 기반 인증 흐름 |
| 6.5 User API | 회원가입, 로그인, 로그아웃, 사용자 정보 조회 |
| 6.6 Movie API | 영화 목록 조회, 검색, 상세 조회 |
| 6.7 Review API | 리뷰 작성, 조회, 수정/삭제 |
| 6.8 Bookmark API | 영화 북마크 추가/해제, 목록 조회 |
| 6.9 Recommendation API | 선호 영화 저장, 추천 결과 조회 |
| 6.10 Chat API | 추천 챗봇, 캐릭터 챗봇 메시지 요청/응답 |

## 7. Database Design

| 목차 | 핵심 내용 |
|---|---|
| 7.1 Objectives | 데이터 구조와 테이블 관계 설명 |
| 7.2 ER Diagram | 전체 ERD |
| 7.2.1 User | 사용자 계정, 프로필, 인증 관련 정보 |
| 7.2.2 Movie | 영화 기본 정보, 장르, 포스터, 개봉일 등 |
| 7.2.3 Review | 사용자 리뷰, 평점, 작성일 |
| 7.2.4 Bookmark | 사용자가 저장한 영화 정보 |
| 7.2.5 Recommendation | 추천 계산에 필요한 선호 영화, 유사도, 추천 결과 |
| 7.2.6 Chat | 채팅 세션, 메시지, 캐릭터/추천 대화 기록 |
| 7.3 Relational Schema | 주요 테이블 간 PK/FK 관계 요약 |
| 7.4 SQL DDL | 핵심 테이블의 간략한 DDL 예시 |

## 8. Testing Plan

| 목차 | 핵심 내용 |
|---|---|
| 8.1 Objectives | 테스트 계획의 목적 |
| 8.2 Testing Policy | 기능, 통합, 사용자 테스트 중심의 검증 전략 |
| 8.2.1 Development Testing | 로그인, 영화 조회, 리뷰, 북마크, 추천 로직 단위 테스트 |
| 8.2.2 Release Testing | 배포 전 빌드, API 정상 동작, 주요 화면 확인 |
| 8.2.3 User Testing | 실제 사용자 시나리오 기반 테스트 |
| 8.2.4 Testing Case | 대표 테스트 케이스: 영화 검색, 리뷰 작성, 북마크, 추천 요청, 채팅 |

## 9. Development Plan

| 목차 | 핵심 내용 |
|---|---|
| 9.1 Objectives | 개발 환경과 기술 선택 설명 |
| 9.2 Frontend Environment | Next.js, React, TypeScript, Tailwind CSS |
| 9.3 Backend Environment | Next.js API Route, Server Component, Service/Repository 구조 |
| 9.4 Database Environment | Supabase PostgreSQL, Drizzle ORM |
| 9.5 AI and Recommendation Environment | Item-CF 추천, 추천 챗봇, 캐릭터 챗봇 |
| 9.6 Constraints | 시간, 비용, API 사용량, 보안, 성능, 유지보수 제약 |
| 9.7 Assumptions and Dependencies | Supabase, 외부 영화 데이터, 브라우저 환경, 네트워크 연결 의존성 |

## 10. Supporting Information

| 목차 | 핵심 내용 |
|---|---|
| 10.1 Related Documents | 요구사항 명세서, API 명세서, DB schema 문서 참조 |
| 10.2 Document History | 작성일, 버전, 작성자, 변경 내용 |

## 작성 기준

- 예시 PDF의 형식을 따르되, Cinemate의 핵심 기능인 영화 탐색, 리뷰, 북마크, 추천, AI 채팅, 마이페이지가 빠지지 않도록 작성한다.
- 학교 과제 제출용 문서이므로 API 필드와 DB 컬럼을 실제 구현 수준으로 모두 상세화하기보다, 대표 API와 대표 테이블 중심으로 작성한다.
- 각 장은 다이어그램 1개와 간단한 설명을 중심으로 구성하고, 필요한 경우 표를 사용해 핵심 정보를 요약한다.
