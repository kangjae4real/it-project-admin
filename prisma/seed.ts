import { PrismaClient } from '../src/generated/prisma/client.js';

import { PrismaLibSql } from '@prisma/adapter-libsql';

import { hashPassword } from '../src/lib/auth/password.js';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

// 운영진 4계정. 초기 비밀번호는 SEED_ADMIN_PASSWORD (없으면 dev 기본값).
const ADMINS = [
  { username: 'admin1', name: '운영진 1' },
  { username: 'admin2', name: '운영진 2' },
  { username: 'admin3', name: '운영진 3' },
  { username: 'admin4', name: '운영진 4' },
];

async function main() {
  console.log('🌱 Seeding database...');

  const initialPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme-1234';
  for (const admin of ADMINS) {
    const passwordHash = await hashPassword(initialPassword);
    await prisma.user.upsert({
      where: { username: admin.username },
      update: { name: admin.name },
      create: { username: admin.username, name: admin.name, passwordHash },
    });
  }
  console.log(`✅ 운영진 ${ADMINS.length}계정 seed 완료 (${ADMINS.map((a) => a.username).join(', ')}).`);
  console.log('⚠️  초기 비밀번호는 SEED_ADMIN_PASSWORD 값입니다. 배포 전 반드시 변경하세요.');

  // TODO: 실데이터(리그/학과/팀/팀원)가 확정되면 여기서 import.
  // 순서: League + Department → Team(leagueId) → Member(teamId, departmentId).
  // 참조 테이블은 upsert로 재실행 가능하게.
  // 예시:
  // await prisma.department.upsert({ where: { name: '컴퓨터공학과' }, update: {}, create: { name: '컴퓨터공학과' } });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
