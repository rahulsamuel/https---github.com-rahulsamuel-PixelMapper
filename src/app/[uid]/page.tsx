
'use server';

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import LegalLayout from "../legal/layout";

export default async function WelcomePage({ params }: { params: { uid: string } }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (user.uid !== params.uid) {
    redirect(`/${user.uid}`);
  }

  return (
    <LegalLayout>
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-3xl">Welcome, {user.name || user.email}!</CardTitle>
            <CardDescription>You are successfully logged in.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Ready to start mapping? Launch the editor to begin creating your next LED project.</p>
            <Link href={`/${user.uid}/editor`}>
              <Button size="lg">
                Launch Editor <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </LegalLayout>
  );
}
