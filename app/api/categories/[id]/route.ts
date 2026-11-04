import { z } from 'zod';
import { requireProfile, jsonError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export const runtime='nodejs';
type Ctx={params:Promise<{id:string}>};
const schema=z.object({name:z.string().trim().min(1).max(50)});
export async function PATCH(req:Request,{params}:Ctx){try{const p=await requireProfile();const {id}=await params;const v=schema.safeParse(await req.json());if(!v.success)return Response.json({error:'Invalid category name.'},{status:422});const exists=await prisma.category.findFirst({where:{id,userId:p.id}});if(!exists)return Response.json({error:'Category not found.'},{status:404});const c=await prisma.category.update({where:{id},data:v.data});return Response.json(c);}catch(e){return jsonError(e)}}
export async function DELETE(_req:Request,{params}:Ctx){try{const p=await requireProfile();const {id}=await params;const c=await prisma.category.findFirst({where:{id,userId:p.id}});if(!c)return Response.json({error:'Category not found.'},{status:404});const used=await prisma.transaction.count({where:{userId:p.id,categoryId:id}});if(used)return Response.json({error:'This category is used by transactions. Rename it or reassign those transactions before deleting.'},{status:409});await prisma.category.delete({where:{id}});return new Response(null,{status:204});}catch(e){return jsonError(e)}}
