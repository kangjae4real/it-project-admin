import { Link, Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { GraduationCap, LayoutDashboard, LogOut, Trophy, UserRound, Users } from 'lucide-react';

import { getCurrentUser, logout } from '../server/auth';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

// pathless layout: 이 아래 모든 라우트는 로그인 필요. 미인증 시 /login 으로.
export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: '/login' });
    return { user };
  },
  component: AuthedLayout,
});

const NAV = [
  { to: '/', label: '대시보드', icon: LayoutDashboard, exact: true },
  { to: '/teams', label: '팀', icon: Users, exact: false },
  { to: '/members', label: '팀원', icon: UserRound, exact: false },
  { to: '/departments', label: '학과', icon: GraduationCap, exact: false },
  { to: '/leagues', label: '리그', icon: Trophy, exact: false },
] as const;

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  async function onLogout() {
    await logout();
    await router.invalidate();
    await router.navigate({ to: '/login' });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="px-5 py-5">
          <p className="text-sm font-semibold tracking-tight">공모전 운영 Admin</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: 'bg-accent text-foreground' }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border px-3 py-3">
          <p className="truncate px-2 pb-2 text-xs text-muted-foreground">{user.name}</p>
          <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start gap-2">
            <LogOut className="size-4" />
            로그아웃
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>

      <Toaster theme="dark" position="top-right" richColors />
    </div>
  );
}
