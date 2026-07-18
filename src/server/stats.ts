import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { authMiddleware } from './middleware';

export const getStats = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const [teamCount, memberCount, leaderCount, droppedCount, departments, leagues] = await Promise.all([
      prisma.team.count(),
      prisma.member.count(),
      prisma.member.count({ where: { isLeader: true } }),
      prisma.member.count({ where: { droppedOut: true } }),
      prisma.department.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { members: { where: { deletedAt: null } } } } },
      }),
      prisma.league.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { teams: { where: { deletedAt: null } } } } },
      }),
    ]);

    return {
      teamCount,
      memberCount,
      leaderCount,
      droppedCount,
      byDepartment: departments.map((d) => ({ name: d.name, count: d._count.members })),
      byLeague: leagues.map((l) => ({ name: l.name, count: l._count.teams })),
    };
  });
