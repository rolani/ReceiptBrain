import { prisma } from '@receiptbrain/lib';
import { resolveRecommendDefaults } from '@receiptbrain/lib/domain';
import { ALLOWED_UPLOAD_MIMES } from '@/lib/upload-validation';

export interface SettingsPayload {
  account: {
    email: string;
    name: string | null;
    memberSince: string;
    authProviders: string[];
  };
  workspace: {
    receipts: number;
    activeSubscriptions: number;
    insightsNew: number;
    insightsTotal: number;
  };
  preferences: {
    currency: string;
    location: string;
    locationCountry: string | null;
    /** Stored on user; null means use server default. */
    defaultCurrency: string | null;
    defaultLocation: string | null;
    defaultLocationCountry: string | null;
  };
  limits: {
    maxUploadMb: number;
    uploadFormats: string;
    uploadsPerHour: number;
    insightsGenerationsPerHour: number;
  };
}

const UPLOADS_PER_HOUR = 30;
const INSIGHTS_PER_HOUR = 10;

/** Human-readable list of accepted upload formats for settings UI. */
export function describeUploadFormats(
  mimes: readonly string[] = ALLOWED_UPLOAD_MIMES,
): string {
  const labels = new Set<string>();
  for (const mime of mimes) {
    if (mime === 'image/jpeg') labels.add('JPEG');
    else if (mime === 'image/png') labels.add('PNG');
    else if (mime === 'image/webp') labels.add('WebP');
    else if (mime === 'image/avif') labels.add('AVIF');
    else if (mime === 'image/heic' || mime === 'image/heif') labels.add('HEIC');
    else if (mime === 'image/tiff') labels.add('TIFF');
    else if (mime === 'image/gif') labels.add('GIF');
    else if (mime === 'application/pdf') labels.add('PDF');
  }
  return [...labels].join(', ');
}

export async function loadSettingsData(
  userId: string,
  config: {
    currency: string;
    location: string;
    locationCountry?: string | null;
    maxUploadMb: number;
  },
): Promise<SettingsPayload> {
  const [user, receipts, activeSubscriptions, insightsNew, insightsTotal] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        defaultCurrency: true,
        defaultLocation: true,
        defaultLocationCountry: true,
        accounts: { select: { provider: true } },
      },
    }),
    prisma.receipt.count({ where: { userId, deletedAt: null } }),
    prisma.subscription.count({ where: { userId, status: 'active' } }),
    prisma.insight.count({ where: { userId, status: 'new' } }),
    prisma.insight.count({ where: { userId } }),
  ]);

  if (!user?.email) {
    throw new Error('User not found');
  }

  const authProviders = [
    ...new Set(
      user.accounts.map((a) => (a.provider === 'google' ? 'Google' : a.provider)).filter(Boolean),
    ),
  ];
  if (authProviders.length === 0) authProviders.push('Email magic link');

  const resolved = resolveRecommendDefaults(user, {
    currency: config.currency,
    location: config.location,
    locationCountry: config.locationCountry ?? null,
  });

  return {
    account: {
      email: user.email,
      name: user.name,
      memberSince: user.createdAt.toISOString(),
      authProviders,
    },
    workspace: {
      receipts,
      activeSubscriptions,
      insightsNew,
      insightsTotal,
    },
    preferences: {
      currency: resolved.currency,
      location: resolved.location,
      locationCountry: resolved.locationCountry,
      defaultCurrency: user.defaultCurrency,
      defaultLocation: user.defaultLocation,
      defaultLocationCountry: user.defaultLocationCountry,
    },
    limits: {
      maxUploadMb: config.maxUploadMb,
      uploadFormats: describeUploadFormats(),
      uploadsPerHour: UPLOADS_PER_HOUR,
      insightsGenerationsPerHour: INSIGHTS_PER_HOUR,
    },
  };
}
