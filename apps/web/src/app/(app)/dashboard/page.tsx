import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardView } from '@/components/DashboardView';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  return <DashboardView />;
}
