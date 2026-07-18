# Product Requirements Document: IT 프로젝트 공모전 운영 Admin

**작성자**: kangjae
**날짜**: 2026-07-17
**상태**: Draft
**이해관계자**: 공모전 운영진 4명

## 1. Executive Summary

IT 프로젝트 공모전 운영진이 노션과 구글에 흩어진 팀·팀원·학과 데이터를 한 곳에서 조회하고 직접 관리하는 내부 백오피스다. 로그인한 운영진 4명만 접근하며, 이 앱이 데이터의 원본(source of truth)이 된다.

## 2. Background & Context

공모전은 1년간 진행되고 이미 1학기가 지났다. 참가 신청과 팀 편성은 끝났고, 30~31개 팀에 약 87~90명이 참가한다. 지금 팀·팀원 정보는 구글 폼/시트와 노션에 나뉘어 있다. 그래서 "누가 어느 팀이고 어느 학과인지"를 확인하려면 여러 도구를 오가야 한다. 단일한 조회 지점이 없다는 것이 핵심 통증이다.

운영진은 이 데이터를 이 앱으로 한 번 옮긴 뒤, 앞으로 수정은 앱에서만 한다. 옮긴 후 노션/구글은 이 데이터에 한해 보관용으로 얼린다. 두 곳을 동시에 고치면 데이터가 어긋나기 때문이다.

## 3. Objectives & Success Metrics

**목표(Goals)**
1. 운영진이 노션/구글을 열지 않고 앱 한 곳에서 전체 팀·팀원·학과를 조회·검색·필터한다.
2. 팀·팀원·학과·리그를 앱에서 직접 추가·수정·삭제한다(외부 도구 수정 불필요).
3. 로그인한 운영진 4명만 접근한다(제3자 차단).

**비목표(Non-Goals)**
1. 참가 신청·팀 편성 기능. 이미 완료되어 범위 밖이다.
2. 참가자·심사위원 접근. v1은 운영진 전용이다.
3. 심사·점수·수상 등 운영 기능. 회의 후 v2에서 결정한다.
4. 권한 등급(역할별 권한). 4명 모두 동등 관리자라 필요 없다.
5. 리그·학과 관리 화면. 두 값은 고정(비기너 리그·프로 리그, 글로벌미디어학부·디지털미디어학과)이라 seed로만 넣고 앱에서 편집하지 않는다.
6. 공개 회원가입. 계정은 로그인한 운영진이 앱에서 만든다.

**Success Metrics**

| 지표 | 현재 | 목표 | 측정 |
|------|------|------|------|
| 팀/팀원 조회 시 여는 도구 수 | 2곳(노션+구글) | 1곳(앱) | 운영진 확인 |
| 데이터 원본 위치 | 분산 | 앱 단일 | import 완료 여부 |
| 비인가 접근 | 가능 | 차단 | 로그인 없이 조회 불가 |
| 전체 로스터 파악 | 여러 도구 탐색 | 한 화면 | 운영진 체감 |

## 4. Target Users & Segments

운영진 4명. 모두 동등한 관리자이며 역할 구분이 없다. 사용자 수가 고정 4명이라 확장성·성능·페이지네이션은 설계 고려 대상이 아니다.

## 5. User Stories & Requirements

**P0 (필수)**

| # | User Story | 완료 조건 |
|---|-----------|-----------|
| 1 | 운영진으로서 로그인해서 제3자를 차단하고 싶다 | 아이디/비밀번호 로그인, 세션 쿠키, 미인증 시 조회 불가 및 `/login` 리다이렉트 |
| 2 | 전체 팀을 목록으로 보고 검색·필터하고 싶다 | 팀명·인원수·구성 학과·소속 리그 표시, 팀명 검색, 리그 필터 |
| 3 | 팀을 눌러 팀원 상세를 보고 싶다 | 팀 정보와 소속 팀원 목록(이름·학번·학과·중도하차 여부) |
| 4 | 전체 팀원을 한 목록에서 보고 싶다 | 이름·학번·학과·소속팀·중도하차 표시, 이름/학번 검색, 학과·팀 필터 |
| 5 | 팀·팀원을 추가·수정·삭제하고 싶다 | 팀·팀원 CRUD, 폼 검증, 소프트삭제. 리그·학과는 고정값이라 select로만 고름 |
| 6 | 팀원의 중도하차를 표시하고 싶다 | 중도하차 여부 토글, 목록에서 구분 표시 |
| 7 | 운영진 계정을 만들고 관리하고 싶다 | 로그인한 운영진이 계정 생성(아이디·이름·비밀번호), 목록, 삭제(자기 자신 제외). 공개 가입 없음 |
| 8 | 기존 데이터를 앱으로 옮기고 싶다 | export를 import(seed)하는 스크립트, 재실행해도 결과가 같음(upsert) |

**P1 (권장)**

| # | User Story | 완료 조건 |
|---|-----------|-----------|
| 9 | 전체 현황을 요약으로 보고 싶다 | 대시보드: 총 팀 수·총 인원, 학과별 인원 분포 |
| 10 | 사용 중인 팀 삭제 시 실수를 막고 싶다 | 활성 팀원 있으면 차단, "먼저 팀원 재배치" 안내 |
| 11 | 누가 언제 무엇을 바꿨는지 남기고 싶다 | 감사 로그(변경 이력) |

**P2 (선택/향후)**

| # | User Story | 완료 조건 |
|---|-----------|-----------|
| 12 | 심사·점수·상태를 관리하고 싶다 | v2, 회의 후 결정 |
| 13 | 비밀번호를 직접 바꾸고 싶다 | 셀프 비밀번호 변경 |

## 6. Solution Overview

**스택**: TanStack Start(SSR 풀스택 React), Prisma 7, SQLite(libSQL/Turso), Tailwind v4, shadcn/ui, TanStack Query. 패키지 매니저는 Bun, 배포는 Netlify.

**데이터 모델** (구현·커밋 완료)

```
League(리그)      id(uuid), name(unique)
Department(학과)  id(uuid), name(unique)
Team(팀)          id(uuid), teamNumber?, name, leagueId → League, createdAt, updatedAt, deletedAt
Member(팀원)      id(uuid), name, studentId, departmentId → Department, teamId → Team,
                  isLeader, contact?, droppedOut, createdAt, updatedAt, deletedAt
User(운영진 계정) id(uuid), username(unique), passwordHash, name, createdAt
AuditLog          id(uuid), userId → User, action, entity, entityId, changes?, createdAt
```

모든 테이블의 기본키(`id`)는 UUID(v7, 시간순 정렬 가능)를 쓴다. 외래키(`leagueId`, `teamId`, `departmentId`, `userId`)도 같은 문자열 UUID다. League와 Department는 참조 테이블이다. 학과는 팀원 단위로 붙어서 여러 학과가 섞인 융합팀도 표현된다. 팀원은 팀장 여부(`isLeader`)와 연락처(`contact`, 선택)를 가진다. User는 로그인용 운영진 계정이고, AuditLog는 누가 무엇을 바꿨는지 남기는 변경 이력이다. 삭제는 soft delete(`deletedAt`)와 `onDelete: Restrict`(사용 중이면 차단)로 처리한다. 중도하차(`droppedOut`)는 삭제와 별개로, 참가 기록을 남긴 채 하차만 표시한다.

스키마는 엔티티별 파일로 나눠 `prisma/schema/` 폴더에 둔다(Prisma 멀티파일 스키마). `config.prisma`에 generator와 datasource, 나머지는 모델별로 `league.prisma`, `department.prisma`, `team.prisma`, `member.prisma`, `user.prisma`, `audit.prisma`.

**고정 참조 데이터**: 리그(비기너 리그·프로 리그)와 학과(글로벌미디어학부·디지털미디어학과)는 고정값이라 seed로만 넣고 앱에서 관리하지 않는다(전용 관리 화면 없음). 팀·팀원 폼에서는 select로 고른다.

**계정 관리**: 공개 회원가입은 없다. 로그인한 운영진이 '운영진' 화면에서 새 계정(아이디·이름·비밀번호)을 만들고, 자기 자신을 제외한 계정을 삭제할 수 있다. 초기 부트스트랩 계정 1개는 seed로 넣는다(username `admin`).

**아키텍처 결정** (엔지니어링 리뷰에서 확정)

- DB 접근은 TanStack Start 서버 함수 안에서만 Prisma를 호출한다. 클라이언트는 DB에 직접 접근하지 않는다.
- 소프트삭제는 Prisma `$extends`로 전역 강제한다. 조회 쿼리에는 `deletedAt: null`을 자동으로 적용하고, 삭제는 `deletedAt` 세팅으로 치환한다. 개별 쿼리에서 필터를 빠뜨릴 수 없다.
- 인증은 TanStack Start 내장 `useSession`(서명 쿠키)을 쓴다. 비밀번호 해시는 WASM/napi 해시(`hash-wasm` 또는 `@node-rs/argon2`)를 쓴다. 네이티브 `argon2`는 Netlify 서버리스에서 동작하지 않아 제외한다. 보호가 필요한 라우트는 `_authed` layout route의 `beforeLoad`에서 세션을 한 번 검증한다.
- 검증 스키마(zod)는 클라이언트 폼과 서버 함수가 함께 쓴다(중복 제거). 서버 함수는 엔티티별 파일로 나누고, `createMiddleware`로 사용자 컨텍스트를 주입한다.
- CRUD는 엔티티별로 명시적으로 구현한다. 엔티티마다 필드가 달라서 제네릭 팩토리로 묶으면 조기 추상화가 된다.
- 목록 조회는 `include`/`select`와 `_count`로 N+1을 피한다. 페이지네이션과 캐싱은 규모상 두지 않는다.

**배포 DB**: 지금 libSQL 어댑터를 채택했다. 로컬은 `file:./dev.db`, 배포는 Turso 원격 URL과 토큰으로 같은 어댑터를 쓴다. 배포할 때 어댑터를 교체할 필요가 없다.

**UI**: `docs/engineering/design.md`의 Linear 스타일 다크 테마로 shadcn을 테마링한다(near-black 캔버스 #010102, 라벤더 액센트 #5e6ad2, 다크 단일 테마).

**테스트**: 운영진(사용자)이 직접 수행한다. AI는 테스트 코드를 작성하지 않는다.

## 7. Open Questions

| 질문 | 담당 | 기한 |
|------|------|------|
| export 실제 컬럼(팀/팀원 필드명·형식)은? | kangjae | 데이터 제공 시 |
| 학번이 사람 식별자로 유일한가(중복·유학생 예외)? import upsert 키에 영향 | kangjae | 데이터 제공 시 |
| 리그 종류와 개수는? | 운영진 | 회의 |
| 배포 시점 Turso 계정·토큰 준비 | kangjae | 배포 직전 |
| SESSION_SECRET 값 결정·보관 | kangjae | 인증 구현 전 |

## 8. Timeline & Phasing

**Phase 0 (완료)**: 데이터 모델(League/Department/Team/Member/User/AuditLog, UUID PK, 멀티파일 스키마), libSQL 어댑터 채택.

**Phase 1 (v1, 다음 단계)**
1. 인증 골격(`useSession`, WASM 해시, `_authed` 게이트, 운영진 4계정 seed).
2. Prisma `$extends` 소프트삭제 확장.
3. 서버 함수 CRUD(리그/학과/팀/팀원)와 zod 검증 공유.
4. 화면: 로그인, 대시보드, 팀 목록, 팀 상세, 팀원 목록, 학과/리그 관리.
5. 실데이터 import(seed).

**Phase 2 (v2, 회의 후)**: 감사 로그, 심사·점수·상태 관리, 필요 시 참가자/심사위원 접근.

**선행 조건(Dependencies)**
- 실데이터 export(스키마 필드 확정과 seed의 선행 조건).
- 운영진 4명의 "노션/구글 얼리기" 합의(이관 후 이중 원본 방지).
- shadcn/ui, Zustand(조건부), 해시 라이브러리 설치.
- 배포 전 Turso 계정·토큰, SESSION_SECRET 준비.
