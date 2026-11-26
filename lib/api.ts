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
  const prismaCode = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code ?? '')
    : '';
  if (prismaCode === 'P2002') {
    return Response.json({ error: 'A record with these details already exists. Edit the existing record instead.', code: prismaCode }, { status: 409 });
  }
  if (prismaCode === 'P2003') {
    return Response.json({ error: 'This record is linked to other saved data and cannot be changed that way.', code: prismaCode }, { status: 409 });
  }
  if (prismaCode === 'P2025') {
    return Response.json({ error: 'The record could not be found. Refresh and try again.', code: prismaCode }, { status: 404 });
  }
  const status = message === 'UNAUTHENTICATED' ? 401 : message === 'ACCOUNT_EMAIL_REQUIRED' ? 400 : 500;
  return Response.json({ error: status === 500 ? 'The request could not be completed.' : message, code: message }, { status });
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
