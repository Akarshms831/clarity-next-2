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
export async function GET(request: Request) {
  try {
    const profile = await requireProfile(); const month = new URL(request.url).searchParams.get('month');
    const rows = await prisma.budget.findMany({ where: { userId: profile.id, ...(month ? { monthKey: month } : {}) }, orderBy: [{ monthKey: 'desc' }, { name: 'asc' }] });
    return Response.json(rows);
  } catch (error) { return jsonError(error); }
}
export async function POST(request: Request) {
  try {
    const profile = await requireProfile(); const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Invalid budget details.', details: parsed.error.flatten() }, { status: 422 });
    const data = parsed.data;
    if (data.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: data.categoryId, userId: profile.id, kind: 'expense' } });
      if (!category) return Response.json({ error: 'Expense category not found for this account.' }, { status: 400 });
    }
    const row = await prisma.budget.create({ data: { ...data, userId: profile.id } });
    return Response.json(row, { status: 201 });
  } catch (error) { return jsonError(error); }
}
