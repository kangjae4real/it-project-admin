// Turso(libSQL) 마이그레이션 러너 = libsql 용 `migrate deploy` 대체.
// Prisma CLI 스키마 엔진은 file: 만 지원하므로(P1013), prisma/migrations/*/migration.sql 을
// @libsql/client 로 직접 Turso 에 적용하고 _migrations 테이블로 추적한다. 전진형·멱등.
// 사용: npm run db:migrate:plan (미적용 목록·SQL 출력) / npm run db:migrate:prod (적용)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { createClient } from '@libsql/client';

const MIGRATIONS_DIR = 'prisma/migrations';
const dry = process.argv.includes('--dry');

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;
if (!url) {
  console.error('DATABASE_URL 이 필요합니다 (.env.production.local).');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let applied = new Set<string>();
  if (!dry) {
    await client.execute('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  }
  try {
    const rs = await client.execute('SELECT name FROM _migrations');
    applied = new Set(rs.rows.map((r) => String(r.name)));
  } catch {
    // _migrations 아직 없음(첫 실행) → 전부 미적용으로 간주
  }

  const pending = dirs.filter((d) => !applied.has(d));
  if (pending.length === 0) {
    console.log('✅ 적용할 마이그레이션 없음 (up to date).');
    return;
  }

  for (const name of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf8');
    if (dry) {
      console.log(`\n===== PENDING: ${name} =====\n${sql}`);
      continue;
    }
    console.log(`applying ${name} …`);
    await client.executeMultiple(sql);
    await client.execute({
      sql: 'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)',
      args: [name, new Date().toISOString()],
    });
    console.log(`✓ ${name}`);
  }
  if (dry) console.log(`\n(미적용 ${pending.length}건. 실제 적용은 db:migrate:prod)`);
  else console.log(`✅ ${pending.length}건 적용 완료.`);
}

main()
  .catch((e) => {
    console.error('❌ 마이그레이션 실패:', e);
    process.exit(1);
  })
  .finally(() => client.close());
