
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyProfile } from "@/components/settings/my-profile";
import { SubscriptionControls } from "@/components/pixel-mapper/subscription-controls";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="subscription" className="w-full">
      <TabsList className="grid w-full grid-cols-1">
        <TabsTrigger value="subscription">Manage Subscription</TabsTrigger>
      </TabsList>
      <TabsContent value="subscription" className="mt-6">
        <SubscriptionControls />
      </TabsContent>
    </Tabs>
  );
}
