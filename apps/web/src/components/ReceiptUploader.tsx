'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

async function uploadFile(file: File): Promise<{ receiptId: string; deduped: boolean }> {
  const fd = new FormData();
  fd.set('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `Upload failed (${res.status})`);
  }
  return res.json();
}

export function ReceiptUploader() {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const router = useRouter();

  const m = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['receipts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/receipts/${data.receiptId}`);
    },
  });

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) m.mutate(f);
      }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        drag ? 'border-slate-900 bg-slate-50' : 'border-slate-300'
      }`}
    >
      <p className="text-sm font-medium text-slate-900">Drop a receipt image here</p>
      <p className="mt-1 text-xs text-slate-500">
        JPEG, PNG, WebP, AVIF, HEIC, TIFF, GIF, or PDF · max 10MB
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Choose file
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/tiff,image/gif,application/pdf,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.tif,.tiff,.gif,.pdf"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) m.mutate(f);
        }}
      />
      {m.isPending ? <p className="mt-4 text-sm text-slate-600">Uploading…</p> : null}
      {m.isError ? (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {String(m.error.message)}
        </p>
      ) : null}
    </div>
  );
}
