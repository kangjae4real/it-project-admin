import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { authMiddleware } from './middleware';
import { writeAudit } from './audit';
import { departmentCreateSchema, departmentUpdateSchema } from '../lib/schemas/department';

export const listDepartments = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () =>
    prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: { where: { deletedAt: null } } } } },
    }),
  );

export const createDepartment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => departmentCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const department = await prisma.department.create({ data });
    await writeAudit(context.user.id, 'CREATE', 'Department', department.id, data);
    return department;
  });

export const updateDepartment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => departmentUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const department = await prisma.department.update({ where: { id }, data: rest });
    await writeAudit(context.user.id, 'UPDATE', 'Department', id, rest);
    return department;
  });

export const deleteDepartment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => {
    if (!d?.id) throw new Error('id가 필요합니다.');
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    try {
      await prisma.department.delete({ where: { id: data.id } });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2003') {
        throw new Error('소속 팀원이 있는 학과는 삭제할 수 없습니다.');
      }
      throw err;
    }
    await writeAudit(context.user.id, 'DELETE', 'Department', data.id);
    return { ok: true };
  });
