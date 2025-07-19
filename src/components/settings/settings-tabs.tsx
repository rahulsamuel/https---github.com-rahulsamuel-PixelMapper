
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyProfile } from "@/components/settings/my-profile";
import { AccountSettings } from "@/app/app/account/page";
import { SubscriptionControls } from "@/components/pixel-mapper/subscription-controls";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile">My Profile</TabsTrigger>
        <TabsTrigger value="account">Account Settings</TabsTrigger>
        <TabsTrigger value="subscription">Manage Subscription</TabsTrigger>
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
  );
}
