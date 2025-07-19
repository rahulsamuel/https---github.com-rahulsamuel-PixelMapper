
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, CreditCard, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { AccountSettings } from "@/app/app/account/page";
import { SubscriptionControls } from "@/components/pixel-mapper/subscription-controls";
import { MyProfile } from "@/components/settings/my-profile";
import LegalLayout from "@/app/legal/layout";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <LegalLayout>
      <div className="container mx-auto max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Button asChild variant="outline">
                <Link href="/app">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to App
                </Link>
            </Button>
        </div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              My Profile
            </TabsTrigger>
            <TabsTrigger value="account">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="mr-2 h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-6">
            <MyProfile />
          </TabsContent>
          <TabsContent value="account" className="mt-6">
            <AccountSettings />
          </TabsContent>
          <TabsContent value="subscription" className="mt-6">
            <SubscriptionControls />
          </TabsContent>
        </Tabs>
      </div>
    </LegalLayout>
  );
}
