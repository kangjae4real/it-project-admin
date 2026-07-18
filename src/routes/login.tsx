import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import { getCurrentUser, login } from '../server/auth';

export const Route = createFileRoute('/login')({
  // 이미 로그인 상태면 홈으로.
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) throw redirect({ to: '/' });
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ data: { username, password } });
      await router.invalidate();
      await router.navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#010102] px-4 text-[#f7f8f8]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-[#23252a] bg-[#0f1011] p-8"
      >
        <h1 className="text-xl font-semibold tracking-tight">공모전 운영 Admin</h1>
        <p className="mt-1 text-sm text-[#8a8f98]">운영진 로그인</p>

        <label className="mt-6 block text-sm text-[#d0d6e0]">
          아이디
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            className="mt-1 w-full rounded-md border border-[#23252a] bg-[#010102] px-3 py-2 text-[#f7f8f8] outline-none focus:border-[#5e6ad2]"
          />
        </label>

        <label className="mt-4 block text-sm text-[#d0d6e0]">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-[#23252a] bg-[#010102] px-3 py-2 text-[#f7f8f8] outline-none focus:border-[#5e6ad2]"
          />
        </label>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-md bg-[#5e6ad2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#828fff] disabled:opacity-50"
        >
          {pending ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
