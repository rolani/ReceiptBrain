import Link from 'next/link';
import { BrainIcon } from './ui/Icons';

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
            <BrainIcon size={18} />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            ReceiptBrain
          </span>
        </Link>

        <nav
          aria-label="Marketing"
          className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"
        >
          <a href="#features" className="transition hover:text-slate-900">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-slate-900">
            How it works
          </a>
          <a href="#faq" className="transition hover:text-slate-900">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
