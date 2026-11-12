import { z } from 'zod';
import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
const defaults:Record<string,number>={'Food & Dining':4000,'Groceries':5000,'Transport':2500,'Bills & Utilities':3000,'Shopping':2500,'Health':1500,'Entertainment':1500,'Home':2000,'Travel':1000,'Education':1000,'Personal':1000,'Other':1000};
const schema = z.object({name:z.string().trim().min(1).max(80),limitAmount:z.number().positive().finite(),monthKey:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),categoryId:z.string().nullable().optional()});
export async function GET(request:Request){try{
 const profile=await requireProfile();const month=new URL(request.url).searchParams.get('month');
 const categories=await prisma.category.findMany({where:{userId:profile.id,kind:'expense'}});
 if(month){
  const existing=await prisma.budget.findMany({where:{userId:profile.id,monthKey:month,categoryId:{not:null}},select:{categoryId:true}});
  const present=new Set(existing.map(x=>x.categoryId));
  const missing=categories.filter(c=>!present.has(c.id)&&defaults[c.name]!==undefined);
  if(missing.length) await prisma.budget.createMany({data:missing.map(c=>({userId:profile.id,monthKey:month,name:c.name,categoryId:c.id,limitAmount:defaults[c.name]})),skipDuplicates:true});
 }
 const rows=await prisma.budget.findMany({where:{userId:profile.id,...(month?{monthKey:month}:{})},orderBy:[{monthKey:'desc'},{name:'asc'}]});
 return Response.json(rows);
}catch(error){return jsonError(error)}}
export async function POST(request:Request){try{
 const profile=await requireProfile();const parsed=schema.safeParse(await request.json());
 if(!parsed.success)return Response.json({error:'Invalid budget details.',details:parsed.error.flatten()},{status:422});
 const data=parsed.data;
 if(!data.categoryId){const salary=await prisma.salary.findFirst({where:{userId:profile.id,monthKey:data.monthKey}});if(salary&&data.limitAmount>Number(salary.amount))return Response.json({error:'The overall monthly budget cannot exceed your take-home salary.'},{status:400});const exists=await prisma.budget.findFirst({where:{userId:profile.id,monthKey:data.monthKey,categoryId:null}});if(exists)return Response.json({error:'An overall budget already exists for this month. Edit that budget instead.'},{status:409});}
 if(data.categoryId){const category=await prisma.category.findFirst({where:{id:data.categoryId,userId:profile.id,kind:'expense'}});if(!category)return Response.json({error:'Expense category not found for this account.'},{status:400});}
 const row=await prisma.budget.create({data:{...data,userId:profile.id}});
 return Response.json(row,{status:201});
}catch(error){return jsonError(error)}}
