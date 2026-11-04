import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/dashboard';
export default async function DashboardPage(){const {userId}=await auth();if(!userId)redirect('/sign-in');const user=await currentUser();return <Dashboard name={user?.firstName||'there'} email={user?.primaryEmailAddress?.emailAddress||''}/>}
