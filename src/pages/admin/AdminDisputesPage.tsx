import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { statusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";

interface DisputeRow {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  created_at: string;
  complainant: { full_name: string | null } | null;
  respondent: { full_name: string | null } | null;
  rental: { id: string; listing: { title: string } | null } | null;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DisputeRow | null>(null);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("disputes")
      .select("id,reason,description,status,resolution,created_at,complainant:profiles!disputes_complainant_id_fkey(full_name),respondent:profiles!disputes_respondent_id_fkey(full_name),rental:rental_requests(id,listing:listings(title))")
      .order("created_at", { ascending: false });
    setDisputes((data as unknown as DisputeRow[]) || []);
    setLoading(false);
  };

  const resolve = async (outcome: "resolved_complainant" | "resolved_respondent" | "closed") => {
    if (!selected) return;
    setResolving(true);
    const { error } = await db.from("disputes").update({ status: outcome, resolution: resolution || null, resolved_at: new Date().toISOString() }).eq("id", selected.id);
    if (error) toastError("Error", error.message);
    else {
      success("Dispute resolved");
      setSelected(null);
      setResolution("");
      load();
    }
    setResolving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Disputes</h1>

        {loading ? <TableSkeleton /> : disputes.length === 0 ? (
          <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="No disputes" description="Rental disputes will appear here." />
        ) : (
          <div className="space-y-3">
            {disputes.map(d => (
              <div key={d.id} className="bg-white border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <p className="font-semibold text-sm capitalize">{d.reason.replace("_", " ")}</p>
                      {statusBadge(d.status)}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {d.rental?.listing?.title} · {d.complainant?.full_name} vs {d.respondent?.full_name}
                    </p>
                    {d.description && <p className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed line-clamp-2">{d.description}</p>}
                    <p className="text-xs text-[var(--muted-foreground)] mt-2">{new Date(d.created_at).toLocaleString()}</p>
                  </div>
                  {d.status === "open" || d.status === "under_review" ? (
                    <Button size="sm" onClick={() => { setSelected(d); setResolution(d.resolution || ""); }}>
                      Review
                    </Button>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)] italic">{d.resolution || "—"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal open title="Resolve Dispute" onClose={() => setSelected(null)} size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button variant="outline" size="sm" loading={resolving} onClick={() => resolve("closed")}>Close (No Action)</Button>
              <Button variant="accent" size="sm" loading={resolving} onClick={() => resolve("resolved_respondent")}>Favor Respondent</Button>
              <Button size="sm" loading={resolving} onClick={() => resolve("resolved_complainant")}>Favor Complainant</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Complainant</p>
                <p className="font-medium">{selected.complainant?.full_name}</p>
              </div>
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Respondent</p>
                <p className="font-medium">{selected.respondent?.full_name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Reason</p>
              <p className="text-sm capitalize">{selected.reason.replace("_", " ")}</p>
            </div>
            {selected.description && (
              <div>
                <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm leading-relaxed">{selected.description}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1 block">Resolution Notes</label>
              <textarea
                className="w-full border border-[var(--border)] rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                rows={3} placeholder="Describe the resolution..."
                value={resolution} onChange={e => setResolution(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
