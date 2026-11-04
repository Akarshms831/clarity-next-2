import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({ok:true,app:'Clarity',databaseConfigured:Boolean(process.env.DATABASE_URL),authConfigured:Boolean(process.env.CLERK_SECRET_KEY)});}
