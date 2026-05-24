import { ReceiptList } from '@/components/ReceiptList';
import { PageHeader, PrimaryLinkButton } from '@/components/ui/PageHeader';

export default function ReceiptsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Receipts"
        description="All uploaded receipts and extraction status."
        action={<PrimaryLinkButton href="/upload">Upload receipt</PrimaryLinkButton>}
      />
      <ReceiptList />
    </div>
  );
}
