import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const profile = await requireProfile();
    const [income, expenses, budgets, categories, recent] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId: profile.id, kind: 'income' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId: profile.id, kind: 'expense' }, _sum: { amount: true } }),
      prisma.budget.findMany({ where: { userId: profile.id }, orderBy: { createdAt: 'desc' } }),
      prisma.category.findMany({ where: { userId: profile.id }, orderBy: [{ kind: 'asc' }, { name: 'asc' }] }),
      prisma.transaction.findMany({ where: { userId: profile.id }, include: { category: true }, orderBy: { date: 'desc' }, take: 8 }),
    ]);
    return Response.json({ profile, totals: { income: Number(income._sum.amount ?? 0), expenses: Number(expenses._sum.amount ?? 0) }, budgets, categories, recent });
  } catch (error) { return jsonError(error); }
}
