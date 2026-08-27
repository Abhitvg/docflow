import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SESSION_COOKIE = 'docflow_session';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
