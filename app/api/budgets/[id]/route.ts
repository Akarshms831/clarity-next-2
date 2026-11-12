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
    const targetMonth=data.monthKey??old.monthKey;const targetCategory=data.categoryId===undefined?old.categoryId:data.categoryId;
    if(targetCategory===null){
      const salary=await prisma.salary.findFirst({where:{userId:profile.id,monthKey:targetMonth}});
      if(!salary)return Response.json({error:'Record this month’s salary received after deductions before setting the overall budget.'},{status:400});
      const targetAmount=data.limitAmount??Number(old.limitAmount);
      if(targetAmount>Number(salary.amount))return Response.json({error:'The overall monthly budget cannot exceed this month’s salary received after deductions.'},{status:400});
      const categoryRows=await prisma.budget.findMany({where:{userId:profile.id,monthKey:targetMonth,categoryId:{not:null}}});
      const categoryTotal=categoryRows.reduce((sum,row)=>sum+Number(row.limitAmount),0);
      if(categoryTotal>targetAmount)return Response.json({error:'The overall budget cannot be lower than the combined category limits. Reduce category limits first.'},{status:400});
      const duplicate=await prisma.budget.findFirst({where:{userId:profile.id,monthKey:targetMonth,categoryId:null,NOT:{id}}});
      if(duplicate)return Response.json({error:'An overall budget already exists for this month.'},{status:409});
    } else {
      const salary=await prisma.salary.findFirst({where:{userId:profile.id,monthKey:targetMonth}});
      if(!salary)return Response.json({error:'Record this month’s salary received after deductions before planning category limits.'},{status:400});
      const overall=await prisma.budget.findFirst({where:{userId:profile.id,monthKey:targetMonth,categoryId:null}});
      const rows=await prisma.budget.findMany({where:{userId:profile.id,monthKey:targetMonth,categoryId:{not:null},NOT:{id}}});
      const planned=rows.reduce((sum,row)=>sum+Number(row.limitAmount),0)+(data.limitAmount??Number(old.limitAmount));
      const ceiling=overall?Number(overall.limitAmount):Number(salary.amount);
      if(planned>ceiling)return Response.json({error:`Combined category limits cannot exceed this month’s ${overall?'overall budget':'salary received after deductions'} (${ceiling}).`},{status:400});
    }
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
