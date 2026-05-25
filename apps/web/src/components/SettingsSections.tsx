import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SettingsPayload } from '@/lib/settings-data';
import { AccountSettingsForm, InsightsPreferencesForm } from '@/components/SettingsForm';

function SettingsCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={['rounded-lg border border-slate-200 bg-white p-6 shadow-sm', className]
        .filter(Boolean)
        .join(' ')}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 sm:text-right">{value}</dd>
    </div>
  );
}

function formatMemberSince(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
  }).format(new Date(iso));
}

export function SettingsSections({
  data,
  serverDefaults,
}: {
  data: SettingsPayload;
  serverDefaults: { currency: string; location: string; locationCountry: string | null };
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SettingsCard
        title="Account"
        description="How you sign in and your workspace identity."
      >
        <dl>
          <Row label="Email" value={data.account.email} />
          <Row label="Display name" value={data.account.name ?? '—'} />
          <Row label="Member since" value={formatMemberSince(data.account.memberSince)} />
          <Row label="Sign-in methods" value={data.account.authProviders.join(', ')} />
        </dl>
        <AccountSettingsForm initialName={data.account.name} />
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/api/auth/signout"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign out
          </Link>
        </div>
      </SettingsCard>

      <SettingsCard title="Workspace" description="A snapshot of your ReceiptBrain data.">
        <dl>
          <Row
            label="Receipts"
            value={
              <Link href="/receipts" className="text-sky-700 hover:underline">
                {data.workspace.receipts}
              </Link>
            }
          />
          <Row
            label="Active subscriptions"
            value={
              <Link href="/subscriptions" className="text-sky-700 hover:underline">
                {data.workspace.activeSubscriptions}
              </Link>
            }
          />
          <Row
            label="New insights"
            value={
              <Link href="/insights" className="text-sky-700 hover:underline">
                {data.workspace.insightsNew}
              </Link>
            }
          />
          <Row label="Total insights" value={data.workspace.insightsTotal} />
        </dl>
      </SettingsCard>

      <SettingsCard
        title="Insights preferences"
        description="Currency and location used when generating recommendations."
        className="lg:col-span-2"
      >
        <InsightsPreferencesForm preferences={data.preferences} serverDefaults={serverDefaults} />
      </SettingsCard>

      <SettingsCard title="Uploads & limits" description="Receipt upload rules for your account.">
        <dl>
          <Row label="Max file size" value={`${data.limits.maxUploadMb} MB`} />
          <Row label="Allowed formats" value={data.limits.uploadFormats} />
          <Row label="Upload rate limit" value={`${data.limits.uploadsPerHour} per hour`} />
          <Row
            label="Generate insights limit"
            value={`${data.limits.insightsGenerationsPerHour} per hour`}
          />
        </dl>
        <Link
          href="/upload"
          className="mt-4 inline-flex text-sm font-medium text-sky-700 hover:underline"
        >
          Upload a receipt →
        </Link>
      </SettingsCard>
    </div>
  );
}
