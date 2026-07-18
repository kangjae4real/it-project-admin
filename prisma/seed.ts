import { PrismaClient } from '../src/generated/prisma/client.js';

import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // TODO: 실데이터(리그/학과/팀/팀원)가 확정되면 여기서 import.
  // 순서: League + Department → Team(leagueId) → Member(teamId, departmentId).
  // 참조 테이블은 upsert로 재실행 가능하게.
  // 예시:
  // await prisma.department.upsert({ where: { name: '컴퓨터공학과' }, update: {}, create: { name: '컴퓨터공학과' } });

  console.log('✅ Seed complete (no data yet).');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
