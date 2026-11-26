import { z } from 'zod';
import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  limitAmount: z.number().positive().finite(),
  monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  categoryId: z.string().nullable().optional(),
});

async function getBudgetContext(userId: string, monthKey: string) {
  const [categories, rows, salary] = await Promise.all([
    prisma.category.findMany({ where: { userId, kind: 'expense' } }),
    prisma.budget.findMany({ where: { userId, monthKey } }),
    prisma.salary.findFirst({ where: { userId, monthKey }, orderBy: { payDate: 'desc' } }),
  ]);
  const categoryByName = new Map(categories.map(category => [category.name.trim().toLowerCase(), category]));
  const categoryFor = (row: (typeof rows)[number]) =>
    row.categoryId ? categories.find(category => category.id === row.categoryId) : categoryByName.get(row.name.trim().toLowerCase());
  const categoryRows = rows.filter(row => !!categoryFor(row));
  const overallRows = rows.filter(row => !categoryFor(row) && !row.categoryId);
  return { categories, rows, salary, categoryFor, categoryRows, overallRows };
}

export async function GET(request: Request) {
  try {
    const profile = await requireProfile();
    const month = new URL(request.url).searchParams.get('month');
    const rows = await prisma.budget.findMany({
      where: { userId: profile.id, ...(month ? { monthKey: month } : {}) },
      orderBy: [{ monthKey: 'desc' }, { name: 'asc' }],
    });
    const categories = await prisma.category.findMany({ where: { userId: profile.id, kind: 'expense' } });
    const categoryByName = new Map(categories.map(category => [category.name.trim().toLowerCase(), category.id]));
    // Older rows may have a missing categoryId. Resolve them in the response without
    // mutating financial records, so category limits are not mistaken for overall budgets.
    return Response.json(rows.map(row => ({
      ...row,
      categoryId: row.categoryId || categoryByName.get(row.name.trim().toLowerCase()) || null,
    })));
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const profile = await requireProfile();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Invalid budget details.', details: parsed.error.flatten() }, { status: 422 });
    const data = parsed.data;
    const context = await getBudgetContext(profile.id, data.monthKey);

    if (data.categoryId) {
      const category = context.categories.find(item => item.id === data.categoryId);
      if (!category) return Response.json({ error: 'Expense category not found for this account.' }, { status: 400 });
      if (!context.salary) return Response.json({ error: 'Record this month’s salary received after deductions before planning category limits.' }, { status: 400 });
      const existing = context.categoryRows.find(row => context.categoryFor(row)?.id === category.id);
      const overall = context.overallRows[0];
      const ceiling = overall ? Number(overall.limitAmount) : Number(context.salary.amount);
      const planned = context.categoryRows
        .filter(row => row.id !== existing?.id)
        .reduce((sum, row) => sum + Number(row.limitAmount), 0) + data.limitAmount;
      if (planned > ceiling) return Response.json({ error: `Combined category limits cannot exceed this month’s ${overall ? 'overall budget' : 'salary received after deductions'} (${ceiling}).` }, { status: 400 });
      if (existing) {
        const updated = await prisma.budget.update({ where: { id: existing.id }, data: { name: data.name, limitAmount: data.limitAmount, categoryId: category.id } });
        return Response.json(updated);
      }
    } else {
      if (!context.salary) return Response.json({ error: 'Record this month’s salary received after deductions before setting the overall budget.' }, { status: 400 });
      if (data.limitAmount > Number(context.salary.amount)) return Response.json({ error: 'The overall monthly budget cannot exceed your take-home salary.' }, { status: 400 });
      if (context.overallRows.length) return Response.json({ error: 'An overall budget already exists for this month. Edit that budget instead.' }, { status: 409 });
      const categoryTotal = context.categoryRows.reduce((sum, row) => sum + Number(row.limitAmount), 0);
      if (categoryTotal > data.limitAmount) return Response.json({ error: 'The overall budget cannot be lower than the combined category limits. Reduce category limits first.' }, { status: 400 });
    }

    const row = await prisma.budget.create({ data: { ...data, userId: profile.id } });
    return Response.json(row, { status: 201 });
  } catch (error) { return jsonError(error); }
}
