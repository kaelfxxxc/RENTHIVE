import { useState, useEffect } from "react";
import { ShieldCheck, ShieldX, Eye, RefreshCw } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { statusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import type { VerificationStatus } from "../../types";

interface VerifRow {
  id: string;
  status: string;
  id_type: string | null;
  id_number: string | null;
  front_image_url: string | null;
  back_image_url: string | null;
  selfie_url: string | null;
  admin_notes: string | null;
  submitted_at: string | null;
  created_at: string;
  user: { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;
}

const STATUS_OPTS: (VerificationStatus | "all")[] = ["all", "pending", "under_review", "verified", "rejected", "resubmission_required"];

export default function AdminVerificationsPage() {
  const [rows, setRows] = useState<VerifRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<VerificationStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VerifRow | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("identity_verifications")
      .select("*, user:profiles!identity_verifications_user_id_fkey(id,full_name,email,avatar_url)")
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as unknown as VerifRow[]) || []);
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setProcessing(true);
    const { error } = await db.from("identity_verifications").update({
      status,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
    }).eq("id", selected.id);

    if (!error) {
      // Update user's verification_status on profile too
      const profileStatus = status === "verified" ? "verified"
        : status === "rejected" ? "rejected"
        : status === "resubmission_required" ? "resubmission_required"
        : "under_review";
      await db.from("profiles").update({ verification_status: profileStatus }).eq("id", selected.user!.id);
      success(`Marked as ${status}`);
      setSelected(null);
      setAdminNotes("");
      load();
    } else {
      toastError("Failed", error.message);
    }
    setProcessing(false);
  };

  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.user?.full_name?.toLowerCase().includes(q) || r.user?.email?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Identity Verifications</h1>
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={load}>Refresh</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_OPTS.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${filter === s ? "bg-[#0F172A] text-white" : "bg-white border border-[var(--border)] hover:bg-[var(--muted)]"}`}>
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="w-8 h-8" />} title="No submissions" description="Identity verification submissions appear here." />
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <tr>
                    {["User", "ID Type", "Status", "Submitted", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-[var(--muted)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{r.user?.full_name || "—"}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{r.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{r.id_type?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button size="xs" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => { setSelected(r); setAdminNotes(r.admin_notes || ""); }}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <Modal open title="Review Verification" onClose={() => { setSelected(null); setAdminNotes(""); }} size="lg"
          footer={
            <div className="flex flex-wrap gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => { setSelected(null); setAdminNotes(""); }}>Cancel</Button>
              <Button variant="secondary" size="sm" loading={processing} onClick={() => updateStatus("under_review")}>Mark Under Review</Button>
              <Button variant="secondary" size="sm" loading={processing} onClick={() => updateStatus("resubmission_required")}>Request Resubmission</Button>
              <Button variant="danger" size="sm" icon={<ShieldX className="w-4 h-4" />} loading={processing} onClick={() => updateStatus("rejected")}>Reject</Button>
              <Button size="sm" icon={<ShieldCheck className="w-4 h-4" />} loading={processing} onClick={() => updateStatus("verified")}>Verify</Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* User info */}
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                {selected.user?.full_name?.[0] || "?"}
              </div>
              <div>
                <p className="font-semibold">{selected.user?.full_name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{selected.user?.email}</p>
              </div>
              {statusBadge(selected.status)}
            </div>

            {/* ID info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">ID Type</p>
                <p className="font-medium capitalize">{selected.id_type?.replace(/_/g, " ") || "—"}</p>
              </div>
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">ID Number</p>
                <p className="font-medium font-mono">{selected.id_number || "Not provided"}</p>
              </div>
            </div>

            {/* Document images */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Front of ID", url: selected.front_image_url },
                { label: "Back of ID", url: selected.back_image_url },
                { label: "Selfie with ID", url: selected.selfie_url },
              ].map(doc => (
                <div key={doc.label}>
                  <p className="text-xs text-[var(--muted-foreground)] mb-1.5">{doc.label}</p>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <img src={doc.url} alt={doc.label} className="w-full aspect-[4/3] object-cover rounded-xl border border-[var(--border)] hover:opacity-90 transition-opacity cursor-zoom-in" />
                    </a>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-[var(--muted)] rounded-xl border border-[var(--border)] flex items-center justify-center">
                      <p className="text-xs text-[var(--muted-foreground)]">Not uploaded</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Admin notes */}
            <div>
              <label className="text-sm font-semibold block mb-1.5">Admin Notes (optional)</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Reason for rejection, instructions for resubmission, etc."
                className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
