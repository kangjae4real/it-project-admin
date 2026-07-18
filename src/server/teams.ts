import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { authMiddleware } from './middleware';
import { writeAudit } from './audit';
import { teamCreateSchema, teamUpdateSchema } from '../lib/schemas/team';

export const listTeams = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () =>
    prisma.team.findMany({
      orderBy: [{ teamNumber: 'asc' }, { name: 'asc' }],
      include: {
        league: true,
        _count: { select: { members: { where: { deletedAt: null } } } },
      },
    }),
  );

export const getTeam = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => {
    if (!d?.id) throw new Error('id가 필요합니다.');
    return { id: d.id };
  })
  .handler(async ({ data }) => {
    const team = await prisma.team.findFirst({
      where: { id: data.id },
      include: {
        league: true,
        members: { where: { deletedAt: null }, orderBy: { name: 'asc' }, include: { department: true } },
      },
    });
    if (!team) throw new Error('팀을 찾을 수 없습니다.');
    return team;
  });

export const createTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => teamCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const team = await prisma.team.create({
      data: { name: data.name, teamNumber: data.teamNumber ?? null, leagueId: data.leagueId },
    });
    await writeAudit(context.user.id, 'CREATE', 'Team', team.id, data);
    return team;
  });

export const updateTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => teamUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const team = await prisma.team.update({
      where: { id },
      data: { name: rest.name, teamNumber: rest.teamNumber ?? null, leagueId: rest.leagueId },
    });
    await writeAudit(context.user.id, 'UPDATE', 'Team', id, rest);
    return team;
  });

export const deleteTeam = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => {
    if (!d?.id) throw new Error('id가 필요합니다.');
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    const activeMembers = await prisma.member.count({ where: { teamId: data.id } });
    if (activeMembers > 0) {
      throw new Error('소속된 팀원이 있어 삭제할 수 없습니다. 먼저 팀원을 옮기거나 제거하세요.');
    }
    await prisma.team.delete({ where: { id: data.id } }); // 확장에 의해 soft delete
    await writeAudit(context.user.id, 'DELETE', 'Team', data.id);
    return { ok: true };
  });
