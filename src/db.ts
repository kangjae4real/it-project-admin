import { PrismaClient } from './generated/prisma/client.js';

import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// deletedAt 필드를 가진 소프트삭제 대상 모델.
const SOFT_DELETE_MODELS = new Set(['Team', 'Member']);
const isSoft = (model?: string) => !!model && SOFT_DELETE_MODELS.has(model);
const lower = (model: string) => model.charAt(0).toLowerCase() + model.slice(1);

// ponytail: 소프트삭제를 client extension으로 전역 강제.
//  - 조회(findMany/findFirst/count/…): where 에 deletedAt:null 자동 주입 → 삭제분 제외
//  - findUnique(OrThrow): unique where 에 필터를 못 넣으므로 결과를 사후 필터
//  - delete/deleteMany: 실제 삭제 대신 deletedAt=now 로 치환(base 클라이언트로 update)
//  - update/updateMany: 이미 삭제된 레코드는 수정 대상에서 제외
//  주의: include 로 딸려오는 관계는 여기서 안 걸린다 → 호출부에서 where:{deletedAt:null} 로 필터.
function createPrisma() {
  const base = new PrismaClient({ adapter });
  const injectWhere = ({ model, args, query }: any) => {
    if (isSoft(model)) args.where = { ...args.where, deletedAt: null };
    return query(args);
  };
  const postFilter = async ({ model, args, query }: any, orThrow: boolean) => {
    const res = await query(args);
    if (isSoft(model) && res && res.deletedAt) {
      if (orThrow) throw new Error(`${model} 레코드를 찾을 수 없습니다.`);
      return null;
    }
    return res;
  };
  return base.$extends({
    query: {
      $allModels: {
        findMany: injectWhere,
        findFirst: injectWhere,
        findFirstOrThrow: injectWhere,
        count: injectWhere,
        aggregate: injectWhere,
        groupBy: injectWhere,
        update: injectWhere,
        updateMany: injectWhere,
        findUnique: (p: any) => postFilter(p, false),
        findUniqueOrThrow: (p: any) => postFilter(p, true),
        delete: ({ model, args, query }: any) => {
          if (!isSoft(model)) return query(args);
          return (base as any)[lower(model)].update({ where: args.where, data: { deletedAt: new Date() } });
        },
        deleteMany: ({ model, args, query }: any) => {
          if (!isSoft(model)) return query(args);
          return (base as any)[lower(model)].updateMany({
            where: { ...args.where, deletedAt: null },
            data: { deletedAt: new Date() },
          });
        },
      },
    },
  });
}

declare global {
  var __prisma: ReturnType<typeof createPrisma> | undefined;
}

export const prisma = globalThis.__prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
