import { z } from 'zod';
import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';

const requestSchema = z.object({
  monthKey: z.string().regex(/^\\d{4}-(0[1-9]|1[0-2])$/),
  totalBudget: z.number().positive().finite(),
  months: z.union([z.literal(3), z.literal(6)]).default(6),
});

export async function POST(request: Request) {
  try {
    const profile = await requireProfile();
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Enter a valid monthly budget.' }, { status: 422 });
    const { monthKey, totalBudget, months } = parsed.data;
    const [categories, salary, transactions] = await Promise.all([
      prisma.category.findMany({ where: { userId: profile.id, kind: 'expense' }, orderBy: { name: 'asc' } }),
      prisma.salary.findFirst({ where: { userId: profile.id, monthKey } }),
      prisma.transaction.findMany({
        where: { userId: profile.id, kind: 'expense', monthKey: { lt: monthKey, gte: (() => { const [y,m] = monthKey.split('-').map(Number); const d = new Date(y, m - months - 1, 1); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); })() } },
        include: { category: { select: { id: true, name: true } } },
        orderBy: { date: 'asc' },
      }),
    ]);
    if (!salary) return Response.json({ error: 'Add this month’s take-home salary before generating category suggestions.' }, { status: 400 });
    if (totalBudget > Number(salary.amount)) return Response.json({ error: 'Your total budget cannot exceed your take-home salary.' }, { status: 400 });
    if (!categories.length) return Response.json({ error: 'Add at least one expense category first.' }, { status: 400 });

    const [year, month] = monthKey.split('-').map(Number);
    const monthKeys = Array.from({ length: months }, (_, i) => {
      const d = new Date(year, month - 1 - months + i, 1);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    });
    const totals = new Map<string, Map<string, number>>();
    for (const category of categories) totals.set(category.id, new Map(monthKeys.map(key => [key, 0])));
    for (const tx of transactions) {
      const categoryId = tx.categoryId;
      const key = tx.monthKey;
      if (categoryId && totals.has(categoryId) && totals.get(categoryId)!.has(key)) {
        totals.get(categoryId)!.set(key, (totals.get(categoryId)!.get(key) || 0) + Number(tx.amount));
      }
    }
    const rows = categories.map(category => {
      const values = monthKeys.map(key => totals.get(category.id)!.get(key) || 0);
      const sorted = [...values].sort((a,b) => a-b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
      const recent = values.slice(-3);
      const recentAverage = recent.reduce((a,b) => a+b, 0) / recent.length;
      const baseline = median * 0.55 + recentAverage * 0.45;
      const hasHistory = values.some(v => v > 0);
      return { categoryId: category.id, name: category.name, historicalAverage: values.reduce((a,b)=>a+b,0) / months, recentAverage, baseline: hasHistory ? baseline : 0, hasHistory };
    });
    const known = rows.filter(r => r.baseline > 0);
    const fallback = known.length ? 0 : totalBudget / rows.length;
    const scoreTotal = rows.reduce((sum, row) => sum + (row.baseline || fallback), 0);
    const raw = rows.map(row => ({ ...row, raw: scoreTotal ? totalBudget * (row.baseline || fallback) / scoreTotal : totalBudget / rows.length }));
    const rounded = raw.map(row => ({ ...row, amount: Math.floor(row.raw) }));
    let remainder = Math.round(totalBudget) - rounded.reduce((sum,row)=>sum+row.amount,0);
    [...rounded].sort((a,b)=>(b.raw-Math.floor(b.raw))-(a.raw-Math.floor(a.raw))).forEach(row => { if (remainder > 0) { row.amount += 1; remainder -= 1; } });
    return Response.json({
      monthKey, totalBudget, months, monthsWithData: new Set(transactions.map(t=>t.monthKey)).size,
      method: 'A blended category baseline using the median across the selected period and the most recent three-month average.',
      allocations: rounded.map(({ categoryId, name, amount, historicalAverage, recentAverage, hasHistory }) => ({ categoryId, name, amount, historicalAverage: Math.round(historicalAverage), recentAverage: Math.round(recentAverage), hasHistory })),
    });
  } catch (error) { return jsonError(error); }
}
