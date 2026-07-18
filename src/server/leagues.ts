import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { authMiddleware } from './middleware';

// 리그는 고정 참조 데이터(seed). 조회만 제공.
export const listLeagues = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () =>
    prisma.league.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { teams: { where: { deletedAt: null } } } } },
    }),
  );
