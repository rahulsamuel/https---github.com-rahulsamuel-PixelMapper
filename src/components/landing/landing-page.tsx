
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AdminLoginModal } from '@/components/admin/admin-login-modal';
import { useAuth } from '@/contexts/auth-context';
import {
  GitBranch, FileOutput, Upload, Cpu, Shapes, Bolt,
  ArrowRight, CheckCircle2, Sparkles, Layers, Zap, Map,
  Palette, Download, LayoutGrid, ScanLine, MonitorPlay,
  ChevronRight, Users, Star, Shield,
} from 'lucide-react';
import { Logo } from '../logo';
import { cn } from '@/lib/utils';

/* ─── Data ─── */

const features = [
  {
    icon: Shapes,
    title: 'Custom & Half-Tiles',
    description: 'Build pixel maps for any shape — non-rectangular walls, curved surfaces, and odd configurations. Half-tiles on any edge.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    tag: 'Layout',
  },
  {
    icon: GitBranch,
    title: 'Advanced Wiring Paths',
    description: 'Visualize data and power wiring with serpentine, left-to-right, top-down, and fully custom routing patterns.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    tag: 'Wiring',
  },
  {
    icon: Cpu,
    title: 'Processor Port Assignment',
    description: 'Auto-assign LED tiles to ports on Brompton, Novastar, and Helios processors with capacity validation.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    tag: 'Hardware',
  },
  {
    icon: FileOutput,
    title: 'Raster Map Export',
    description: 'Generate pixel-perfect raster maps for any media server — export as full image or sliced by HD, 2K, or 4K resolution.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    tag: 'Export',
  },
  {
    icon: Bolt,
    title: 'Power & Data Calculator',
    description: 'Know exactly how many tiles fit per circuit and per data port — for any voltage, phase, or processor model.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    tag: 'Calculator',
  },
  {
    icon: Upload,
    title: 'Project Save & Share',
    description: 'Export your entire project as a single JSON file. Import on any device, share with your team, or archive for later.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    tag: 'Workflow',
  },
  {
    icon: Palette,
    title: 'Tile Colour Coding',
    description: 'Colour-code individual tiles to represent zones, groups, or physical cabinet regions for clear documentation.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    tag: 'Layout',
  },
  {
    icon: Download,
    title: 'Print-Ready Deliverables',
    description: 'Generate branded PDF deliverables with wiring diagrams, port maps, and power schedules in one click.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    tag: 'Export',
  },
  {
    icon: LayoutGrid,
    title: 'Multi-Screen Projects',
    description: 'Manage multiple screens within a single project — each with its own dimensions, wiring, and settings.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    tag: 'Workflow',
  },
];

const tools = [
  { href: '/app',          icon: Map,    label: 'Pixel Map',       desc: 'Design your LED layout' },
  { href: '/calculator',   icon: Layers, label: 'LED Calculator',  desc: 'Compute specs instantly' },
  { href: '/power-data',   icon: Zap,    label: 'Power & Data',    desc: 'Circuit load analysis' },
];

const stats = [
  { value: '50+',  label: 'LED Products' },
  { value: '∞',    label: 'Screen Configs' },
  { value: '3',    label: 'Processors' },
  { value: '100%', label: 'Free to Use' },
];

const howItWorks = [
  {
    step: '01',
    title: 'Choose your LED product',
    description: 'Select from a library of real manufacturer tiles or add your own with custom specs.',
    icon: Layers,
  },
  {
    step: '02',
    title: 'Design your layout',
    description: 'Drag to build the grid, delete tiles for custom shapes, and add half-tiles for odd edges.',
    icon: LayoutGrid,
  },
  {
    step: '03',
    title: 'Configure wiring',
    description: 'Assign data and power wiring patterns, choose your processor, and validate port loads.',
    icon: GitBranch,
  },
  {
    step: '04',
    title: 'Export deliverables',
    description: 'Generate raster maps, wiring diagrams, and print-ready PDFs for your entire team.',
    icon: Download,
  },
];

const testimonials = [
  {
    quote: "MapMyLED cut our pre-production documentation time in half. The raster map export alone saves us hours per show.",
    author: "Alex R.",
    role: "LED Technician, Live Events",
  },
  {
    quote: "Finally a browser-based tool that actually understands how LED processors work. The port assignment is spot on.",
    author: "Sam K.",
    role: "Video Systems Engineer",
  },
  {
    quote: "I use it for every quote I send — the power calculator gives clients exact circuit requirements before we even spec the job.",
    author: "Jordan M.",
    role: "AV Integrations Specialist",
  },
];

/* ─── Component ─── */

export function LandingPage() {
  const { isAdmin } = useAuth();
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-[calc(100svh-3.5rem)] bg-background text-foreground overflow-x-hidden">
      <AdminLoginModal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[calc(100svh-3.5rem)] flex items-center justify-center overflow-hidden">
        {/* BG layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.18),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,hsl(var(--accent)/0.12),transparent)]" />

        {/* Grid */}
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

        {/* Ping dots */}
        {[
          'top-[15%] left-[12%]', 'top-[30%] right-[18%] animation-delay-2000',
          'bottom-[25%] left-[25%] animation-delay-4000', 'bottom-[18%] right-[35%]',
        ].map((pos, i) => (
          <div key={i} className={cn('absolute w-1.5 h-1.5 rounded-full bg-primary/60 animate-ping-slow pointer-events-none', pos)} />
        ))}

        {/* Scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-primary/25 to-transparent animate-scan" />
        </div>

        {/* Content */}
        <div className="relative z-10 container px-4 md:px-8 flex flex-col items-center text-center gap-8 py-20">
          {/* Badge */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Professional LED Wall Tool — 100% Free
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
              Design pixel maps, calculate power loads, configure data wiring, and generate
              print-ready deliverables — all in your browser, all for free.
            </p>
          </div>

          {/* CTAs */}
          <div className="animate-fade-up animation-delay-200 flex flex-wrap gap-3 justify-center">
            <Link href="/app">
              <Button size="lg" className="h-12 px-8 text-base font-semibold glow-primary gap-2 group">
                Open Pixel Mapper
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                See All Features
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-up animation-delay-300 grid grid-cols-2 sm:grid-cols-4 gap-6 mt-2 w-full max-w-2xl">
            {stats.map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-primary">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Quick-access tool cards */}
          <div className="animate-fade-up animation-delay-400 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl mt-2">
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href}>
                  <div className="group flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm hover:border-primary/50 hover:bg-card/80 transition-all duration-200 cursor-pointer">
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

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="py-24 lg:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.06),transparent)]" />
        <div className="container px-4 md:px-8 relative z-10">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground font-medium">
              Simple workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">From blank screen to full documentation</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              MapMyLED guides you from an empty canvas to export-ready project docs in four steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className={cn('relative animate-fade-up', `animation-delay-${i * 100 + 100}`)}>
                  {/* Connector line */}
                  {i < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-[calc(100%_-_12px)] w-[calc(100%_-_24px)] h-[1px] bg-gradient-to-r from-border to-transparent z-0" />
                  )}
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-2xl font-bold text-primary/30 font-mono">{step.step}</span>
                    </div>
                    <h3 className="font-semibold text-base">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" className="py-24 lg:py-32 relative border-t border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--primary)/0.05),transparent)]" />
        <div className="container px-4 md:px-8 relative z-10">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground font-medium">
              Feature set
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">Built for the way you work</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every tool was designed around real LED production workflows — nothing extra, nothing missing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={cn(
                    'group relative p-6 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm',
                    'hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1',
                    'transition-all duration-300 animate-fade-up',
                    `animation-delay-${(i % 3) * 100 + 100}`
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', f.bg)}>
                      <Icon className={cn('w-5 h-5', f.color)} />
                    </div>
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full', f.bg, f.color)}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/[0.02] group-hover:to-accent/[0.02] transition-all duration-300 pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TOOLS DEEP-DIVE ═══════════════════ */}
      <section className="py-24 lg:py-32 border-t border-border/30">
        <div className="container px-4 md:px-8">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground font-medium">
              The tools
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Four tools, one platform</h2>
          </div>

          <div className="space-y-16 max-w-5xl mx-auto">
            {/* Pixel Map */}
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Map className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold">Pixel Map Designer</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The core of MapMyLED. Build your LED wall tile-by-tile, assign wiring patterns, colour-code
                  zones, and see your complete layout at a glance. Supports rectangular and non-rectangular walls
                  with half-tile edges.
                </p>
                <ul className="space-y-2">
                  {['Multi-screen project management', 'Serpentine & custom data wiring', 'Power circuit visualisation', 'Raster map & PDF export'].map(t => (
                    <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/app">
                  <Button variant="outline" className="gap-2 group mt-2">
                    Open Pixel Map <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-3">
                {[
                  { label: 'Resolution', value: '3840 × 2160 px' },
                  { label: 'Tile count', value: '192 tiles' },
                  { label: 'Data ports', value: '4 × Brompton' },
                  { label: 'Power circuits', value: '16 × 20A' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <span className="text-sm text-muted-foreground">{r.label}</span>
                    <span className="text-sm font-mono font-semibold text-primary">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Power & Data */}
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-6 lg:order-first space-y-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Power per tile</div>
                  <div className="text-4xl font-bold text-orange-400">280 W</div>
                  <div className="text-sm text-muted-foreground">Max draw at 208V / 3-phase</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tiles per circuit', value: '6' },
                    { label: 'Tiles per port', value: '48' },
                    { label: 'Total circuits', value: '32' },
                    { label: 'Total ports', value: '4' },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-muted/40 p-3 text-center">
                      <div className="text-xl font-bold text-foreground">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold">Power & Data Calculator</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Select your LED product and processor, set your circuit voltage and amperage,
                  and instantly see how many tiles are safe per circuit and per data port.
                  Prevents overloads before the gear is even shipped.
                </p>
                <ul className="space-y-2">
                  {['110V / 208V / 230V support', 'Single and three-phase', 'Brompton, Novastar, Helios', 'Configurable safety margins'].map(t => (
                    <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/power-data">
                  <Button variant="outline" className="gap-2 group mt-2">
                    Open Calculator <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section className="py-24 lg:py-32 border-t border-border/30 bg-muted/20">
        <div className="container px-4 md:px-8">
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground font-medium">
              <Users className="w-3.5 h-3.5" />
              From the community
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Used by LED professionals</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4 animate-fade-up',
                  `animation-delay-${i * 100 + 100}`
                )}
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                <div>
                  <div className="text-sm font-semibold">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA BAND ═══════════════════ */}
      <section className="py-20 border-t border-border/30">
        <div className="container px-4 md:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 md:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,hsl(var(--primary)/0.12),transparent)] pointer-events-none" />
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/8 text-primary text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                No account required to use the tools
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Ready to map your LED wall?
              </h2>
              <p className="text-muted-foreground text-lg">
                Open the tools and start designing immediately. Create a free account to save and share your projects.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/app">
                  <Button size="lg" className="h-12 px-10 text-base font-semibold gap-2 group glow-primary">
                    Start Mapping Now
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    Create Free Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
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
              ].map(l => (
                <Link key={l.href} href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {l.label}
                </Link>
              ))}
              {isAdmin ? (
                <Link href="/admin/tracking" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Admin
                </Link>
              ) : (
                <button
                  onClick={() => setAdminModalOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </button>
              )}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
