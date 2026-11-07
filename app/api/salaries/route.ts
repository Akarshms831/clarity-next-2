import { z } from 'zod';
import { requireProfile, jsonError, monthKey } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
const schema = z.object({
  title: z.string().trim().min(1).max(100),
  amount: z.number().positive().finite(),
  payDate: z.string().datetime(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const profile = await requireProfile();
    const month = new URL(request.url).searchParams.get('month');
    const rows = await prisma.salary.findMany({
      where: { userId: profile.id, ...(month ? { monthKey: month } : {}) },
      orderBy: { payDate: 'desc' },
    });
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const profile = await requireProfile();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Invalid salary details.', details: parsed.error.flatten() }, { status: 422 });
    const data = parsed.data;
    const payDate = new Date(data.payDate);
    const key = monthKey(payDate);
    const existing = await prisma.salary.findFirst({ where: { userId: profile.id, monthKey: key }, orderBy: { payDate: 'desc' } });
    const row = existing
      ? await prisma.salary.update({ where: { id: existing.id }, data: { ...data, payDate, monthKey: key } })
      : await prisma.salary.create({ data: { ...data, payDate, monthKey: key, userId: profile.id } });
    return Response.json(row, { status: existing ? 200 : 201 });
  } catch (error) { return jsonError(error); }
}
