
'useclient';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyProfile } from "@/components/settings/my-profile";
import { SubscriptionControls } from "@/components/pixel-mapper/subscription-controls";
import LegalLayout from "@/app/legal/layout";
import { AccountSettings } from "@/components/settings/account-settings";

export default function SettingsPage() {
  return (
    <LegalLayout>
      <div className="max-w-4xl mx-auto">
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
      </div>
    </LegalLayout>
  );
}
