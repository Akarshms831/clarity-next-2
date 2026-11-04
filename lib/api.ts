import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function requireProfile() {
  const { userId } = await auth();
  if (!userId) throw new Error('UNAUTHENTICATED');
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!email) throw new Error('ACCOUNT_EMAIL_REQUIRED');
  const profile = await prisma.userProfile.upsert({
    where: { id: userId },
    update: { email, displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null },
    create: { id: userId, email, displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null },
  });
  return profile;
}

export function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  const status = message === 'UNAUTHENTICATED' ? 401 : message === 'ACCOUNT_EMAIL_REQUIRED' ? 400 : 500;
  return Response.json({ error: status === 500 ? 'The request could not be completed.' : message, code: message }, { status });
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
