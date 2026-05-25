import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SettingsSections } from '@/components/SettingsSections';
import { PageHeader } from '@/components/ui/PageHeader';
import { env } from '@/env';
import { loadSettingsData } from '@/lib/settings-data';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const serverDefaults = {
    currency: env.DEFAULT_CURRENCY,
    location: env.DEFAULT_LOCATION,
    locationCountry: env.DEFAULT_LOCATION_COUNTRY ?? null,
  };

  const data = await loadSettingsData(session.user.id, {
    ...serverDefaults,
    maxUploadMb: env.MAX_UPLOAD_MB,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Account details, workspace summary, and preferences you can change."
      />
      <SettingsSections data={data} serverDefaults={serverDefaults} />
    </div>
  );
}
