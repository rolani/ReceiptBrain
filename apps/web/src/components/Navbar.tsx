import Link from 'next/link';
import { BrainIcon } from './ui/Icons';

export function Navbar({ email }: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm"
            aria-hidden
          >
            <BrainIcon size={18} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">ReceiptBrain</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-slate-600">
          <Link
            href="/upload"
            className="hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:inline-flex"
          >
            + Upload
          </Link>
          {email ? (
            <span className="hidden max-w-[14rem] truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 md:inline">
              {email}
            </span>
          ) : null}
          <Link
            href="/api/auth/signout"
            className="rounded-md px-2 py-1.5 text-xs font-medium transition hover:bg-slate-100 hover:text-slate-900"
          >
            Sign out
          </Link>
        </nav>
      </div>
    </header>
  );
}
