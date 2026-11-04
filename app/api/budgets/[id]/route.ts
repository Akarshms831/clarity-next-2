import { z } from 'zod';
import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ name: z.string().trim().min(1).max(80).optional(), limitAmount: z.number().positive().finite().optional(), monthKey: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(), categoryId: z.string().nullable().optional() });
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile(); const { id } = await params; const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Invalid budget details.', details: parsed.error.flatten() }, { status: 422 });
    const old = await prisma.budget.findFirst({ where: { id, userId: profile.id } });
    if (!old) return Response.json({ error: 'Budget not found.' }, { status: 404 });
    const data = parsed.data;
    if (data.categoryId) {
      const category = await prisma.category.findFirst({ where: { id: data.categoryId, userId: profile.id, kind: 'expense' } });
      if (!category) return Response.json({ error: 'Expense category not found for this account.' }, { status: 400 });
    }
    return Response.json(await prisma.budget.update({ where: { id }, data }));
  } catch (error) { return jsonError(error); }
}
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile(); const { id } = await params;
    const result = await prisma.budget.deleteMany({ where: { id, userId: profile.id } });
    if (!result.count) return Response.json({ error: 'Budget not found.' }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) { return jsonError(error); }
}
