import { createMiddleware } from '@tanstack/react-start';

import { prisma } from '../db';
import { getAppSession } from '../lib/auth/session';

// 서버 함수는 공개 RPC 엔드포인트다. 라우트 가드로는 못 막으니
// 모든 CRUD 서버 함수가 이 미들웨어로 서버측 세션을 검증하고 ctx.user 를 받는다.
export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const session = await getAppSession();
  const userId = session.data.userId;
  if (!userId) throw new Error('로그인이 필요합니다.');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true },
  });
  if (!user) throw new Error('세션이 유효하지 않습니다. 다시 로그인하세요.');
  return next({ context: { user } });
});
