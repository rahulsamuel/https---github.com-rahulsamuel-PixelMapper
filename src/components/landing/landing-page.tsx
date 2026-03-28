
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, FileOutput, Download, Upload, Cpu, Shapes, LineChart, Bolt, Server } from 'lucide-react';
import Image from 'next/image';
import { Logo } from '../logo';
import { cn } from '@/lib/utils';

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        <section className="relative py-12 md:py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,134,134,0.15),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(177,13,201,0.1),transparent_50%)]" />

            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-[10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob" />
              <div className="absolute top-40 right-[10%] w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
              <div className="absolute bottom-0 left-[40%] w-96 h-96 bg-primary/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
            </div>

            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-[10%] left-[5%] w-2 h-2 bg-primary rounded-full animate-ping-slow" />
              <div className="absolute top-[20%] right-[15%] w-2 h-2 bg-accent rounded-full animate-ping-slow animation-delay-2000" />
              <div className="absolute top-[60%] left-[20%] w-2 h-2 bg-primary rounded-full animate-ping-slow animation-delay-4000" />
              <div className="absolute bottom-[20%] right-[30%] w-2 h-2 bg-accent rounded-full animate-ping-slow" />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_48%,rgba(45,134,134,0.08)_50%,transparent_52%,transparent_100%)] animate-scan" />
          </div>
          <div className="container px-4 md:px-6 relative z-10">
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
              <Image
                src="/500x500-removebg.png"
                width="500"
                height="500"
                alt="MapMyLED Screenshot"
                className="mx-auto aspect-square overflow-hidden rounded-xl object-contain sm:w-full lg:order-last"
                data-ai-hint="led screen custom layout"
              />
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
