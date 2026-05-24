import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/auth';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { Footer } from '@/components/Footer';
import { Providers } from '@/components/providers';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Navbar email={session.user.email} />
        <div className="flex flex-1">
          <Sidebar />
          <main className="app-shell-main">{children}</main>
        </div>
        <Footer minimal />
      </div>
    </Providers>
  );
}
