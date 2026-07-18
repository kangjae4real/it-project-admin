import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { getCurrentUser } from '../server/auth';

// pathless layout: 이 아래 모든 라우트는 로그인 필요. 미인증 시 /login 으로.
export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: '/login' });
    return { user };
  },
  component: () => <Outlet />,
});
