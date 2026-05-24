import { prisma } from '@receiptbrain/lib';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { EmptyState } from '@receiptbrain/ui';
import { SubscriptionCard } from '@/components/SubscriptionCard';

export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session?.user) redirect('/sign-in');

  const rows = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: { merchant: true },
    orderBy: { lastCharge: 'desc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
      {rows.length === 0 ? (
        <EmptyState
          title="No subscriptions detected yet"
          description="Once you upload a few recurring charges we'll find them automatically."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((s) => (
            <SubscriptionCard
              key={s.id}
              id={s.id}
              merchant={s.merchant.canonicalName}
              amount={s.amount.toFixed(2)}
              currency={s.currency}
              interval={s.interval}
              nextChargeEstimate={s.nextChargeEstimate?.toISOString() ?? null}
              confidence={s.confidence}
              status={s.status}
              sourceReceiptIds={s.sourceReceiptIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
