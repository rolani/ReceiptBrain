import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { MarketingNav } from '@/components/MarketingNav';
import {
  ArrowRightIcon,
  BoltIcon,
  BrainIcon,
  CameraIcon,
  CheckIcon,
  CheckCircleIcon,
  InsightsIcon,
  LockIcon,
  PiggyBankIcon,
  ReceiptIcon,
  ShieldIcon,
  SparklesIcon,
  SubscriptionsIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from '@/components/ui/Icons';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <HowItWorks />
        <Showcase />
        <UseCases />
        <Pricing />
        <Testimonials />
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
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <SparklesIcon size={14} className="text-emerald-600" />
            AI-powered receipt intelligence
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Every receipt,{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
              decoded.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            Snap a photo, drop a PDF, or forward an email. ReceiptBrain extracts every line item,
            flags forgotten subscriptions, and surfaces the savings you&apos;re missing — without
            connecting your bank.
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
            <li className="flex items-center gap-1.5">
              <CheckIcon size={14} className="text-emerald-600" /> Cancel anytime
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
      <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <BrainIcon size={14} />
            </span>
            <span className="text-sm font-semibold text-slate-900">Dashboard</span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-200/80">
            Live
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <PreviewStat
            label="Spend 30d"
            value="$1,284"
            delta="-12%"
            tone="emerald"
            Icon={ReceiptIcon}
          />
          <PreviewStat
            label="Subs"
            value="14"
            delta="+2"
            tone="sky"
            Icon={SubscriptionsIcon}
          />
          <PreviewStat
            label="Savings"
            value="$219"
            delta="found"
            tone="violet"
            Icon={PiggyBankIcon}
          />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Spending trend
          </p>
          <PreviewChart />
        </div>

        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-start gap-2">
            <SparklesIcon size={16} className="mt-0.5 text-emerald-700" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Insight
              </p>
              <p className="mt-0.5 text-sm font-medium text-emerald-900">
                You&apos;re paying for Netflix twice — save $15.99/mo by cancelling the duplicate.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute -left-6 bottom-8 hidden rotate-[-4deg] rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:block"
      >
        <div className="flex items-center gap-2">
          <CameraIcon size={16} className="text-slate-500" />
          <p className="text-xs font-medium text-slate-700">Trader Joe&apos;s</p>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">12 items • $47.22</p>
      </div>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  delta,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  delta: string;
  tone: 'emerald' | 'sky' | 'violet';
  Icon: typeof ReceiptIcon;
}) {
  const tones = {
    emerald: 'text-emerald-600 bg-emerald-50 ring-emerald-200/80',
    sky: 'text-sky-600 bg-sky-50 ring-sky-200/80',
    violet: 'text-violet-600 bg-violet-50 ring-violet-200/80',
  } as const;
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-inset ${tones[tone]}`}
      >
        <Icon size={14} />
      </span>
      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-base font-semibold tabular-nums text-slate-900">{value}</p>
      <p className="text-[10px] font-medium text-slate-500">{delta}</p>
    </div>
  );
}

function PreviewChart() {
  // hand-crafted preview chart, not data-driven
  return (
    <svg viewBox="0 0 320 100" className="h-24 w-full">
      <defs>
        <linearGradient id="heroSpend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 80 L30 70 L60 55 L90 65 L120 50 L150 40 L180 45 L210 30 L240 35 L270 22 L300 28 L320 18 L320 100 L0 100 Z"
        fill="url(#heroSpend)"
      />
      <path
        d="M0 80 L30 70 L60 55 L90 65 L120 50 L150 40 L180 45 L210 30 L240 35 L270 22 L300 28 L320 18"
        fill="none"
        stroke="#10b981"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/60">
      <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-4 px-4 py-10 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
        <Stat value="$624" label="avg. saved per year" />
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
      <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function Features() {
  const items = [
    {
      Icon: CameraIcon,
      title: 'AI receipt extraction',
      description:
        'Snap a photo or upload PDFs. Every line item, tax, tip, and total — parsed automatically.',
      tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    },
    {
      Icon: SubscriptionsIcon,
      title: 'Subscription detection',
      description:
        'Recurring charges are clustered and confirmed across receipts — no bank login required.',
      tone: 'bg-sky-50 text-sky-700 ring-sky-200/70',
    },
    {
      Icon: SparklesIcon,
      title: 'Actionable insights',
      description:
        'Cheaper alternatives, spending spikes, and personalized optimization tips with estimated savings.',
      tone: 'bg-violet-50 text-violet-700 ring-violet-200/70',
    },
    {
      Icon: ShieldIcon,
      title: 'Privacy-first',
      description:
        'Receipt images live in a private bucket, served via short-lived signed URLs. No model training on your data.',
      tone: 'bg-amber-50 text-amber-700 ring-amber-200/70',
    },
    {
      Icon: TrendingUpIcon,
      title: 'Trends & charts',
      description:
        'See exactly where your dollars went — by day, category, and merchant. Beautiful built-in charts.',
      tone: 'bg-rose-50 text-rose-700 ring-rose-200/70',
    },
    {
      Icon: BoltIcon,
      title: 'Fast by design',
      description:
        'Async extraction with status polling — uploads never block. Heavy work runs out of the request path.',
      tone: 'bg-slate-100 text-slate-700 ring-slate-200/70',
    },
  ];

  return (
    <section id="features" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Features"
          title="Everything you need to take back control of subscriptions."
          description="ReceiptBrain replaces messy spreadsheets and forgotten subscriptions with a single, beautiful workspace."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${f.tone}`}
              >
                <f.Icon size={20} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      Icon: CameraIcon,
      title: 'Capture',
      description:
        'Drag a JPEG, PNG, HEIC, or PDF onto the upload zone — or snap a quick photo from your phone.',
    },
    {
      Icon: BrainIcon,
      title: 'Extract',
      description:
        'Our AI parses merchant, totals, items, and tax with confidence scores you can verify and correct.',
    },
    {
      Icon: InsightsIcon,
      title: 'Save',
      description:
        'Subscriptions are detected, savings opportunities surface, and you get a clean monthly view.',
    },
  ];

  return (
    <section id="how-it-works" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How it works"
          title="From paper pile to perfect overview in three steps."
          description="Designed to be useful from receipt #1 — no setup, no integrations, no spreadsheets."
        />
        <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                Step {i + 1}
              </span>
              <s.Icon size={28} className="text-slate-900" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <SectionEyebrow>Insights</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Find the money you didn&apos;t know you were losing.
          </h2>
          <p className="mt-4 text-base text-slate-600">
            ReceiptBrain compares your spending across receipts to flag recurring charges, sudden
            spikes, and cheaper alternatives — with an estimated savings amount next to every tip.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            <FeatureLi>Cluster recurring charges into confirmed subscriptions</FeatureLi>
            <FeatureLi>Catch &gt;20% week-over-week spending spikes automatically</FeatureLi>
            <FeatureLi>Get cheaper-alternative suggestions ranked by savings</FeatureLi>
            <FeatureLi>Dismiss, action, or snooze — your insights, your rules</FeatureLi>
          </ul>
        </div>

        <div className="space-y-4">
          <InsightPreview
            tone="emerald"
            type="Cheaper alternative"
            title="Switch coffee subscription to local roaster"
            description="Based on 6 recent purchases at $5.20 avg, a monthly subscription would save ~$24/mo."
            savings="$24/mo"
          />
          <InsightPreview
            tone="rose"
            type="Subscription waste"
            title="Duplicate Netflix on two accounts"
            description="We detected two separate Netflix charges from June. Cancelling one saves $15.99/mo."
            savings="$15.99/mo"
          />
          <InsightPreview
            tone="amber"
            type="Spending spike"
            title="Dining is up 38% vs last month"
            description="Your dining spend jumped from $182 to $251. Top contributor: weekend takeout."
            savings={null}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircleIcon size={18} className="mt-0.5 shrink-0 text-emerald-600" />
      <span>{children}</span>
    </li>
  );
}

function InsightPreview({
  tone,
  type,
  title,
  description,
  savings,
}: {
  tone: 'emerald' | 'rose' | 'amber';
  type: string;
  title: string;
  description: string;
  savings: string | null;
}) {
  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200/80',
  } as const;
  const Trend = tone === 'amber' ? TrendingUpIcon : TrendingDownIcon;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${toneMap[tone]}`}
        >
          {type}
        </span>
        {savings ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <Trend size={14} /> {savings}
          </span>
        ) : null}
      </div>
      <h4 className="mt-2 text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </article>
  );
}

function UseCases() {
  const cases = [
    {
      title: 'Households',
      description:
        'Track family spend, share subscriptions, and stop paying for streaming services nobody watches.',
      Icon: ReceiptIcon,
    },
    {
      title: 'Freelancers',
      description:
        'Capture business receipts, tag them by client, and export totals for taxes in minutes.',
      Icon: BoltIcon,
    },
    {
      title: 'Small business',
      description:
        'Monitor recurring SaaS spend across the team and kill duplicate tools before they renew.',
      Icon: SubscriptionsIcon,
    },
  ];

  return (
    <section id="use-cases" className="bg-slate-900 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionEyebrow tone="light">Use cases</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for anyone with too many subscriptions.
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Whether you&apos;re managing a household budget or wrangling SaaS at work, ReceiptBrain
            turns scattered charges into a single source of truth.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <c.Icon size={22} className="text-emerald-300" />
              <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple, honest pricing."
          description="Start free. Upgrade only when you outgrow it."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <PricingCard
            name="Free"
            price="$0"
            cadence="forever"
            description="Perfect for getting started."
            features={[
              'Up to 25 receipts / month',
              'Subscription detection',
              'Basic insights',
              'Mobile-friendly upload',
            ]}
            cta="Start for free"
          />
          <PricingCard
            name="Plus"
            price="$6"
            cadence="per month"
            description="For power users who want it all."
            features={[
              'Unlimited receipts',
              'Advanced insights & charts',
              'CSV / iCal export',
              'Priority extraction queue',
              'Email reminders before renewals',
            ]}
            cta="Start free trial"
            featured
          />
          <PricingCard
            name="Family"
            price="$10"
            cadence="per month"
            description="For households & small teams."
            features={[
              'Everything in Plus',
              'Up to 5 members',
              'Shared subscriptions',
              'Role-based access',
            ]}
            cta="Start free trial"
          />
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          All plans include privacy-first storage, signed URLs, and no model training on your data.
        </p>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  cadence,
  description,
  features,
  cta,
  featured,
}: {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        'relative flex flex-col rounded-2xl border p-7 shadow-sm',
        featured
          ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
          : 'border-slate-200 bg-white text-slate-900',
      ].join(' ')}
    >
      {featured ? (
        <span className="absolute -top-3 left-7 inline-flex items-center rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-900">
          Most popular
        </span>
      ) : null}
      <h3 className="text-base font-semibold">{name}</h3>
      <p className={`mt-1 text-sm ${featured ? 'text-slate-300' : 'text-slate-500'}`}>
        {description}
      </p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        <span className={featured ? 'text-sm text-slate-300' : 'text-sm text-slate-500'}>
          {cadence}
        </span>
      </div>
      <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckIcon
              size={16}
              className={featured ? 'mt-0.5 text-emerald-300' : 'mt-0.5 text-emerald-600'}
            />
            <span className={featured ? 'text-slate-100' : 'text-slate-700'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/sign-in"
        className={[
          'mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition',
          featured
            ? 'bg-white text-slate-900 hover:bg-slate-100'
            : 'bg-slate-900 text-white hover:bg-slate-800',
        ].join(' ')}
      >
        {cta} <ArrowRightIcon size={14} />
      </Link>
    </div>
  );
}

function Testimonials() {
  const items = [
    {
      quote:
        'I cancelled four subscriptions in the first week. ReceiptBrain pays for itself many times over.',
      name: 'Sarah M.',
      role: 'Designer',
    },
    {
      quote:
        'Forwarding receipts to ReceiptBrain replaced our entire spreadsheet. Tax time was finally painless.',
      name: 'James K.',
      role: 'Freelancer',
    },
    {
      quote:
        'We use it as the source of truth for SaaS at work. Found three duplicate tools the first month.',
      name: 'Michael T.',
      role: 'Product Manager',
    },
  ];

  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Loved by users"
          title="People who track smarter with ReceiptBrain."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <blockquote className="text-sm leading-relaxed text-slate-700">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {t.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const faqs = [
    {
      q: 'Do I have to connect my bank?',
      a: 'No. ReceiptBrain works entirely from receipts you upload — photos, PDFs, or screenshots. No bank or credit-card connections are required.',
    },
    {
      q: 'Where are my images stored?',
      a: 'In a private storage bucket, never publicly accessible. Images are streamed to you via short-lived signed URLs that expire in minutes.',
    },
    {
      q: 'Do you train AI on my receipts?',
      a: 'No. Your receipts are used solely to power your account. We never include user receipts in model training datasets.',
    },
    {
      q: 'What file types are supported?',
      a: 'JPEG, PNG, HEIC, and PDF up to the configured upload limit. We sniff MIME type and reject anything that does not match the allow-list.',
    },
    {
      q: 'Can I export my data?',
      a: 'Yes — CSV export is included in Plus and Family plans, and you can request a full account export at any time.',
    },
  ];

  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions." centered />
        <dl className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-base font-semibold text-slate-900 marker:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="security" className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Stop paying for subscriptions you forgot about.
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-300">
              Add your first receipt in under two minutes. No credit card. Cancel anytime.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Start for free <ArrowRightIcon size={16} />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See pricing
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TrustItem Icon={LockIcon} title="Private bucket" sub="Signed URLs only" />
            <TrustItem Icon={ShieldIcon} title="No bank login" sub="Receipt-based only" />
            <TrustItem Icon={CheckCircleIcon} title="No training" sub="On your data" />
            <TrustItem Icon={BoltIcon} title="Built for speed" sub="Async pipeline" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  Icon,
  title,
  sub,
}: {
  Icon: typeof LockIcon;
  title: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <Icon size={20} className="text-emerald-300" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-xs text-slate-300">{sub}</p>
    </div>
  );
}

function SectionEyebrow({
  children,
  tone = 'dark',
}: {
  children: React.ReactNode;
  tone?: 'dark' | 'light';
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider',
        tone === 'light'
          ? 'bg-white/10 text-emerald-300'
          : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
      ].join(' ')}
    >
      {children}
    </span>
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
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base text-slate-600">{description}</p> : null}
    </div>
  );
}
