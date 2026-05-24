import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account</h2>
        <p className="mt-2 text-sm text-slate-700">
          Signed in as <span className="font-medium">{session.user.email}</span>
        </p>
      </div>
    </div>
  );
}
