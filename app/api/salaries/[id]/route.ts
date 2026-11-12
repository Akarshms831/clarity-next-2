import { z } from 'zod';
import { requireProfile, jsonError, monthKey } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  amount: z.number().positive().finite().optional(),
  grossAmount: z.number().positive().finite().nullable().optional(),
  payDate: z.string().datetime().optional(),
  notes: z.string().max(1000).nullable().optional(),
});
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile(); const { id } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Invalid salary details.', details: parsed.error.flatten() }, { status: 422 });
    const old = await prisma.salary.findFirst({ where: { id, userId: profile.id } });
    if (!old) return Response.json({ error: 'Salary record not found.' }, { status: 404 });
    const data = parsed.data; const payDate = data.payDate ? new Date(data.payDate) : old.payDate;
    const targetMonth = monthKey(payDate);
    const nextAmount = data.amount ?? Number(old.amount);
    const nextGross = data.grossAmount === undefined ? (old.grossAmount == null ? null : Number(old.grossAmount)) : data.grossAmount;
    if (nextGross != null && nextGross < nextAmount) return Response.json({ error: 'Gross salary cannot be lower than salary received after deductions.' }, { status: 400 });
    const overall = await prisma.budget.findFirst({ where: { userId: profile.id, monthKey: targetMonth, categoryId: null } });
    if (overall && Number(overall.limitAmount) > nextAmount) return Response.json({ error: 'The monthly overall budget is higher than this salary. Lower the budget first.' }, { status: 400 });
    const categoryBudgets = await prisma.budget.findMany({ where: { userId: profile.id, monthKey: targetMonth, categoryId: { not: null } } });
    const categoryTotal = categoryBudgets.reduce((sum, row) => sum + Number(row.limitAmount), 0);
    if (categoryTotal > (overall ? Number(overall.limitAmount) : nextAmount)) return Response.json({ error: 'Combined category limits exceed this month’s available plan. Reduce category limits first.' }, { status: 400 });
    const row = await prisma.salary.update({ where: { id }, data: { ...data, payDate, monthKey: targetMonth } });
    return Response.json(row);
  } catch (error) { return jsonError(error); }
}
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const profile = await requireProfile(); const { id } = await params;
    const result = await prisma.salary.deleteMany({ where: { id, userId: profile.id } });
    if (!result.count) return Response.json({ error: 'Salary record not found.' }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) { return jsonError(error); }
}
