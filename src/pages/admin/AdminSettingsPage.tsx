import { useState, useEffect } from "react";
import { Save, Globe, Bell, Shield, Database } from "lucide-react";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { db, supabaseProjectRef, supabaseProjectUrl } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { usePlatformSettings, DEFAULT_SETTINGS } from "../../contexts/SettingsContext";

export default function AdminSettingsPage() {
  const { success, error: toastError } = useToast();
  const { user } = useAuth();
  const { settings, loaded, refreshSettings } = usePlatformSettings();

  const [platform, setPlatform] = useState({
    siteName: DEFAULT_SETTINGS.site_name,
    supportEmail: DEFAULT_SETTINGS.support_email,
    platformFeePercent: String(DEFAULT_SETTINGS.platform_fee_percent),
    reservationFeePercent: String(DEFAULT_SETTINGS.reservation_fee_percent),
    maxRentalDays: String(DEFAULT_SETTINGS.max_rental_days),
    requireVerification: DEFAULT_SETTINGS.require_verification,
    allowGuestBrowse: DEFAULT_SETTINGS.allow_guest_browse,
  });
  const [saving, setSaving] = useState(false);

  // Hydrate the form once the real settings row (or the fallback) is read.
  useEffect(() => {
    if (!loaded) return;
    setPlatform({
      siteName: settings.site_name,
      supportEmail: settings.support_email,
      platformFeePercent: String(settings.platform_fee_percent),
      reservationFeePercent: String(settings.reservation_fee_percent),
      maxRentalDays: String(settings.max_rental_days),
      requireVerification: settings.require_verification,
      allowGuestBrowse: settings.allow_guest_browse,
    });
  }, [loaded, settings]);

  const handleSave = async () => {
    const fee = Number(platform.platformFeePercent);
    const reservation = Number(platform.reservationFeePercent);
    const maxDays = Number(platform.maxRentalDays);

    // Mirror the CHECK constraints so a bad value fails here, with a clear
    // message, rather than as a Postgres error.
    if (!Number.isFinite(fee) || fee < 0 || fee > 50) {
      toastError("Invalid platform fee", "Platform fee must be between 0 and 50 percent.");
      return;
    }
    if (!Number.isFinite(reservation) || reservation < 0 || reservation > 100) {
      toastError("Invalid reservation fee", "Reservation fee must be between 0 and 100 percent.");
      return;
    }
    if (!Number.isInteger(maxDays) || maxDays < 1 || maxDays > 3650) {
      toastError("Invalid rental duration", "Max rental duration must be between 1 and 3650 days.");
      return;
    }

    setSaving(true);
    // Singleton row: id is a boolean PK fixed at true, so upsert either
    // creates the one row or updates it in place.
    const { error } = await db
      .from("platform_settings")
      .upsert({
        id: true,
        site_name: platform.siteName.trim() || DEFAULT_SETTINGS.site_name,
        support_email: platform.supportEmail.trim() || DEFAULT_SETTINGS.support_email,
        platform_fee_percent: fee,
        reservation_fee_percent: reservation,
        max_rental_days: maxDays,
        require_verification: platform.requireVerification,
        allow_guest_browse: platform.allowGuestBrowse,
        updated_by: user?.id ?? null,
      }, { onConflict: "id" });

    if (error) {
      toastError("Could not save settings", error.message);
    } else {
      await refreshSettings();
      success("Settings saved", "Platform configuration updated.");
    }
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
              hint="Deducted from lessor earnings on completed rentals" />
            <Input label="Reservation Fee (%)" type="number" min="0" max="100" value={platform.reservationFeePercent}
              onChange={e => setPlatform(p => ({ ...p, reservationFeePercent: e.target.value }))}
              hint="Share of the rental fee paid upfront to reserve" />
            <Input label="Max Rental Duration (days)" type="number" min="1" max="3650" value={platform.maxRentalDays}
              onChange={e => setPlatform(p => ({ ...p, maxRentalDays: e.target.value }))} />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            These values drive live fee calculations at checkout and on the earnings page. Changing them affects future
            transactions only — rentals already paid keep the amounts they were charged.
          </p>
        </Section>

        <Section icon={<Shield className="w-4 h-4 text-amber-500" />} title="Trust &amp; Safety">
          <Toggle label="Require identity verification" sub="Lessors must be verified before publishing listings"
            value={platform.requireVerification} onChange={v => setPlatform(p => ({ ...p, requireVerification: v }))} />
          <Toggle label="Allow guest browsing" sub="Non-registered users can view listings"
            value={platform.allowGuestBrowse} onChange={v => setPlatform(p => ({ ...p, allowGuestBrowse: v }))} />
        </Section>

        <Section icon={<Bell className="w-4 h-4 text-purple-500" />} title="Supabase Connection">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
            <p className="font-semibold mb-1">✓ Connected to Supabase</p>
            <p className="text-xs text-teal-600 break-all">
              {supabaseProjectRef ? `Project: ${supabaseProjectRef}` : supabaseProjectUrl}
            </p>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            To change Supabase credentials, update <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your environment variables.
          </p>
        </Section>
      </div>
    </AdminLayout>
  );
}
