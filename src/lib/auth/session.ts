import { useSession } from '@tanstack/react-start/server';

export interface AppSession {
  userId?: string;
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET 환경변수가 없거나 32자 미만입니다.');
  }
  return secret;
}

// 서명된 httpOnly 쿠키 세션. 서버 함수 안에서만 호출.
export function getAppSession() {
  return useSession<AppSession>({
    password: getSecret(),
    name: 'admin-session',
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      // 로컬(http)에서는 secure 쿠키가 안 걸리므로 프로덕션에서만 secure.
      secure: process.env.NODE_ENV === 'production',
    },
  });
}
