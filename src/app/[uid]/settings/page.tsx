
import LegalLayout from "@/app/legal/layout";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsPage() {
  return (
    <LegalLayout>
      <div className="container mx-auto max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <SettingsTabs />
      </div>
    </LegalLayout>
  );
}
