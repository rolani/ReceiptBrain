import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps({ size = 18, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  };
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-1.5V3z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function SubscriptionsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M21 12a9 9 0 0 1-15.36 6.36L3 16" />
      <path d="M3 12a9 9 0 0 1 15.36-6.36L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function InsightsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.73c.6.46 1 1.16 1 1.93V18h6v-1.34c0-.77.4-1.47 1-1.93A7 7 0 0 0 12 2z" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.22 16.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.08 4.22l.06.06a1.7 1.7 0 0 0 1.87.34h.01A1.7 1.7 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56h.01a1.7 1.7 0 0 0 1.86-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01A1.7 1.7 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03z" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m5.6 5.6 2.1 2.1" />
      <path d="m16.3 16.3 2.1 2.1" />
      <path d="m5.6 18.4 2.1-2.1" />
      <path d="m16.3 7.7 2.1-2.1" />
    </svg>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

export function TrendingDownIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m3 7 6 6 4-4 8 8" />
      <path d="M14 17h7v-7" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

export function PiggyBankIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M19 12c0 4-4 7-7 7s-7-3-7-7c0-3 2-6 7-6 1.8 0 3.2.4 4.3 1l1.7-1v3l1.6 1.4c.3.5.4 1 .4 1.6z" />
      <path d="M16 11h.01" />
      <path d="M2 9v3a2 2 0 0 0 2 2h1" />
      <path d="M9 5c0-1.5 1.5-3 3-3" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5L15.5 10" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function BrainIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 4a3 3 0 0 0-3 3v.5a3 3 0 0 0-3 3v1a3 3 0 0 0 .5 1.7A2.5 2.5 0 0 0 7 18a3 3 0 0 0 5 1 3 3 0 0 0 5-1 2.5 2.5 0 0 0 .5-4.8 3 3 0 0 0 .5-1.7v-1a3 3 0 0 0-3-3V7a3 3 0 0 0-3-3z" />
      <path d="M12 4v16" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" />
    </svg>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 2a10 10 0 0 0-3.16 19.5c.5.09.68-.21.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.46-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.54 2.34 1.1 2.91.84.1-.65.35-1.1.63-1.35-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-2 1.03-2.7-.1-.25-.45-1.29.1-2.68 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.39.2 2.43.1 2.68.64.7 1.03 1.6 1.03 2.7 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}
