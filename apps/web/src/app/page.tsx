import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { MarketingNav } from '@/components/MarketingNav';
import {
  ArrowRightIcon,
  BrainIcon,
  CameraIcon,
  CheckIcon,
  CheckCircleIcon,
  LockIcon,
  ReceiptIcon,
  ShieldIcon,
  SparklesIcon,
  SubscriptionsIcon,
} from '@/components/ui/Icons';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <Hero />
        <SocialProof />
        <Pillars />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-white"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[28rem] w-[64rem] -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl"
      />
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <SparklesIcon size={14} className="text-emerald-600" />
            Receipts first. Subscriptions surfaced.
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Every receipt tracked.{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
              Every subscription found.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            Upload a photo or PDF — we extract line items and totals from your receipts, then
            spot recurring charges so you can cancel what you forgot. No bank connection.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Start free <ArrowRightIcon size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              See how it works
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            <li className="flex items-center gap-1.5">
              <CheckIcon size={14} className="text-emerald-600" /> No credit card
            </li>
            <li className="flex items-center gap-1.5">
              <CheckIcon size={14} className="text-emerald-600" /> No bank connection
            </li>
          </ul>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-sky-100 via-white to-emerald-100 blur-2xl"
      />
      <div className="relative space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <ReceiptIcon size={14} />
              </span>
              <span className="text-sm font-semibold text-slate-900">Recent receipts</span>
            </div>
            <span className="text-xs font-medium text-slate-500">Last 30 days</span>
          </div>
          <ul className="mt-3 space-y-2">
            <ReceiptRow merchant="Trader Joe's" meta="12 items" amount="$47.22" />
            <ReceiptRow merchant="Amazon" meta="3 items" amount="$89.14" />
            <ReceiptRow merchant="Whole Foods" meta="8 items" amount="$62.08" />
          </ul>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5 shadow-lg shadow-sky-900/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white">
                <SubscriptionsIcon size={14} />
              </span>
              <span className="text-sm font-semibold text-slate-900">Active subscriptions</span>
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-sky-700 ring-1 ring-sky-200">
              14 active
            </span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <SubRow name="Netflix" amount="$15.99/mo" flagged />
            <SubRow name="Spotify" amount="$10.99/mo" />
            <SubRow name="iCloud+" amount="$2.99/mo" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({
  merchant,
  meta,
  amount,
}: {
  merchant: string;
  meta: string;
  amount: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{merchant}</p>
        <p className="text-[11px] text-slate-500">{meta}</p>
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{amount}</span>
    </li>
  );
}

function SubRow({
  name,
  amount,
  flagged,
}: {
  name: string;
  amount: string;
  flagged?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 ring-1 ring-sky-100">
      <span className="font-medium text-slate-900">{name}</span>
      <span className="flex items-center gap-2">
        {flagged ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">
            Duplicate?
          </span>
        ) : null}
        <span className="text-xs font-semibold tabular-nums text-slate-700">{amount}</span>
      </span>
    </li>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-6 px-4 py-8 text-center sm:grid-cols-3 sm:px-6 lg:px-8">
        <Stat value="2 min" label="to add your first receipt" />
        <Stat value="98%" label="extraction accuracy" />
        <Stat value="0" label="bank connections required" />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function Pillars() {
  return (
    <section id="features" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="What you get"
          title="Receipts are the source of truth. Subscriptions follow."
          description="Upload once — get structured spend data and a clear view of what's recurring."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PillarCard
            Icon={ReceiptIcon}
            tone="bg-emerald-50 text-emerald-700 ring-emerald-200/70"
            title="Receipt intelligence"
            points={[
              'Snap a photo or drop a PDF — JPEG, PNG, HEIC supported',
              'Merchant, line items, tax, and totals extracted automatically',
              'Search and review every purchase in one place',
            ]}
          />
          <PillarCard
            Icon={SubscriptionsIcon}
            tone="bg-sky-50 text-sky-700 ring-sky-200/70"
            title="Subscription tracking"
            points={[
              'Recurring charges clustered from your receipt history',
              'See monthly cost and what might be a duplicate',
              'No bank login — built entirely from receipts you upload',
            ]}
          />
        </div>
        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldIcon size={14} className="text-slate-400" /> Private storage, signed URLs only
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockIcon size={14} className="text-slate-400" /> No model training on your data
          </span>
        </p>
      </div>
    </section>
  );
}

function PillarCard({
  Icon,
  tone,
  title,
  points,
}: {
  Icon: typeof ReceiptIcon;
  tone: string;
  title: string;
  points: string[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${tone}`}
      >
        <Icon size={22} />
      </span>
      <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
            <CheckCircleIcon size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function HowItWorks() {
  const steps = [
    {
      Icon: CameraIcon,
      title: 'Upload receipts',
      description: 'Photo or PDF — we handle JPEG, PNG, HEIC, and PDF.',
    },
    {
      Icon: BrainIcon,
      title: 'Extract & organize',
      description: 'AI pulls merchant, items, and totals with confidence you can verify.',
    },
    {
      Icon: SubscriptionsIcon,
      title: 'Track subscriptions',
      description: 'Recurring charges surface automatically from your receipt history.',
    },
  ];

  return (
    <section id="how-it-works" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps. Receipts in, subscriptions out."
        />
        <ol className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Step {i + 1}
              </span>
              <s.Icon size={24} className="mt-3 text-slate-900" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    {
      q: 'Do I have to connect my bank?',
      a: 'No. ReceiptBrain works from receipts you upload. Subscriptions are inferred from your receipt history — no bank or card connections.',
    },
    {
      q: 'How are subscriptions detected?',
      a: 'We cluster recurring charges across your uploaded receipts and show them in a dedicated subscriptions view.',
    },
    {
      q: 'Is my data private?',
      a: 'Receipt images live in a private bucket with short-lived signed URLs. We do not train models on your receipts.',
    },
  ];

  return (
    <section id="faq" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Quick answers." centered />
        <dl className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white p-4 open:shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-900 marker:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section
      id="security"
      className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 py-16 text-white sm:py-20"
    >
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Start with one receipt. See every subscription.
        </h2>
        <p className="mt-4 text-base text-slate-300">
          Free to start. No credit card. Cancel anytime.
        </p>
        <Link
          href="/sign-in"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
        >
          Start for free <ArrowRightIcon size={16} />
        </Link>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  centered,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-700 ring-1 ring-inset ring-slate-200">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-base text-slate-600">{description}</p> : null}
    </div>
  );
}
