import * as React from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
}
