import Link from 'next/link';
import { SidebarNav } from './SidebarNav';
import { SparklesIcon } from './ui/Icons';

export function Sidebar() {
  return (
    <aside
      aria-label="Sidebar"
      className="hidden w-56 shrink-0 border-r border-slate-200/80 bg-white/80 backdrop-blur lg:block xl:w-64"
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col p-4">
        <div className="px-2 pb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        <SidebarNav />

        <div className="mt-auto pt-6">
          <Link
            href="/insights"
            className="block rounded-xl border border-dashed border-emerald-300/80 bg-emerald-50/60 p-4 transition hover:border-emerald-400 hover:bg-emerald-50"
          >
            <div className="flex items-center gap-2 text-emerald-700">
              <SparklesIcon size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Tip</span>
            </div>
            <p className="mt-2 text-xs leading-snug text-slate-700">
              Generate insights weekly to keep your spending in check.
            </p>
          </Link>
        </div>
      </div>
    </aside>
  );
}
