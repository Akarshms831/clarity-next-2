import { z } from 'zod';
import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  limitAmount: z.number().positive().finite().optional(),
  monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  categoryId: z.string().nullable().optional(),
});

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile();
    const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Invalid budget details.', details: parsed.error.flatten() }, { status: 422 });
    const old = await prisma.budget.findFirst({ where: { id, userId: profile.id } });
    if (!old) return Response.json({ error: 'Budget not found.' }, { status: 404 });
    const data = parsed.data;
    const targetMonth = data.monthKey ?? old.monthKey;
    const [categories, rows, salary] = await Promise.all([
      prisma.category.findMany({ where: { userId: profile.id, kind: 'expense' } }),
      prisma.budget.findMany({ where: { userId: profile.id, monthKey: targetMonth } }),
      prisma.salary.findFirst({ where: { userId: profile.id, monthKey: targetMonth }, orderBy: { payDate: 'desc' } }),
    ]);
    const categoryByName = new Map(categories.map(category => [category.name.trim().toLowerCase(), category]));
    const categoryFor = (row: (typeof rows)[number]) =>
      row.categoryId ? categories.find(category => category.id === row.categoryId) : categoryByName.get(row.name.trim().toLowerCase());
    const categoryRows = rows.filter(row => !!categoryFor(row));
    const overallRows = rows.filter(row => !categoryFor(row) && !row.categoryId);
    const targetCategoryId = data.categoryId === undefined
      ? (old.categoryId || categoryByName.get(old.name.trim().toLowerCase())?.id || null)
      : data.categoryId;
    const targetAmount = data.limitAmount ?? Number(old.limitAmount);

    if (targetCategoryId) {
      const category = categories.find(item => item.id === targetCategoryId);
      if (!category) return Response.json({ error: 'Expense category not found for this account.' }, { status: 400 });
      if (!salary) return Response.json({ error: 'Record this month’s salary received after deductions before planning category limits.' }, { status: 400 });
      const duplicate = categoryRows.find(row => row.id !== id && categoryFor(row)?.id === targetCategoryId);
      if (duplicate) return Response.json({ error: 'A limit already exists for this category this month. Edit the existing category limit instead.' }, { status: 409 });
      const overall = overallRows[0];
      const ceiling = overall ? Number(overall.limitAmount) : Number(salary.amount);
      const planned = categoryRows.filter(row => row.id !== id).reduce((sum, row) => sum + Number(row.limitAmount), 0) + targetAmount;
      if (planned > ceiling) return Response.json({ error: `Combined category limits cannot exceed this month’s ${overall ? 'overall budget' : 'salary received after deductions'} (${ceiling}).` }, { status: 400 });
    } else {
      if (!salary) return Response.json({ error: 'Record this month’s salary received after deductions before setting the overall budget.' }, { status: 400 });
      if (targetAmount > Number(salary.amount)) return Response.json({ error: 'The overall monthly budget cannot exceed this month’s salary received after deductions.' }, { status: 400 });
      if (categoryRows.reduce((sum, row) => sum + Number(row.limitAmount), 0) > targetAmount) return Response.json({ error: 'The overall budget cannot be lower than the combined category limits. Reduce category limits first.' }, { status: 400 });
      if (overallRows.some(row => row.id !== id)) return Response.json({ error: 'An overall budget already exists for this month.' }, { status: 409 });
    }

    return Response.json(await prisma.budget.update({
      where: { id },
      data: { ...data, ...(targetCategoryId ? { name: categories.find(category => category.id === targetCategoryId)!.name } : {}), monthKey: targetMonth, categoryId: targetCategoryId },
    }));
  } catch (error) { return jsonError(error); }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile();
    const { id } = await params;
    const result = await prisma.budget.deleteMany({ where: { id, userId: profile.id } });
    if (!result.count) return Response.json({ error: 'Budget not found.' }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) { return jsonError(error); }
}
