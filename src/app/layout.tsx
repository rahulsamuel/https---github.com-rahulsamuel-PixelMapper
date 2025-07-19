
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user';

export const metadata: Metadata = {
  title: 'MapMyLED',
  description: 'An advanced tool for LED screen mapping and configuration.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  return (
    <html lang="en" className="dark">
      <head />
      <body className="font-body antialiased">
        <AuthProvider initialUser={user}>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
