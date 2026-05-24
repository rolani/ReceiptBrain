'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, SVGProps } from 'react';
import {
  DashboardIcon,
  ReceiptIcon,
  UploadIcon,
  SubscriptionsIcon,
  InsightsIcon,
  SettingsIcon,
} from './ui/Icons';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const LINKS: ReadonlyArray<{ href: string; label: string; Icon: IconComponent }> = [
  { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/receipts', label: 'Receipts', Icon: ReceiptIcon },
  { href: '/upload', label: 'Upload', Icon: UploadIcon },
  { href: '/subscriptions', label: 'Subscriptions', Icon: SubscriptionsIcon },
  { href: '/insights', label: 'Insights', Icon: InsightsIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
      {LINKS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              size={18}
              className={
                active
                  ? 'text-white'
                  : 'text-slate-400 transition-colors group-hover:text-slate-700'
              }
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
