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
    const existingBudget = await prisma.budget.findFirst({ where: { userId: profile.id, monthKey: key, categoryId: null } });
    if (existingBudget && Number(existingBudget.limitAmount) > data.amount) return Response.json({ error: 'Your existing monthly budget is higher than this salary. Lower the monthly budget first, then update your salary.' }, { status: 400 });
    const categoryBudgets = await prisma.budget.findMany({ where: { userId: profile.id, monthKey: key, categoryId: { not: null } } });
    const categoryTotal = categoryBudgets.reduce((sum, row) => sum + Number(row.limitAmount), 0);
    if (categoryTotal > (existingBudget ? Number(existingBudget.limitAmount) : data.amount)) return Response.json({ error: 'Your combined category limits exceed this month’s available plan. Reduce category limits before updating salary.' }, { status: 400 });
    const existing = await prisma.salary.findFirst({ where: { userId: profile.id, monthKey: key }, orderBy: { payDate: 'desc' } });
    const row = existing
      ? await prisma.salary.update({ where: { id: existing.id }, data: { ...data, payDate, monthKey: key } })
      : await prisma.salary.create({ data: { ...data, payDate, monthKey: key, userId: profile.id } });
    const monthlyBudget = await prisma.budget.findFirst({ where: { userId: profile.id, monthKey: key, categoryId: null } });
    if (!monthlyBudget) await prisma.budget.create({ data: { userId: profile.id, monthKey: key, name: 'Monthly budget', limitAmount: data.amount, categoryId: null } });
    return Response.json(row, { status: existing ? 200 : 201 });
  } catch (error) { return jsonError(error); }
}
