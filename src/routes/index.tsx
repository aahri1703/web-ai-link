import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  Braces,
  Database,
  FileCheck2,
  FileText,
  Globe,
  ImageIcon,
  Plug,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import heroNetwork from "@/assets/hero-network.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConnectAI — Connect Your Website to AI" },
      {
        name: "description",
        content:
          "ConnectAI links your website to APIs, databases, analytics and AI services with secure, real-time integrations — no stack rebuild required.",
      },
      { property: "og:title", content: "ConnectAI — Connect Your Website to AI" },
      {
        property: "og:description",
        content:
          "Power your website with intelligent AI integrations — without rebuilding your entire stack.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Integrations", href: "#integrations" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Pricing", href: "#pricing" },
  { label: "Documentation", href: "#docs" },
];

const features = [
  {
    icon: Plug,
    title: "Easy Integration",
    copy: "Connect existing websites with minimal setup. Drop in a single snippet and you are live.",
  },
  {
    icon: Workflow,
    title: "Smart Connections",
    copy: "Link websites to APIs, databases and AI services through one orchestration layer.",
  },
  {
    icon: Activity,
    title: "Real-Time Data",
    copy: "Keep every connected system synchronized with event streams and instant propagation.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Design",
    copy: "Modern authentication, scoped keys and encrypted transport on every connection.",
  },
];

const steps = [
  {
    num: "01",
    title: "Connect",
    copy: "Enter your website or choose an integration from the catalog.",
  },
  {
    num: "02",
    title: "Configure",
    copy: "Choose what services and data your website should connect to.",
  },
  {
    num: "03",
    title: "Launch",
    copy: "Activate the connection and start using your integrated website.",
  },
];

const integrations = [
  { icon: Globe, name: "Websites", meta: "CMS · Storefronts · Docs" },
  { icon: Braces, name: "APIs", meta: "REST · GraphQL · Webhooks" },
  { icon: Database, name: "Databases", meta: "Postgres · Mongo · Vector" },
  { icon: BarChart3, name: "Analytics", meta: "Events · Funnels · Logs" },
  { icon: Users, name: "CRM", meta: "Contacts · Pipelines" },
  { icon: Sparkles, name: "AI Services", meta: "LLMs · Embeddings · Vision" },
  { icon: Zap, name: "Automation", meta: "Triggers · Jobs · Flows" },
  { icon: Boxes, name: "Custom Nodes", meta: "Bring your own service" },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] grid-backdrop" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-primary/25 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-[520px] -right-32 h-[460px] w-[460px] rounded-full bg-violet/20 blur-[150px]" />
      <div className="pointer-events-none absolute top-[1200px] -left-32 h-[420px] w-[420px] rounded-full bg-cyan/15 blur-[150px]" />

      <Nav />

      <main className="relative">
        <Hero />
        <Features />
        <HowItWorks />
        <Pipeline />
        <Integrations />
        <ClosingCta />
      </main>

      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-brand)] shadow-[var(--glow-soft)]">
            <Plug className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.4} />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight">
            Connect<span className="text-gradient">AI</span>
          </span>
        </a>

        <div className="flex items-center gap-1">
          <ul className="mr-2 hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            to="/studio"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[image:var(--gradient-brand)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--glow-brand)] transition-transform duration-300 hover:scale-[1.03]"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative mx-auto max-w-7xl px-5 pt-16 pb-20 lg:px-8 lg:pt-24">
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_12px_var(--cyan)]" />
            AI infrastructure for the modern web
          </span>

          <h1 className="mt-6 text-4xl leading-[1.05] font-extrabold sm:text-5xl lg:text-6xl">
            Connect Your Website <br className="hidden sm:block" />
            to <span className="text-gradient">AI.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Power your website with intelligent AI integrations — without rebuilding your entire
            stack.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/studio"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--glow-brand)] transition-transform duration-300 hover:scale-[1.03]"
            >
              Connect Your Website
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href="#integrations"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-glass px-6 py-3.5 text-sm font-semibold backdrop-blur-md transition-colors duration-300 hover:border-primary/50 hover:bg-secondary/50"
            >
              Explore Integrations
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-border/60 pt-8">
            {[
              ["120+", "Integrations"],
              ["18ms", "Median sync"],
              ["99.99%", "Uptime"],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="font-display text-xl font-bold sm:text-2xl">{v}</dt>
                <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{k}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-float">
          <div className="absolute inset-6 rounded-[2rem] bg-[image:var(--gradient-brand)] opacity-30 blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border/80 glass-panel">
            <img
              src={heroNetwork}
              alt="A website connected by glowing lines to databases, APIs, analytics and AI services"
              width={1408}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: React.ReactNode;
  copy: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold tracking-[0.22em] text-cyan uppercase">{eyebrow}</span>
      <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{copy}</p>
    </div>
  );
}

function Features() {
  return (
    <section id="product" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <SectionHead
        eyebrow="Platform"
        title={<>Infrastructure that connects everything</>}
        copy="A single connectivity layer between your website and the services that make it intelligent."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <article key={f.title} className="glass-panel rounded-2xl p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-secondary/60">
              <f.icon className="h-5 w-5 text-cyan" strokeWidth={1.8} />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <SectionHead
        eyebrow="How it works"
        title={<>Live in three steps</>}
        copy="From first connection to production traffic, without touching your existing architecture."
      />

      <div className="relative mt-14">
        <div className="pointer-events-none absolute top-16 right-8 left-8 hidden h-px bg-[image:var(--gradient-brand)] opacity-40 lg:block" />
        <div className="grid gap-5 lg:grid-cols-3">
          {steps.map((s) => (
            <article key={s.num} className="glass-panel relative rounded-2xl p-7">
              <span className="font-display text-4xl font-extrabold text-gradient">{s.num}</span>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{s.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const flows = [
  {
    name: "Design flow",
    icon: ImageIcon,
    accent: "border-orange-400/40 bg-orange-500/10",
    iconCls: "text-orange-300",
    steps: [
      ["Parse prompt", "Intent, size, style"],
      ["Gemini image model", "Prompt to design image"],
      ["Print-ready file", "Resize, convert to PDF"],
    ],
    cta: { to: "/studio", label: "Open design chat" },
  },
  {
    name: "Mock paper flow",
    icon: FileText,
    accent: "border-violet/40 bg-violet/10",
    iconCls: "text-violet",
    steps: [
      ["Upload material", "Worksheets, past papers"],
      ["Gemini text model", "Blueprint, questions, answers"],
      ["Verify and render", "Marks check, HTML to PDF"],
    ],
    cta: { to: "/studio/papers", label: "Build a mock paper" },
  },
] as const;

function Pipeline() {
  return (
    <section id="pipeline" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <SectionHead
        eyebrow="Pipeline"
        title={<>From a student's prompt to paper in hand</>}
        copy="One chatbot, one FastAPI backend, two AI flows — and every result lands in a confirmed, page-limited print queue."
      />

      <div className="mx-auto mt-14 flex max-w-4xl flex-col items-center">
        <PipeNode title="Student chatbot" sub="Studio frontend" />
        <span className="h-8 w-px bg-border" />
        <PipeNode title="FastAPI backend" sub="Routes and orchestrates requests" />
        <span className="h-8 w-px bg-border" />

        <div className="grid w-full gap-5 md:grid-cols-2">
          {flows.map((f) => (
            <div key={f.name} className="rounded-2xl border border-dashed border-border p-5">
              <h3 className="flex items-center justify-center gap-2 font-display font-semibold">
                <f.icon className={`h-4 w-4 ${f.iconCls}`} /> {f.name}
              </h3>
              <ol className="mt-4 space-y-2">
                {f.steps.map(([t, d], i) => (
                  <li key={t} className="flex flex-col items-center">
                    {i > 0 && <span className="h-3 w-px bg-border" />}
                    <div className={`w-full rounded-xl border px-4 py-3 text-center ${f.accent}`}>
                      <p className="text-sm font-semibold">{t}</p>
                      <p className="text-xs text-muted-foreground">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                to={f.cta.to}
                className="mt-4 flex items-center justify-center gap-1.5 text-sm text-cyan hover:underline"
              >
                {f.cta.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <span className="h-8 w-px bg-border" />
        <PipeNode title="Print queue" sub="Confirm, page limit" icon={FileCheck2} />
        <span className="h-8 w-px bg-border" />
        <PipeNode
          title="Printer"
          sub="Any printer the student's device uses — Wi-Fi, USB, Bluetooth"
          icon={Printer}
        />
      </div>
    </section>
  );
}

function PipeNode({
  title,
  sub,
  icon: Icon,
}: {
  title: string;
  sub: string;
  icon?: typeof Printer;
}) {
  return (
    <div className="glass-panel flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl px-5 py-4 text-center">
      {Icon && <Icon className="h-4 w-4 shrink-0 text-cyan" />}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function Integrations() {
  return (
    <section id="integrations" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <SectionHead
        eyebrow="Integrations"
        title={<>One hub, every system</>}
        copy="Wire your website into the tools you already run — and the AI services you are adding next."
      />

      <div className="relative mt-14">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="wire" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--electric)" />
              <stop offset="50%" stopColor="var(--violet)" />
              <stop offset="100%" stopColor="var(--cyan)" />
            </linearGradient>
          </defs>
          {[
            "M 12 20 C 40 20, 60 50, 88 50",
            "M 12 80 C 40 80, 60 50, 88 50",
            "M 50 8 C 50 40, 60 60, 88 82",
            "M 12 50 C 40 50, 60 88, 88 18",
          ].map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="url(#wire)"
              strokeWidth="0.25"
              strokeDasharray="3 4"
              className="animate-dash"
            />
          ))}
        </svg>

        <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {integrations.map((i) => (
            <article key={i.name} className="glass-panel flex items-center gap-4 rounded-2xl p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-secondary/60">
                <i.icon className="h-5 w-5 text-foreground" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">{i.name}</h3>
                <p className="truncate text-xs text-muted-foreground">{i.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section id="cta" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <div className="glass-panel relative overflow-hidden rounded-[2rem] px-6 py-20 text-center sm:px-16">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/30 blur-[110px] animate-pulse-glow" />
        <h2 className="relative text-3xl font-bold sm:text-5xl">
          Your website. <span className="text-gradient">Connected to everything.</span>
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-sm text-muted-foreground sm:text-base">
          Build smarter digital experiences without the complexity.
        </p>
        <Link
          to="/studio"
          className="group relative mt-10 inline-flex items-center gap-2 rounded-xl bg-[image:var(--gradient-brand)] px-7 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--glow-brand)] transition-transform duration-300 hover:scale-[1.03]"
        >
          Start Connecting
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="docs" className="relative border-t border-border/60">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-8 lg:px-8">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          © {new Date().getFullYear()} ConnectAI — AI connectivity infrastructure.
        </p>
        <div className="flex shrink-0 gap-4 text-sm text-muted-foreground">
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#docs" className="transition-colors hover:text-foreground">
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
