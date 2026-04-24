
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GitBranch, FileOutput, Upload, Cpu, Shapes, Bolt, ArrowRight, CheckCircle2, Sparkles, Layers, Zap, Map } from 'lucide-react';
import { Logo } from '../logo';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Shapes,
    title: 'Custom & Half-Tiles',
    description: 'Design pixel maps for non-rectangular LED walls. Add half-tiles to top, bottom, left, or right edges for any complex shape.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: GitBranch,
    title: 'Advanced Wiring',
    description: 'Visualize data and power wiring paths with serpentine, left-to-right, and custom patterns. Instantly see your routing.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Cpu,
    title: 'Processor Support',
    description: 'Optimize port assignments for Brompton, Novastar, and Helios video processors with automatic capacity calculations.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: FileOutput,
    title: 'Raster Map Generation',
    description: 'Create pixel-perfect raster maps for any media server. Export as a single image or slice by HD/4K resolution.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Bolt,
    title: 'Power & Data Calculator',
    description: 'Calculate exactly how many tiles fit on each power circuit and data port before overloading, for any voltage.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Upload,
    title: 'Project Import/Export',
    description: 'Save your entire configuration to a single file. Share with your team or pick up right where you left off.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
];

const tools = [
  { href: '/app', icon: Map, label: 'Pixel Map', desc: 'Design your LED layout' },
  { href: '/calculator', icon: Layers, label: 'LED Calculator', desc: 'Compute specs instantly' },
  { href: '/power-data', icon: Zap, label: 'Power & Data', desc: 'Circuit load analysis' },
];

const stats = [
  { value: '50+', label: 'LED Products' },
  { value: '∞', label: 'Screen Configs' },
  { value: '3', label: 'Processors Supported' },
  { value: '100%', label: 'Free to Use' },
];

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100svh-3.5rem)] flex items-center justify-center overflow-hidden">

        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.18),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,hsl(var(--accent)/0.12),transparent)]" />

        {/* Animated grid */}
        <div
          className="absolute inset-0 animate-grid-glow"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)/0.15) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary)/0.15) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Blobs */}
        <div className="absolute top-1/4 left-[8%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-blob pointer-events-none" />
        <div className="absolute bottom-1/4 right-[8%] w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute top-2/3 left-[40%] w-[300px] h-[300px] rounded-full bg-primary/8 blur-[80px] animate-blob animation-delay-4000 pointer-events-none" />

        {/* Ping dots */}
        <div className="absolute top-[15%] left-[12%] w-1.5 h-1.5 rounded-full bg-primary/60 animate-ping-slow pointer-events-none" />
        <div className="absolute top-[30%] right-[18%] w-1.5 h-1.5 rounded-full bg-accent/60 animate-ping-slow animation-delay-2000 pointer-events-none" />
        <div className="absolute bottom-[25%] left-[25%] w-1.5 h-1.5 rounded-full bg-primary/60 animate-ping-slow animation-delay-4000 pointer-events-none" />
        <div className="absolute bottom-[18%] right-[35%] w-1.5 h-1.5 rounded-full bg-accent/50 animate-ping-slow pointer-events-none" />

        {/* Scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-scan" />
        </div>

        {/* Content */}
        <div className="relative z-10 container px-4 md:px-8 flex flex-col items-center text-center gap-8 py-20">

          {/* Badge */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Professional LED Wall Tool — Free
            </span>
          </div>

          {/* Headline */}
          <div className="animate-fade-up animation-delay-100 space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
              LED Screen Mapping
              <br />
              <span className="text-shimmer">Engineered for Pros</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Design, document, and generate configurations for professional LED video walls —
              from initial layout to final export, all in your browser.
            </p>
          </div>

          {/* CTAs */}
          <div className="animate-fade-up animation-delay-200 flex flex-wrap gap-3 justify-center">
            <Link href="/app">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold glow-primary gap-2 group"
              >
                Open Pixel Mapper
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                Explore Features
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="animate-fade-up animation-delay-300 grid grid-cols-2 sm:grid-cols-4 gap-6 mt-4 w-full max-w-2xl">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-primary">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Quick-access tool cards */}
          <div className="animate-fade-up animation-delay-400 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl mt-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href}>
                  <div className="group relative flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/50 hover:bg-card/80 transition-all duration-200 cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-sm font-semibold leading-tight">{tool.label}</div>
                      <div className="text-xs text-muted-foreground">{tool.desc}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--primary)/0.06),transparent)]" />
        <div className="container px-4 md:px-8 relative z-10">

          {/* Section header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground font-medium">
              Everything you need
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Built for the way you work
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every tool in MapMyLED is designed around real LED production workflows.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={cn(
                    "group relative p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm",
                    "hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                    "transition-all duration-300 animate-fade-up",
                    `animation-delay-${(i % 3) * 100 + 100}`
                  )}
                >
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", f.bg)}>
                    <Icon className={cn("w-5 h-5", f.color)} />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>

                  {/* Subtle gradient glow on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.03] group-hover:to-accent/[0.03] transition-all duration-300 pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section className="py-20">
        <div className="container px-4 md:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 md:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,hsl(var(--primary)/0.12),transparent)] pointer-events-none" />
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <div className="flex justify-center gap-2">
                {[CheckCircle2, CheckCircle2, CheckCircle2].map((Icon, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                ))}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Ready to map your LED wall?
              </h2>
              <p className="text-muted-foreground text-lg">
                No account needed. Open the tools and start designing immediately.
              </p>
              <Link href="/app">
                <Button size="lg" className="h-12 px-10 text-base font-semibold gap-2 group glow-primary">
                  Start Mapping Now
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-10">
        <div className="container px-4 md:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Logo className="h-5 w-auto" />
              <span className="text-sm font-semibold">MapMyLED</span>
              <span className="text-xs text-muted-foreground ml-1">&copy; {new Date().getFullYear()}</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                { href: '/legal/terms', label: 'Terms' },
                { href: '/legal/privacy', label: 'Privacy' },
                { href: '/contact', label: 'Contact' },
                { href: '/admin/tracking', label: 'Admin' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
