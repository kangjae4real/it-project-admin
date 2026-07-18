# IT 프로젝트 공모전 운영 Admin

공모전 운영진 4명 전용 백오피스. 노션/구글에 흩어진 팀·팀원·학과 데이터를 한 곳에서 조회·관리한다. 이 앱이 데이터의 원본(source of truth)이다.

## Docs (매 세션 먼저 읽기)

작업 시작 전에 아래 문서를 읽는다.

- `docs/product/prd.md` — 제품 요구사항(PRD). 범위, 유저 스토리, 데이터 모델, 로드맵.
- `docs/engineering/design.md` — UI 디자인 시스템(Linear 스타일 다크 테마). UI 작업 전 필독.

## 문서 규칙

- 프로젝트에 포함될 문서는 `docs/<주제>/` 하위에 만든다(예: `docs/product/`, `docs/engineering/`).
- `docs/`에 문서를 쓰기 전에 `/humanizer`로 사람이 읽기 좋게 변환한다. 변환 시 내용이 빠지거나 의미가 바뀌면 안 된다.

## 기술 스택

- TanStack Start (SSR 풀스택 React 19, React Compiler) + TanStack Query
- Prisma 7 + SQLite, libSQL 어댑터 (로컬 `file:./dev.db`, 배포 Turso 원격)
- Tailwind v4 + shadcn/ui (위 디자인 시스템으로 테마링)
- 클라이언트 상태는 필요할 때만 Zustand
- 패키지 매니저 Bun, 배포 Netlify

## 규칙 / 컨벤션

- DB 접근은 TanStack Start 서버 함수 안에서만 한다. 클라이언트는 DB에 직접 접근하지 않는다.
- 소프트삭제는 Prisma `$extends`로 전역 강제한다(`deletedAt`). 하드 삭제는 지양.
- 삭제 제약은 `onDelete: Restrict`. 사용 중인 리그/학과/팀은 삭제를 차단한다.
- 인증은 `useSession`(서명 쿠키)과 WASM/napi 해시(`hash-wasm` 또는 `@node-rs/argon2`)를 쓴다.
- 배포 타깃이 Netlify 서버리스라 네이티브 바이너리(`better-sqlite3`, 네이티브 `argon2`)는 쓰지 않는다.
- 검증 스키마(zod)는 클라이언트 폼과 서버 함수가 함께 쓴다.
- 테스트는 사용자가 직접 작성한다. AI는 테스트 코드를 만들지 않는다.

## 명령어

- 개발 서버: `npm run dev` (포트 3000)
- DB: `npm run db:push` · `db:generate` · `db:studio` · `db:seed`
- 빌드: `npm run build` · 린트: `npm run lint` · 포맷: `npm run format`
