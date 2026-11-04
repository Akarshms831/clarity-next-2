import { z } from 'zod';
import { requireProfile, jsonError, monthKey } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
const schema = z.object({ title: z.string().trim().min(1).max(120), amount: z.number().positive().finite(), kind: z.enum(['income','expense']), date: z.string().datetime(), categoryId: z.string().nullable().optional(), notes: z.string().max(1000).optional(), paymentMode: z.string().max(40).optional() });
export async function GET(request: Request) {
  try { const profile = await requireProfile(); const url = new URL(request.url); const month = url.searchParams.get('month'); const rows = await prisma.transaction.findMany({ where: { userId: profile.id, ...(month ? { monthKey: month } : {}) }, include: { category: true }, orderBy: { date: 'desc' } }); return Response.json(rows); }
  catch (error) { return jsonError(error); }
}
export async function POST(request: Request) {
  try { const profile = await requireProfile(); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: 'Invalid transaction details.', details: parsed.error.flatten() }, { status: 422 }); const data = parsed.data; if (data.categoryId) { const category = await prisma.category.findFirst({ where: { id: data.categoryId, userId: profile.id, kind: data.kind } }); if (!category) return Response.json({ error: 'Category not found for this account.' }, { status: 400 }); }
    const date = new Date(data.date); const row = await prisma.transaction.create({ data: { ...data, date, monthKey: monthKey(date), userId: profile.id } , include: { category: true } }); return Response.json(row, { status: 201 }); }
  catch (error) { return jsonError(error); }
}
