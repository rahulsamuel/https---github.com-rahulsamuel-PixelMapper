'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bolt, Cpu, Download, GitBranch, Map, PackagePlus, Receipt, Server, Users, Zap } from 'lucide-react';
import { Logo } from '../logo';

const tools = [
  { href: '/app', label: 'Pixel Map', desc: 'Lay out the wall tile by tile, with custom shapes and half-tiles.' },
  { href: '/calculator', label: 'LED Calculator', desc: 'Tile count, size, and curving calculations for each screen.' },
  { href: '/power-data', label: 'Power & Data', desc: 'Tiles per circuit and per data port for your voltage and processor.' },
  { href: '/rack-drawing', label: 'Rack Drawing', desc: 'Front and rear rack elevations for fabrication and install.' },
  { href: '/signal-flow', label: 'Signal Flow', desc: 'Diagram how devices, processors, and cables connect.' },
  { href: '/pre-visual', label: 'Pre-Visual', desc: 'Preview the screen in context before the job is built.' },
];

const features = [
  { icon: Map, title: 'Custom layouts', description: 'Build walls of any shape, including curves, odd edges, and half-tiles.' },
  { icon: Cpu, title: 'Processor port assignment', description: 'Assign tiles to Brompton, Novastar, and Helios ports with capacity checks.' },
  { icon: GitBranch, title: 'Data and power wiring', description: 'Serpentine, row, and custom routing, shown on the map.' },
  { icon: Bolt, title: 'Load checks', description: 'See how many tiles fit on each circuit and each data port before the gear ships.' },
  { icon: Server, title: 'Rack drawings', description: 'Drag equipment onto front and rear racks and export PNG diagrams.' },
  { icon: Download, title: 'Exports', description: 'Raster maps for media servers and print-ready PDF deliverables.' },
  { icon: Users, title: 'Live collaboration', description: 'Invite teammates to edit the same project, with live cursors and sync.' },
  { icon: Receipt, title: 'Receipts', description: 'Every payment has a receipt in your account, with a PDF you can download.' },
];

const listingSteps = [
  'Add the product with its specs.',
  'Pay the listing fee at checkout.',
  'It appears in your LED product dropdowns in the pixel map, calculator, and power data tools.',
];

const workflow = [
  { title: 'Pick a product', description: 'Choose a tile from the library, or add your own.' },
  { title: 'Lay out the wall', description: 'Build the grid, remove tiles for custom shapes, and add half-tiles.' },
  { title: 'Set up wiring and power', description: 'Choose the processor, set data and power patterns, and check the loads.' },
  { title: 'Export', description: 'Download raster maps, wiring diagrams, and PDFs for the team.' },
];

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100svh-3.5rem)] bg-background text-foreground">
      <section className="border-b border-border">
        <div className="container px-4 md:px-8 py-20 lg:py-28 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <Logo className="h-8 w-auto" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.15]">
              Plan LED walls from pixel map to paperwork.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              MapMyLED is a browser tool for LED screen designers and integrators. Lay out the wall, check power and data loads, draw the racks, and export what the install team needs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/app">
                <Button size="lg" className="h-11 px-6 gap-2 group">
                  Open the pixel map
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="h-11 px-6">
                  See what it does
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              The tools work without an account. Sign in to save projects and add your own products.
            </p>
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {tools.map(tool => (
              <li key={tool.href}>
                <Link href={tool.href} className="group flex items-center gap-4 p-4 hover:bg-muted/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{tool.label}</div>
                    <div className="text-sm text-muted-foreground">{tool.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-24">
        <div className="container px-4 md:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">What is in the tools</h2>
            <p className="text-muted-foreground">The features most often used on a real LED install, in one place.</p>
          </div>
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="space-y-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t border-border bg-muted/30">
        <div className="container px-4 md:px-8 grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="space-y-5">
            <PackagePlus className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Add your own LED products</h2>
            <p className="text-muted-foreground leading-relaxed">
              If a tile is not in the library, add it yourself. Products you add are only visible to you, so they stay out of everyone else&apos;s dropdowns.
            </p>
            <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5">
              {listingSteps.map(step => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <Link href="/add-led">
              <Button variant="outline" className="gap-2 group">
                Add an LED product
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="text-sm text-muted-foreground">Listing fee</div>
            <div className="text-4xl font-bold tracking-tight">$2.99 <span className="text-base font-medium text-muted-foreground">per product</span></div>
            <p className="text-sm text-muted-foreground">
              Card processing is added at checkout. For one product, the total is about $3.40. You get a receipt for every payment, with a PDF download.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t border-border">
        <div className="container px-4 md:px-8 space-y-12">
          <h2 className="text-3xl font-bold tracking-tight">How a project comes together</h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step, i) => (
              <div key={step.title} className="space-y-2">
                <div className="text-sm font-mono text-muted-foreground">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 border-t border-border">
        <div className="container px-4 md:px-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Start with a blank wall</h2>
            <p className="text-muted-foreground">Open the pixel map and start laying out your screen.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/app">
              <Button size="lg" className="h-11 px-6">Open the pixel map</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 px-6">Create an account</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="container px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-6 w-auto" />
            <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()}</span>
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
          </nav>
        </div>
      </footer>
    </div>
  );
}
