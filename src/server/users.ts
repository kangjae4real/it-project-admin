import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { authMiddleware } from './middleware';
import { writeAudit } from './audit';
import { hashPassword } from '../lib/auth/password';
import { userCreateSchema } from '../lib/schemas/user';

export const listUsers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () =>
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, username: true, name: true, createdAt: true },
    }),
  );

// 운영진 계정 생성 (공개 가입 아님 — 로그인한 운영진만 호출 가능).
export const createUser = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: unknown) => userCreateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) throw new Error('이미 존재하는 아이디입니다.');
    const user = await prisma.user.create({
      data: { username: data.username, name: data.name, passwordHash: await hashPassword(data.password) },
    });
    await writeAudit(context.user.id, 'CREATE', 'User', user.id, { username: data.username, name: data.name });
    return { id: user.id, username: user.username, name: user.name };
  });

export const deleteUser = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((d: { id: string }) => {
    if (!d?.id) throw new Error('id가 필요합니다.');
    return { id: d.id };
  })
  .handler(async ({ data, context }) => {
    if (data.id === context.user.id) throw new Error('자기 자신은 삭제할 수 없습니다.');
    try {
      await prisma.user.delete({ where: { id: data.id } });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2003') {
        throw new Error('활동 기록이 있어 삭제할 수 없습니다.');
      }
      throw err;
    }
    await writeAudit(context.user.id, 'DELETE', 'User', data.id);
    return { ok: true };
  });
