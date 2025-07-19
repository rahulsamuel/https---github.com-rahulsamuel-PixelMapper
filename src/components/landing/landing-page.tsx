
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, FileOutput, Download, Upload, Cpu, Shapes } from 'lucide-react';
import Image from 'next/image';
import { Logo } from '../logo';
import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user';

export async function LandingPage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">MapMyLED</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Link href={user ? `/` : "/auth/signin"}>
              <Button>Launch App</Button>
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
                   <Link href={user ? `/` : "/auth/signup"}>
                    <Button size="lg">Get Started for Free</Button>
                  </Link>
                </div>
              </div>
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/pixelmapper-3rrq2.firebasestorage.app/o/500x500-removebg.png?alt=media&token=3b30a277-02ad-4b81-b16c-989d830e61da"
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
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Shapes className="w-8 h-8 text-primary" />
                    <CardTitle>Custom & Half-Tiles</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Create pixel maps for non-rectangular and custom-designed LED walls. Add half-tiles to the top or bottom for complex shapes.
                    </p>
                </CardContent>
              </Card>
              <Card>
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
               <Card>
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
              <Card>
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
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Download className="w-8 h-8 text-primary" />
                  <CardTitle>Comprehensive Downloads</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Download your grid layout as a PNG, get a detailed wiring diagram, and export your raster map slices for easy integration.
                  </p>
                </CardContent>
              </Card>
              <Card>
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
          <Link href="/legal/terms" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="text-xs hover:underline underline-offset-4">
            Privacy Policy
          </Link>
          <Link href="/contact" className="text-xs hover:underline underline-offset-4">
            Contact Us
          </Link>
        </nav>
      </footer>
    </div>
  );
}
