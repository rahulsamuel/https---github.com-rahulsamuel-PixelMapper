
"use client";

import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

const SignUpForm = dynamic(() => import('@/components/auth/signup-form').then(mod => mod.SignUpForm), { 
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  ),
});

export default function SignUpPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
         <Link href="/" className="flex justify-center items-center gap-2 mb-4">
            <Logo className="h-8 w-8" />
        </Link>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>Create an account to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
      <CardFooter className="text-sm text-center block">
          Already have an account?{" "}
          <Link href="/auth/signin" className="underline">
            Sign in
          </Link>
      </CardFooter>
    </Card>
  );
}
