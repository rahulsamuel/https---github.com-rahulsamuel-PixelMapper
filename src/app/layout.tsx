
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { GlobalHeader } from '@/components/layout/global-header';
import { FeedbackPromptProvider } from '@/components/feedback/feedback-prompt';

export const metadata: Metadata = {
  title: 'MapMyLED',
  description: 'An advanced tool for LED screen mapping and configuration.',
  icons: {
    icon: '/MapMyLED_app_icon copy 2.png',
    apple: '/MapMyLED_app_icon copy 2.png',
  },
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
          <FeedbackPromptProvider>
            <div className="flex flex-col min-h-svh">
              <GlobalHeader />
              <main className="flex-1 flex flex-col">
                {children}
              </main>
            </div>
          </FeedbackPromptProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
