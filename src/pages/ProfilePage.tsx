import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ShieldCheck, Star, Edit2, Check, X } from "lucide-react";
import { supabase, db } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge, statusBadge } from "../components/ui/Badge";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import type { ProfileStats } from "../types/database";

interface ProfilePageProps {
  layout: React.ComponentType<{ children: React.ReactNode }>;
}

export default function ProfilePage({ layout: Layout }: ProfilePageProps) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });

  // Rating / completed / reviews were hardcoded placeholders; these are the
  // real aggregates for this account.
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const { data } = await db.rpc("profile_stats", { p_user: profile.id });
      if (cancelled || !data) return;
      const raw = data as Record<string, unknown>;
      setStats({
        avg_rating: raw.avg_rating === null || raw.avg_rating === undefined ? null : Number(raw.avg_rating),
        review_count: Number(raw.review_count ?? 0),
        completed_rentals: Number(raw.completed_rentals ?? 0),
      });
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await db.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
    }).eq("id", profile.id);
    if (error) toastError("Update failed", error.message);
    else {
      await refreshProfile();
      success("Profile updated");
      setEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({ full_name: profile?.full_name || "", phone: profile?.phone || "" });
    setEditing(false);
  };

  if (!profile) return null;

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>My Profile</h1>

        {/* Avatar + name */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-3xl font-bold text-amber-700 overflow-hidden">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-full h-full object-cover" />
                  : (profile.full_name?.[0] || "?")}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-[var(--primary)] text-white rounded-full flex items-center justify-center hover:bg-amber-700 transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{profile.full_name || "Unknown User"}</h2>
                {profile.verification_status === "verified" && (
                  <span className="flex items-center gap-1 text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{profile.email}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {statusBadge(profile.role)}
                <span className="text-xs text-[var(--muted-foreground)]">Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification status */}
        {profile.verification_status !== "verified" && (
          <div className={`border rounded-2xl p-5 ${profile.verification_status === "not_started" || profile.verification_status === "resubmission_required" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Identity Verification</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {profile.verification_status === "not_started" && "Verify your identity to unlock all features"}
                  {profile.verification_status === "pending" && "Your documents are being reviewed"}
                  {profile.verification_status === "under_review" && "An admin is reviewing your documents"}
                  {profile.verification_status === "resubmission_required" && "Please resubmit your documents"}
                  {profile.verification_status === "rejected" && "Verification was rejected. Please contact support."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(profile.verification_status)}
                {["not_started", "resubmission_required"].includes(profile.verification_status) && (
                  <Button size="sm" onClick={() => navigate("/verify-identity")}>Verify Now</Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editable details */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">Personal Information</h3>
            {!editing && (
              <Button variant="ghost" size="sm" icon={<Edit2 className="w-4 h-4" />} onClick={() => setEditing(true)}>Edit</Button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
              <Input label="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} type="tel" />
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={saving} icon={<Check className="w-4 h-4" />}>Save</Button>
                <Button type="button" variant="outline" size="sm" icon={<X className="w-4 h-4" />} onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Full Name", value: profile.full_name },
                { label: "Email", value: profile.email },
                { label: "Phone", value: profile.phone || "Not set" },
                { label: "Account Type", value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
              ].map(field => (
                <div key={field.label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-[var(--muted-foreground)]">{field.label}</span>
                  <span className="text-sm font-medium">{field.value || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Rating", value: stats?.avg_rating ? stats.avg_rating.toFixed(1) : "—", icon: <Star className="w-5 h-5 text-amber-500" /> },
            { label: "Completed", value: String(stats?.completed_rentals ?? 0), icon: <ShieldCheck className="w-5 h-5 text-teal-500" /> },
            { label: "Reviews", value: String(stats?.review_count ?? 0), icon: <Star className="w-5 h-5 text-purple-500" /> },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[var(--border)] rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
