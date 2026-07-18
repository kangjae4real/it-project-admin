import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { authMiddleware } from './middleware';

// 학과는 고정 참조 데이터(seed). 조회만 제공.
export const listDepartments = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () =>
    prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: { where: { deletedAt: null } } } } },
    }),
  );
