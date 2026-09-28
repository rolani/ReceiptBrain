import Link from 'next/link';
import { ArrowRightIcon, ReceiptIcon } from './ui/Icons';

export function ReceiptDetailFooter() {
  return (
    <div className="flex justify-center border-t border-slate-200 pt-6">
      <Link
        href="/receipts"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
      >
        <ReceiptIcon size={16} className="text-slate-500" />
        Back to receipts
        <ArrowRightIcon size={14} className="rotate-180 text-slate-400" />
      </Link>
    </div>
  );
}
