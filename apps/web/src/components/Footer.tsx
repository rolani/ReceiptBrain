import Link from 'next/link';
import { BrainIcon, GithubIcon } from './ui/Icons';

export function Footer({ minimal = false }: { minimal?: boolean }) {
  const year = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="mt-12 border-t border-slate-200/80 bg-white/60">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-[10px] font-bold text-white">
              RB
            </span>
            <span>© {year} ReceiptBrain</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <Link href="/settings" className="hover:text-slate-900">
              Settings
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-900"
            >
              <GithubIcon size={14} /> GitHub
            </a>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <BrainIcon size={16} />
              </span>
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                ReceiptBrain
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-600">
              Track receipts and subscriptions in one place — from uploads you control, with no bank
              connection.
            </p>
            <p className="mt-4 text-xs text-slate-400">
              © {year} ReceiptBrain. All rights reserved.
            </p>
          </div>

          <FooterCol
            title="Product"
            links={[
              { href: '/#features', label: 'Features' },
              { href: '/#how-it-works', label: 'How it works' },
              { href: '/#faq', label: 'FAQ' },
              { href: '/sign-in', label: 'Sign in' },
            ]}
          />

          <FooterCol
            title="Trust"
            links={[
              { href: '/#security', label: 'Security' },
              { href: '/api/health', label: 'Status' },
            ]}
          />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {links.map((l) => (
          <li key={`${title}-${l.label}`}>
            <Link href={l.href} className="hover:text-slate-900">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
