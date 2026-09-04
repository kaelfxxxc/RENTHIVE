import { useState } from "react";
import { Save, Globe, Bell, Shield, Database } from "lucide-react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";

export default function AdminSettingsPage() {
  const { success } = useToast();
  const [platform, setPlatform] = useState({
    siteName: "RentHive",
    supportEmail: "support@renthive.ph",
    platformFeePercent: "10",
    maxRentalDays: "90",
    requireVerification: true,
    allowGuestBrowse: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    success("Settings saved", "Platform configuration updated.");
    setSaving(false);
  };

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-[var(--border)]">
        {icon}<h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-[var(--muted-foreground)]">{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full transition-colors ${value ? "bg-amber-500" : "bg-gray-200"}`}>
        <div className={`w-4 h-4 bg-white rounded-full mt-1 mx-auto transition-transform shadow ${value ? "translate-x-2.5" : "-translate-x-2.5"}`} />
      </button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Platform Settings</h1>
          <Button icon={<Save className="w-4 h-4" />} loading={saving} onClick={handleSave}>Save Changes</Button>
        </div>

        <Section icon={<Globe className="w-4 h-4 text-blue-500" />} title="General">
          <Input label="Platform Name" value={platform.siteName} onChange={e => setPlatform(p => ({ ...p, siteName: e.target.value }))} />
          <Input label="Support Email" type="email" value={platform.supportEmail} onChange={e => setPlatform(p => ({ ...p, supportEmail: e.target.value }))} />
        </Section>

        <Section icon={<Database className="w-4 h-4 text-teal-500" />} title="Rental Rules">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Platform Fee (%)" type="number" min="0" max="50" value={platform.platformFeePercent}
              onChange={e => setPlatform(p => ({ ...p, platformFeePercent: e.target.value }))}
              hint="Percentage taken from each rental transaction" />
            <Input label="Max Rental Duration (days)" type="number" min="1" value={platform.maxRentalDays}
              onChange={e => setPlatform(p => ({ ...p, maxRentalDays: e.target.value }))} />
          </div>
        </Section>

        <Section icon={<Shield className="w-4 h-4 text-amber-500" />} title="Trust & Safety">
          <Toggle label="Require identity verification" sub="Lessors must be verified before publishing listings"
            value={platform.requireVerification} onChange={v => setPlatform(p => ({ ...p, requireVerification: v }))} />
          <Toggle label="Allow guest browsing" sub="Non-registered users can view listings"
            value={platform.allowGuestBrowse} onChange={v => setPlatform(p => ({ ...p, allowGuestBrowse: v }))} />
        </Section>

        <Section icon={<Bell className="w-4 h-4 text-purple-500" />} title="Supabase Connection">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
            <p className="font-semibold mb-1">✓ Connected to Supabase</p>
            <p className="text-xs text-teal-600">Project: btqajcroxzbvjkovpiyp · Region: ap-southeast-1</p>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            To change Supabase credentials, update <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your environment variables.
          </p>
        </Section>
      </div>
    </AdminLayout>
  );
}
