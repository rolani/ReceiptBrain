'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@receiptbrain/ui';
import type { SettingsPayload } from '@/lib/settings-data';

const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP', 'AUD'] as const;
const COUNTRIES = [
  { code: '', label: 'Use server default' },
  { code: 'CA', label: 'Canada (CA)' },
  { code: 'US', label: 'United States (US)' },
  { code: 'GB', label: 'United Kingdom (GB)' },
  { code: 'AU', label: 'Australia (AU)' },
] as const;

interface AccountFormValues {
  name: string;
}

interface PreferencesFormValues {
  defaultCurrency: string;
  defaultLocation: string;
  defaultLocationCountry: string;
}

async function patchSettings(body: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.message ?? `Save failed (${res.status})`);
  }
}

export function AccountSettingsForm({
  initialName,
}: {
  initialName: string | null;
}) {
  const router = useRouter();
  const form = useForm<AccountFormValues>({
    defaultValues: { name: initialName ?? '' },
  });

  const save = useMutation({
    mutationFn: (values: AccountFormValues) =>
      patchSettings({ name: values.name.trim() }),
    onSuccess: () => router.refresh(),
  });

  return (
    <form
      className="mt-4 space-y-3 border-t border-slate-100 pt-4"
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
    >
      <label className="block text-sm">
        <span className="text-slate-600">Display name</span>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Your name"
          {...form.register('name', { required: true, maxLength: 120 })}
        />
      </label>
      {save.isError ? (
        <p className="text-sm text-red-600" role="alert">
          {save.error instanceof Error ? save.error.message : 'Could not save'}
        </p>
      ) : null}
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save name'}
      </Button>
    </form>
  );
}

export function InsightsPreferencesForm({
  preferences,
  serverDefaults,
}: {
  preferences: SettingsPayload['preferences'];
  serverDefaults: { currency: string; location: string; locationCountry: string | null };
}) {
  const router = useRouter();
  const form = useForm<PreferencesFormValues>({
    defaultValues: {
      defaultCurrency: preferences.defaultCurrency ?? '',
      defaultLocation: preferences.defaultLocation ?? '',
      defaultLocationCountry: preferences.defaultLocationCountry ?? '',
    },
  });

  const save = useMutation({
    mutationFn: (values: PreferencesFormValues) => {
      const defaultCurrency = values.defaultCurrency.trim() || null;
      const defaultLocation = values.defaultLocation.trim() || null;
      const country = values.defaultLocationCountry.trim();
      return patchSettings({
        defaultCurrency,
        defaultLocation,
        defaultLocationCountry: country ? country : null,
      });
    },
    onSuccess: () => router.refresh(),
  });

  const resetToServer = useMutation({
    mutationFn: () =>
      patchSettings({
        defaultCurrency: null,
        defaultLocation: null,
        defaultLocationCountry: null,
      }),
    onSuccess: () => router.refresh(),
  });

  return (
    <form
      className="mt-4 space-y-4 border-t border-slate-100 pt-4"
      onSubmit={form.handleSubmit((v) => save.mutate(v))}
    >
      <p className="text-xs text-slate-500">
        Effective today: {preferences.currency} · {preferences.location}
        {preferences.locationCountry ? ` (${preferences.locationCountry})` : ''}. Empty fields
        use server defaults ({serverDefaults.currency}, {serverDefaults.location}
        {serverDefaults.locationCountry ? `, ${serverDefaults.locationCountry}` : ''}).
      </p>

      <label className="block text-sm">
        <span className="text-slate-600">Default currency</span>
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          {...form.register('defaultCurrency')}
        >
          <option value="">Server default ({serverDefaults.currency})</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-slate-600">Location context</span>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder={serverDefaults.location}
          {...form.register('defaultLocation', { maxLength: 120 })}
        />
      </label>

      <label className="block text-sm">
        <span className="text-slate-600">Country</span>
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          {...form.register('defaultLocationCountry')}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code || 'default'} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {save.isError ? (
        <p className="text-sm text-red-600" role="alert">
          {save.error instanceof Error ? save.error.message : 'Could not save'}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save preferences'}
        </Button>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          disabled={resetToServer.isPending}
          onClick={() => resetToServer.mutate()}
        >
          {resetToServer.isPending ? 'Resetting…' : 'Reset to server defaults'}
        </button>
      </div>
    </form>
  );
}
