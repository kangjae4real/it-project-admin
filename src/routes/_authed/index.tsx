import { createFileRoute, useRouter } from '@tanstack/react-router';

import { logout } from '../../server/auth';

export const Route = createFileRoute('/_authed/')({
  component: Home,
});

function Home() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  async function onLogout() {
    await logout();
    await router.invalidate();
    await router.navigate({ to: '/login' });
  }

  return (
    <div className="min-h-screen bg-[#010102] px-8 py-6 text-[#f7f8f8]">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">공모전 운영 Admin</h1>
          <p className="mt-1 text-sm text-[#8a8f98]">{user.name}님으로 로그인됨</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-md border border-[#23252a] bg-[#0f1011] px-3 py-2 text-sm text-[#f7f8f8] hover:border-[#34343a]"
        >
          로그아웃
        </button>
      </div>

      <p className="mx-auto mt-10 max-w-5xl text-[#8a8f98]">
        인증 골격 완료. 다음 단계에서 팀/팀원/학과/리그 화면을 여기에 붙입니다.
      </p>
    </div>
  );
}
