import { createServerFn } from '@tanstack/react-start';

import { prisma } from '../db';
import { getAppSession } from '../lib/auth/session';
import { verifyPassword } from '../lib/auth/password';

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
}

// 로그인: 자격 검증 후 세션에 userId 저장.
export const login = createServerFn({ method: 'POST' })
  .validator((data: { username: string; password: string }) => {
    if (!data?.username?.trim() || !data?.password) {
      throw new Error('아이디와 비밀번호를 입력하세요.');
    }
    return { username: data.username.trim(), password: data.password };
  })
  .handler(async ({ data }): Promise<CurrentUser> => {
    const user = await prisma.user.findUnique({ where: { username: data.username } });
    if (!user || !(await verifyPassword(user.passwordHash, data.password))) {
      // 아이디 존재 여부를 노출하지 않도록 동일 메시지.
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    const session = await getAppSession();
    await session.update({ userId: user.id });
    return { id: user.id, username: user.username, name: user.name };
  });

// 로그아웃: 세션 비움.
export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await getAppSession();
  await session.clear();
  return { ok: true };
});

// 현재 로그인 사용자 (없으면 null). 라우트 beforeLoad 가드에서 사용.
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentUser | null> => {
    const session = await getAppSession();
    const userId = session.data.userId;
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, name: true },
    });
    return user ?? null;
  },
);
