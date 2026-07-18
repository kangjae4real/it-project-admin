import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { authMiddleware } from './middleware';
import { writeAudit } from './audit';
import { leagueCreateSchema, leagueUpdateSchema } from '../lib/schemas/league';

export const listLeagues = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () =>
    prisma.league.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { teams: { where: { deletedAt: null } } } } },
    }),
  );

export const createLeague = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => leagueCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const league = await prisma.league.create({ data });
    await writeAudit(context.user.id, 'CREATE', 'League', league.id, data);
    return league;
  });

export const updateLeague = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => leagueUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const league = await prisma.league.update({ where: { id }, data: rest });
    await writeAudit(context.user.id, 'UPDATE', 'League', id, rest);
    return league;
  });

export const deleteLeague = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => {
    if (!d?.id) throw new Error('id가 필요합니다.');
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    try {
      await prisma.league.delete({ where: { id: data.id } });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2003') {
        throw new Error('사용 중인 리그는 삭제할 수 없습니다. 먼저 팀의 리그를 변경하세요.');
      }
      throw err;
    }
    await writeAudit(context.user.id, 'DELETE', 'League', data.id);
    return { ok: true };
  });
