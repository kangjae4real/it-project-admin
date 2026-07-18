import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { authMiddleware } from './middleware';
import { writeAudit } from './audit';
import { memberCreateSchema, memberUpdateSchema } from '../lib/schemas/member';

export const listMembers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () =>
    prisma.member.findMany({
      orderBy: { name: 'asc' },
      include: { department: true, team: { select: { id: true, name: true } } },
    }),
  );

export const getMember = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => {
    if (!d?.id) throw new Error('id가 필요합니다.');
    return { id: d.id };
  })
  .handler(async ({ data }) => {
    const member = await prisma.member.findFirst({
      where: { id: data.id },
      include: { department: true, team: true },
    });
    if (!member) throw new Error('팀원을 찾을 수 없습니다.');
    return member;
  });

export const createMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => memberCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const createData = {
      name: data.name,
      studentId: data.studentId,
      departmentId: data.departmentId,
      teamId: data.teamId,
      isLeader: data.isLeader,
      contact: data.contact ?? null,
      droppedOut: data.droppedOut,
    };
    // 팀장 유일성: 새 팀장 지정 시 같은 팀의 기존 팀장 해제.
    const member = data.isLeader
      ? (
          await prisma.$transaction([
            prisma.member.updateMany({ where: { teamId: data.teamId, isLeader: true }, data: { isLeader: false } }),
            prisma.member.create({ data: createData }),
          ])
        )[1]
      : await prisma.member.create({ data: createData });
    await writeAudit(context.user.id, 'CREATE', 'Member', member.id, data);
    return member;
  });

export const updateMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => memberUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { id } = data;
    const updateData = {
      name: data.name,
      studentId: data.studentId,
      departmentId: data.departmentId,
      teamId: data.teamId,
      isLeader: data.isLeader,
      contact: data.contact ?? null,
      droppedOut: data.droppedOut,
    };
    const member = data.isLeader
      ? (
          await prisma.$transaction([
            prisma.member.updateMany({
              where: { teamId: data.teamId, isLeader: true, id: { not: id } },
              data: { isLeader: false },
            }),
            prisma.member.update({ where: { id }, data: updateData }),
          ])
        )[1]
      : await prisma.member.update({ where: { id }, data: updateData });
    await writeAudit(context.user.id, 'UPDATE', 'Member', id, data);
    return member;
  });

export const deleteMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => {
    if (!d?.id) throw new Error('id가 필요합니다.');
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    await prisma.member.delete({ where: { id: data.id } }); // soft delete
    await writeAudit(context.user.id, 'DELETE', 'Member', data.id);
    return { ok: true };
  });
