import { ReceiptUploader } from '@/components/ReceiptUploader';

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Upload receipt</h1>
      <ReceiptUploader />
    </div>
  );
}
