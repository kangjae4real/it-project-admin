import { PrismaClient } from '../src/generated/prisma/client.js';

import { PrismaLibSql } from '@prisma/adapter-libsql';

import { hashPassword } from '../src/lib/auth/password.js';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const prisma = new PrismaClient({ adapter });

// 고정 참조 데이터 (변경 없음).
const LEAGUES = ['비기너 리그', '프로 리그'];
const DEPARTMENTS = ['글로벌미디어학부', '디지털미디어학과'];

async function main() {
  console.log('🌱 Seeding database...');

  // 고정 리그/학과 (upsert로 멱등).
  for (const name of LEAGUES) {
    await prisma.league.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of DEPARTMENTS) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`✅ 리그 ${LEAGUES.length}개, 학과 ${DEPARTMENTS.length}개 seed 완료.`);

  // 부트스트랩 운영진 계정 1개. 나머지는 앱의 '운영진 관리'에서 생성.
  const initialPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme-1234';
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', name: '운영진', passwordHash: await hashPassword(initialPassword) },
  });
  console.log('✅ 부트스트랩 계정: admin (초기 비번 = SEED_ADMIN_PASSWORD). 로그인 후 변경/추가하세요.');

  // TODO: 실데이터(팀/팀원)가 확정되면 여기서 import.
  // 순서: Team(leagueId) → Member(teamId, departmentId). 재실행 가능하게 작성.
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
