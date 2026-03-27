
'use server';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, FileOutput, Download, Upload, Cpu, Shapes, LineChart, Bolt, Server } from 'lucide-react';
import Image from 'next/image';
import { Logo } from '../logo';
import { cn } from '@/lib/utils';

export async function LandingPage() {

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold sm:inline-block">MapMyLED</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Link href={"/app"}>
              <Button>Pixel Map</Button>
            </Link>
            <Link href={"/calculator"}>
              <Button variant="outline">LED Calculator</Button>
            </Link>
            <Link href={"/power-data"}>
              <Button variant="outline">Power & Data</Button>
            </Link>
             <Link href={"/rack-drawing"}>
              <Button variant="outline">Rack Drawing</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_500px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter font-headline sm:text-5xl xl:text-6xl/none">
                    Advanced LED Screen Mapping, Simplified.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    MapMyLED is a powerful web-based tool for designing, documenting, and generating configurations for professional LED video walls.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                   <Link href={"/app"}>
                    <Button size="lg">Get Started for Free</Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border-2 border-teal-500/30 sm:w-full lg:order-last flex items-center justify-center p-8">
                <svg className="w-full h-full" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="100" y="50" width="80" height="80" fill="currentColor" className="text-teal-500" opacity="0.8"/>
                  <rect x="190" y="50" width="80" height="80" fill="currentColor" className="text-emerald-400" opacity="0.6"/>
                  <rect x="280" y="50" width="80" height="80" fill="currentColor" className="text-teal-600" opacity="0.7"/>
                  <rect x="100" y="140" width="80" height="80" fill="currentColor" className="text-emerald-500" opacity="0.7"/>
                  <rect x="190" y="140" width="80" height="80" fill="currentColor" className="text-teal-400" opacity="0.9"/>
                  <rect x="280" y="140" width="80" height="80" fill="currentColor" className="text-emerald-600" opacity="0.6"/>
                  <rect x="100" y="230" width="80" height="80" fill="currentColor" className="text-teal-500" opacity="0.7"/>
                  <rect x="190" y="230" width="80" height="80" fill="currentColor" className="text-emerald-400" opacity="0.8"/>
                  <rect x="280" y="230" width="80" height="80" fill="currentColor" className="text-teal-600" opacity="0.6"/>

                  <text x="140" y="95" className="text-xs fill-white font-mono" fontSize="12">A1</text>
                  <text x="230" y="95" className="text-xs fill-white font-mono" fontSize="12">A2</text>
                  <text x="320" y="95" className="text-xs fill-white font-mono" fontSize="12">A3</text>
                  <text x="140" y="185" className="text-xs fill-white font-mono" fontSize="12">B1</text>
                  <text x="230" y="185" className="text-xs fill-white font-mono" fontSize="12">B2</text>
                  <text x="320" y="185" className="text-xs fill-white font-mono" fontSize="12">B3</text>
                  <text x="140" y="275" className="text-xs fill-white font-mono" fontSize="12">C1</text>
                  <text x="230" y="275" className="text-xs fill-white font-mono" fontSize="12">C2</text>
                  <text x="320" y="275" className="text-xs fill-white font-mono" fontSize="12">C3</text>

                  <path d="M 90 90 L 80 90" stroke="currentColor" className="text-emerald-300" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <path d="M 270 90 L 290 90" stroke="currentColor" className="text-emerald-300" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <path d="M 140 320 L 140 340" stroke="currentColor" className="text-emerald-300" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="currentColor" className="text-emerald-300" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need for Your LED Setup</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From initial design to final export, MapMyLED streamlines your entire workflow.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 pt-12">
              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Shapes className="w-8 h-8 text-primary" />
                    <CardTitle>Custom &amp; Half-Tiles</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Create pixel maps for non-rectangular and custom-designed LED walls. Add half-tiles to the top or bottom for complex shapes.
                    </p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center gap-4">
                  <GitBranch className="w-8 h-8 text-primary" />
                  <CardTitle>Advanced Wiring</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Define and visualize data and power wiring paths with various patterns like serpentine or left-to-right.
                  </p>
                </CardContent>
              </Card>
               <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Cpu className="w-8 h-8 text-primary" />
                  <CardTitle>Processor Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Tailor your wiring and port assignments for different video processors, starting with Brompton, Novastar and Helios.
                  </p>
                </CardContent>
              </Card>
              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center gap-4">
                  <FileOutput className="w-8 h-8 text-primary" />
                  <CardTitle>Raster Map Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create pixel-perfect raster maps for your media server. Export as a single image or as slices based on standard resolutions like HD and 4K.
                  </p>
                </CardContent>
              </Card>
               <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                 <CardHeader className="flex flex-row items-center gap-4">
                   <Bolt className="w-8 h-8 text-primary" />
                   <CardTitle>Power &amp; Data Calculator</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground">
                     Quickly calculate the maximum number of LED tiles a single power circuit or data port can support before being overloaded.
                   </p>
                 </CardContent>
               </Card>
              <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Upload className="w-8 h-8 text-primary" />
                  <CardTitle>Project Import/Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Save your entire project configuration to a single file. Share it with your team or pick up right where you left off.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} MapMyLED. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/legal/terms" className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/contact" className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors">
            Contact Us
          </Link>
          <Link href="/admin/tracking" className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors">
            Admin
          </Link>
        </nav>
      </footer>
    </div>
  );
}
