
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { GlobalHeader } from '@/components/layout/global-header';

export const metadata: Metadata = {
  title: 'MapMyLED',
  description: 'An advanced tool for LED screen mapping and configuration.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className="font-body antialiased min-h-svh">
        <AuthProvider>
          <div className="flex flex-col min-h-svh">
            <GlobalHeader />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
