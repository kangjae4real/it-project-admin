# DB 마이그레이션 전략

이 문서는 스키마를 어떻게 바꾸고, 로컬과 Turso(운영)에 어떻게 안전하게 반영하는지 정한다.

## 현황과 문제

- 지금까지는 `prisma db push`로만 스키마를 맞춰 왔다. 마이그레이션 이력이 없다.
- 배포 전 개발 단계에서는 `db push`로 충분했다.
- 운영 DB(Turso)에 실데이터가 올라가면 얘기가 달라진다. `db push`는 스키마가 어긋날 때 컬럼을 드롭하며 데이터를 잃을 수 있고, 무엇을 언제 바꿨는지 이력이 남지 않는다.

## 결정

1. **버전 관리되는 마이그레이션 파일을 쓴다.** 로컬에서 `prisma migrate dev`로 마이그레이션 SQL을 만들고 git에 커밋한다. 이력·리뷰가 가능하고 전진형이며 데이터가 안전하다.
2. **운영 반영은 수동 릴리스 단계**에서 사람이 확인하고 실행한다. 자동 CI나 Netlify 빌드에서 운영 DB를 건드리지 않는다.

## Turso 제약 (전략의 핵심 이유)

Prisma CLI(마이그레이션/스키마 엔진)는 **`file:` URL만 받는다.** `libsql://`(Turso)을 주면 `P1013`으로 거부한다. 즉 `migrate dev` / `migrate deploy` / `migrate diff --from-config-datasource`가 Turso 원격에는 안 된다. (런타임 libSQL 어댑터는 Turso에 잘 붙지만, 이건 앱 쿼리용이지 마이그레이션 엔진이 아니다.) 그래서 환경을 나눈다.

- **로컬 개발**: SQLite 파일(`file:./dev.db`)에 `prisma migrate dev`. shadow DB도 로컬 파일에서 자동으로 처리된다. 여기서 마이그레이션 파일이 만들어지고, 이 파일이 이력·리뷰의 원본이다.
- **운영(Turso)**: 마이그레이션 파일의 SQL을 `prisma/migrate-turso.ts` 러너가 `@libsql/client`로 Turso에 직접 적용한다. Turso의 `_migrations` 테이블에 적용한 마이그레이션 이름을 기록해, 다음엔 미적용분만 순서대로 적용한다(전진형·멱등, `migrate deploy` 대체).

## 환경 매핑

| 환경 | DB | 도구 | 이력 |
|------|----|------|------|
| 로컬 개발 | `file:./dev.db` (libSQL 어댑터) | `prisma migrate dev` | 로컬 `_prisma_migrations` + `prisma/migrations/` |
| 운영 | Turso `libsql://…` (+ 토큰) | `migrate-turso.ts` 러너 (@libsql/client) | git의 마이그레이션 파일 + Turso `_migrations` 테이블 |

## 초기 baseline (db push → migrate 전환, 1회)

지금 스키마는 `db push`로 만들어졌으므로, migrate로 넘어가려면 현재 스키마를 첫 마이그레이션으로 한 번 찍어야 한다.

```bash
mkdir -p prisma/migrations/0_init
# 현재 멀티파일 스키마 전체를 초기 마이그레이션 SQL로 생성
npx prisma migrate diff \
  --from-empty \
  --to-schema ./prisma/schema \
  --script > prisma/migrations/0_init/migration.sql

# 이미 스키마가 반영된 로컬 dev.db 에는 "적용됨"으로만 표시(재실행 방지)
npx dotenv -e .env.local -- prisma migrate resolve --applied 0_init
```

- 로컬: 위처럼 `resolve --applied`로 표시하면 이후 `migrate dev`가 0_init을 다시 돌리지 않는다.
- 운영(Turso): 신규 DB이므로 첫 릴리스 때 `0_init`(= 전체 스키마)을 그대로 적용하면 된다(아래 운영 반영 절차).

## 일상 개발 플로우 (스키마 변경 시)

1. `prisma/schema/` 의 모델 파일을 수정한다.
2. 로컬에 마이그레이션 생성·적용:
   ```bash
   npm run db:migrate -- --name add_member_phone   # prisma migrate dev --name ...
   ```
   → `prisma/migrations/<타임스탬프>_add_member_phone/migration.sql` 이 생기고 로컬 dev.db에 적용된다.
3. 생성된 `migration.sql`을 **직접 읽고 리뷰**한다. 특히 `DROP`, `NOT NULL` 추가, 타입 변경을 확인한다.
4. 스키마 파일 + 마이그레이션 파일을 함께 커밋한다.
5. 클라이언트 재생성은 `postinstall`/`db:generate`가 처리한다.

`db push`는 이제 로컬에서 빠르게 실험할 때만 쓰고, 커밋 대상 변경은 반드시 마이그레이션으로 남긴다.

## 운영(Turso) 반영 절차 (수동 릴리스)

운영 자격증명은 커밋하지 않는다. `.env.production.local`(gitignore) 또는 셸 환경변수로 둔다.

```
DATABASE_URL="libsql://<db>.turso.io"
DATABASE_AUTH_TOKEN="<token>"
```

1. **미적용 마이그레이션 확인:**
   ```bash
   npm run db:migrate:plan   # 아직 Turso 에 안 들어간 마이그레이션 파일과 SQL 출력(적용 안 함)
   ```
2. **사람이 SQL을 리뷰한다.** 파괴적 구문(`DROP COLUMN`, `DROP TABLE`, `NOT NULL` 강제)이 있으면 데이터 영향과 백필 필요 여부를 판단한다.
3. **위험한 변경 전에는 Turso 백업/브랜치로 먼저 시험한다** (아래 안전 규칙).
4. **적용:**
   ```bash
   npm run db:migrate:prod   # 미적용 마이그레이션 파일을 순서대로 Turso 에 적용 + _migrations 기록
   ```
5. 릴리스 노트/커밋에 "무엇을 언제 적용했는지" 남긴다.

## 추가할 npm 스크립트

```jsonc
{
  // 로컬: 마이그레이션 생성·적용
  "db:migrate": "dotenv -e .env.local -- prisma migrate dev",

  // 운영(Turso): 미적용 마이그레이션 확인(적용 안 함)
  "db:migrate:plan": "dotenv -e .env.production.local -- tsx prisma/migrate-turso.ts --dry",
  // 운영(Turso): 미적용 마이그레이션을 순서대로 적용
  "db:migrate:prod": "dotenv -e .env.production.local -- tsx prisma/migrate-turso.ts",

  // 운영 데이터: 고정 리그/학과 + 부트스트랩 admin / 참가자 데이터
  "db:seed:prod": "dotenv -e .env.production.local -- prisma db seed",
  "db:import:prod": "dotenv -e .env.production.local -- tsx prisma/import.ts"
}
```

**왜 diff+execute 가 아니라 러너인가.** Prisma CLI(스키마 엔진)는 `file:` URL만 받아 Turso(`libsql://`)에 직접 마이그레이션을 못 한다(`P1013`). 그래서 `prisma/migrate-turso.ts`가 `prisma/migrations/*/migration.sql`을 `@libsql/client`로 Turso에 직접 적용하고, Turso의 `_migrations` 테이블로 적용 이력을 추적한다(전진형·멱등, libsql용 `migrate deploy` 대체). 로컬 마이그레이션 파일이 원본이다.

## 참조·시드 데이터

마이그레이션에는 **스키마만** 담는다. 데이터는 나눈다.

- **고정 참조 데이터**(리그 비기너/프로, 학과 글로벌미디어학부/디지털미디어학과)와 **부트스트랩 계정**은 `prisma/seed.ts`가 멱등(upsert)으로 넣는다. 환경마다 1회 실행.
- **참가 데이터**(팀/팀원)는 `npm run db:import -- "<xlsx>"`로 넣는다. 팀/팀원 초기화 후 재삽입이라 멱등.

## 안전 규칙

- **전진형만.** 자동 롤백은 없다. 되돌리려면 되돌리는 마이그레이션을 새로 만들거나 백업을 복원한다.
- **파괴적 변경은 3단계로 무중단 처리한다.** 예: 컬럼 제거 = ① 코드에서 사용 중단 → ② 배포 → ③ 다음 릴리스에서 컬럼 드롭. 컬럼 추가(NOT NULL) = ① nullable 로 추가 → ② 백필 → ③ NOT NULL 강제.
- **위험한 마이그레이션 전 Turso 백업.** Turso는 시점 복원과 DB 브랜치를 지원한다. 브랜치에 먼저 적용해 검증한 뒤 본 DB에 적용한다.
- **생성된 SQL은 항상 사람이 읽는다.** 특히 `db:migrate:plan` 출력.

## 변경 체크리스트

**스키마를 바꿀 때 (로컬)**
- [ ] `prisma/schema/` 수정
- [ ] `npm run db:migrate -- --name <설명>`
- [ ] 생성된 `migration.sql` 리뷰 (DROP/NOT NULL/타입변경 확인)
- [ ] 스키마 + 마이그레이션 파일 커밋

**운영에 반영할 때 (Turso)**
- [ ] `.env.production.local`에 Turso URL·토큰 준비
- [ ] `npm run db:migrate:plan`으로 SQL 확인
- [ ] 파괴적 구문 있으면 백업/브랜치로 검증
- [ ] `npm run db:migrate:prod` 실행
- [ ] 적용 내역 기록

## 미결정 / 나중에

- 팀·트래픽이 커지면 운영 반영을 CI(GitHub Actions)로 옮긴다(수동 → 자동).
- Prisma의 Turso 네이티브 마이그레이션 지원이 정식(EA 졸업)되면 diff+execute 방식을 재검토한다.
