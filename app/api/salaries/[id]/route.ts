import { z } from 'zod';
import { requireProfile, jsonError, monthKey } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  amount: z.number().positive().finite().optional(),
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
    const row = await prisma.salary.update({ where: { id }, data: { ...data, payDate, monthKey: monthKey(payDate) } });
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
