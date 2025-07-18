
'use client';

import dynamic from 'next/dynamic';
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

const SignInForm = dynamic(() => import('@/components/auth/signin-form').then(mod => mod.SignInForm), { 
  ssr: false,
  loading: () => <SignInFormSkeleton />,
});

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2 text-primary">
                <Logo className="w-10 h-10" />
                <span className="text-2xl font-bold">MapMyLED</span>
            </Link>
        </div>
        <SignInForm />
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <Link
            href="/legal/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function SignInFormSkeleton() {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">Welcome back</h3>
                <p className="text-sm text-muted-foreground">Enter your email below to sign in to your account</p>
            </div>
            <div className="p-6 pt-0 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )
}
