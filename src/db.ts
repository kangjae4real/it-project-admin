import { PrismaClient } from './generated/prisma/client.js';

import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  // 로컬은 미설정(file:), Turso 배포 시 DATABASE_AUTH_TOKEN 설정
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
