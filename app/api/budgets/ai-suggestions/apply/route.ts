import { z } from 'zod';
import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';

const schema = z.object({
  monthKey: z.string().regex(/^\\d{4}-(0[1-9]|1[0-2])$/),
  totalBudget: z.number().positive().finite(),
  allocations: z.array(z.object({ categoryId: z.string().min(1), amount: z.number().nonnegative().finite() })).min(1),
});

export async function POST(request: Request) {
  try {
    const profile = await requireProfile();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Invalid budget allocation.' }, { status: 422 });
    const { monthKey, totalBudget, allocations } = parsed.data;
    const ids = allocations.map(x => x.categoryId);
    if (new Set(ids).size !== ids.length) return Response.json({ error: 'Each category can appear only once.' }, { status: 422 });
    const allocationTotal = allocations.reduce((sum, row) => sum + row.amount, 0);
    if (Math.abs(allocationTotal - totalBudget) > 1.01) return Response.json({ error: 'Category limits must add up to your total monthly budget.' }, { status: 400 });
    const [salary, categories] = await Promise.all([
      prisma.salary.findFirst({ where: { userId: profile.id, monthKey } }),
      prisma.category.findMany({ where: { userId: profile.id, kind: 'expense', id: { in: ids } } }),
    ]);
    if (!salary) return Response.json({ error: 'Record this month’s take-home salary first.' }, { status: 400 });
    if (totalBudget > Number(salary.amount)) return Response.json({ error: 'The total budget cannot exceed your take-home salary.' }, { status: 400 });
    if (categories.length !== allocations.length) return Response.json({ error: 'One or more expense categories are no longer available.' }, { status: 400 });

    const result = await prisma.$transaction(async (db) => {
      const existingOverall = await db.budget.findFirst({ where: { userId: profile.id, monthKey, categoryId: null } });
      if (existingOverall) {
        await db.budget.update({ where: { id: existingOverall.id }, data: { name: 'Monthly budget', limitAmount: totalBudget } });
      } else {
        await db.budget.create({ data: { userId: profile.id, monthKey, name: 'Monthly budget', limitAmount: totalBudget } });
      }
      for (const allocation of allocations) {
        const category = categories.find(c => c.id === allocation.categoryId)!;
        const existing = await db.budget.findFirst({ where: { userId: profile.id, monthKey, categoryId: category.id } });
        if (existing) await db.budget.update({ where: { id: existing.id }, data: { name: category.name, limitAmount: allocation.amount } });
        else await db.budget.create({ data: { userId: profile.id, monthKey, name: category.name, categoryId: category.id, limitAmount: allocation.amount } });
      }
      return db.budget.findMany({ where: { userId: profile.id, monthKey }, orderBy: { name: 'asc' } });
    });
    return Response.json(result);
  } catch (error) { return jsonError(error); }
}
