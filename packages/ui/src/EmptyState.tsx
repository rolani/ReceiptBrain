import * as React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps): React.ReactElement {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-12 text-center"
    >
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
