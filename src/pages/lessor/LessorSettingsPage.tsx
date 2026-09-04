import { useState, FormEvent } from "react";
import { Bell, Shield, LogOut, ChevronRight } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LessorSettingsPage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [pwModal, setPwModal] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    new_requests: true,
    payment_received: true,
    messages: true,
    rental_updates: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) { toastError("Mismatch", "New passwords do not match."); return; }
    if (pw.next.length < 6) { toastError("Too short", "Password must be at least 6 characters."); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) toastError("Failed", error.message);
    else { success("Password updated"); setPwModal(false); setPw({ current: "", next: "", confirm: "" }); }
    setSavingPw(false);
  };

  const handleSaveNotif = async () => {
    setSavingNotif(true);
    if (profile) {
      await db.from("profiles").update({ notification_preferences: notifSettings }).eq("id", profile.id);
      await refreshProfile();
      success("Notification preferences saved");
    }
    setSavingNotif(false);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const sections = [
    {
      title: "Security",
      icon: <Shield className="w-5 h-5 text-teal-500" />,
      items: [
        { label: "Change Password", action: () => setPwModal(true) },
        { label: "Identity Verification", sub: profile?.verification_status === "verified" ? "Verified ✓" : "Not verified", action: () => navigate("/verify-identity") },
      ],
    },
  ];

  return (
    <LessorLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>

        {/* Notifications */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold">Notification Preferences</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(notifSettings).map(([key, val]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                <div
                  onClick={() => setNotifSettings(s => ({ ...s, [key]: !val }))}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${val ? "bg-amber-500" : "bg-gray-200"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform shadow ${val ? "translate-x-5" : "translate-x-1"}`} />
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Button size="sm" loading={savingNotif} onClick={handleSaveNotif}>Save Preferences</Button>
          </div>
        </div>

        {/* Security */}
        {sections.map(sec => (
          <div key={sec.title} className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">{sec.icon}<h2 className="font-semibold">{sec.title}</h2></div>
            <div className="space-y-1">
              {sec.items.map(item => (
                <button key={item.label} onClick={item.action} className="w-full flex items-center justify-between px-2 py-3 rounded-xl hover:bg-[var(--muted)] transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    {item.sub && <p className="text-xs text-[var(--muted-foreground)]">{item.sub}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Danger zone */}
        <div className="bg-white border border-red-100 rounded-2xl p-5">
          <h2 className="font-semibold text-red-600 mb-4">Danger Zone</h2>
          <div className="flex flex-col gap-3">
            <Button variant="outline" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={handleSignOut}>Sign out</Button>
            <Button variant="danger" size="sm" onClick={() => setDeactivateModal(true)}>Deactivate Account</Button>
          </div>
        </div>
      </div>

      {/* Change password modal */}
      <Modal open={pwModal} title="Change Password" onClose={() => setPwModal(false)}
        footer={<><Button variant="outline" onClick={() => setPwModal(false)}>Cancel</Button><Button loading={savingPw} onClick={e => handleChangePassword(e as FormEvent)}>Update Password</Button></>}>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="New Password" type="password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} required />
          <Input label="Confirm New Password" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} required />
        </form>
      </Modal>

      {/* Deactivate modal */}
      <Modal open={deactivateModal} title="Deactivate Account" onClose={() => setDeactivateModal(false)}
        footer={<><Button variant="outline" onClick={() => setDeactivateModal(false)}>Cancel</Button><Button variant="danger" onClick={() => { success("Request submitted"); setDeactivateModal(false); }}>Confirm Deactivation</Button></>}>
        <p className="text-sm text-[var(--muted-foreground)]">
          Deactivating your account will hide your listings and prevent new bookings. Ongoing rentals will not be affected. Contact support to permanently delete your account.
        </p>
      </Modal>
    </LessorLayout>
  );
}
