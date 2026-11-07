import { z } from 'zod';
import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime='nodejs';
const defaults=['Food & Dining','Groceries','Transport','Bills & Utilities','Shopping','Health','Entertainment','Home','Travel','Education','Personal','Other'];
const schema=z.object({name:z.string().trim().min(1).max(50),kind:z.enum(['income','expense']),color:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),icon:z.string().max(40).optional()});
export async function GET(){try{
 const p=await requireProfile();
 const existing=await prisma.category.findMany({where:{userId:p.id}});
 if(existing.length===0) await prisma.category.createMany({data:defaults.map((name)=>({userId:p.id,name,kind:'expense',color:'#8B8BF5',icon:'circle'})),skipDuplicates:true});
 return Response.json(await prisma.category.findMany({where:{userId:p.id},orderBy:[{kind:'asc'},{name:'asc'}]}));
}catch(e){return jsonError(e)}}
export async function POST(req:Request){try{const p=await requireProfile();const v=schema.safeParse(await req.json());if(!v.success)return Response.json({error:'Invalid category.',details:v.error.flatten()},{status:422});const c=await prisma.category.create({data:{...v.data,userId:p.id}});return Response.json(c,{status:201});}catch(e){return jsonError(e)}}
