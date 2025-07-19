
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { redirect } from "next/navigation";

export default async function SettingsPage({ params }: { params: { uid: string } }) {
  const user = await getAuthenticatedUser();

  if (!user || user.uid !== params.uid) {
    redirect('/auth/signin');
  }

  return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <SettingsTabs />
      </div>
  );
}
