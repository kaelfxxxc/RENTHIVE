import { useState, useEffect } from "react";
import { Package, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { statusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { TransactionTimeline } from "../../components/ui/TransactionTimeline";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import type { RentalRequest } from "../../types";

const tabs = ["all", "active", "confirmed", "returned", "completed"] as const;
type Tab = typeof tabs[number];

export default function LessorRentalsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [rentals, setRentals] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<RentalRequest | null>(null);
  const [processing, setProcessing] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const [dispute, setDispute] = useState({ reason: "", description: "" });
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  useEffect(() => { if (user) load(); }, [user, tab]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("rental_requests")
      .select("*, listing:listings(id,title,primary_image_url), renter:profiles!rental_requests_renter_id_fkey(id,full_name,avatar_url)")
      .eq("lessor_id", user!.id)
      .order("created_at", { ascending: false });
    if (tab !== "all") q = q.eq("status", tab);
    const { data } = await q;
    setRentals((data as unknown as RentalRequest[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setProcessing(true);
    const { error } = await db.from("rental_requests").update({ status }).eq("id", id);
    if (error) toastError("Failed", error.message);
    else {
      success("Status updated");
      setRentals(r => r.map(x => x.id === id ? { ...x, status: status as RentalRequest["status"] } : x));
      setSelected(s => s?.id === id ? { ...s, status: status as RentalRequest["status"] } : s);
    }
    setProcessing(false);
  };

  const handleDispute = async () => {
    if (!selected || !dispute.reason) { toastError("Select a reason", "Please choose a dispute reason."); return; }
    setDisputeSubmitting(true);
    const { error } = await db.from("disputes").insert({
      rental_request_id: selected.id,
      complainant_id: user!.id,
      respondent_id: (selected as any).renter_id,
      reason: dispute.reason,
      description: dispute.description || null,
      status: "open",
    });
    if (!error) {
      await db.from("rental_requests").update({ status: "disputed" }).eq("id", selected.id);
      success("Dispute filed", "Our team will review within 24-48 hours.");
      setDisputeModal(false);
      setSelected(null);
      setDispute({ reason: "", description: "" });
      load();
    } else {
      toastError("Failed", error.message);
    }
    setDisputeSubmitting(false);
  };

  const handoverSteps = (rental: RentalRequest) => [
    { label: "Confirmed", status: ["confirmed","active","returned","completed"].includes(rental.status) ? "completed" as const : "pending" as const },
    { label: "Product Handed Over", status: ["active","returned","completed"].includes(rental.status) ? "completed" as const : rental.status === "confirmed" ? "active" as const : "pending" as const },
    { label: "Rental Active", status: rental.status === "active" ? "active" as const : ["returned","completed"].includes(rental.status) ? "completed" as const : "pending" as const },
    { label: "Returned", status: ["returned","completed"].includes(rental.status) ? "completed" as const : "pending" as const },
    { label: "Completed", status: rental.status === "completed" ? "completed" as const : "pending" as const },
  ];

  return (
    <LessorLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Rentals</h1>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-colors ${tab === t ? "bg-[#0F172A] text-white" : "bg-white border border-[var(--border)] hover:bg-[var(--muted)]"}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? <TableSkeleton /> : rentals.length === 0 ? (
          <EmptyState icon={<Package className="w-8 h-8" />} title="No rentals" description="Accepted and active rentals appear here." />
        ) : (
          <div className="space-y-3">
            {rentals.map(r => (
              <button key={r.id} onClick={() => setSelected(r)} className="w-full flex items-center gap-4 bg-white border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-shadow text-left">
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {r.listing?.primary_image_url && <img src={r.listing.primary_image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.listing?.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Renter: {r.renter?.full_name}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(r.start_date).toLocaleDateString()} – {new Date(r.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {statusBadge(r.status)}
                  <p className="text-sm font-bold text-[var(--primary)]">₱{r.total_amount.toLocaleString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal open title="Rental Details" onClose={() => setSelected(null)} size="lg">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{selected.listing?.title}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Renter: {selected.renter?.full_name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {new Date(selected.start_date).toLocaleDateString()} – {new Date(selected.end_date).toLocaleDateString()} ({selected.total_days} days)
                </p>
              </div>
              {statusBadge(selected.status)}
            </div>

            <TransactionTimeline steps={handoverSteps(selected)} />

            <div className="grid grid-cols-3 gap-3 text-sm text-center">
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Rental Fee</p>
                <p className="font-bold">₱{selected.rental_fee.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Deposit</p>
                <p className="font-bold">₱{selected.security_deposit.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Total</p>
                <p className="font-bold text-[var(--primary)]">₱{selected.total_amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.status === "confirmed" && (
                <Button size="sm" icon={<CheckCircle2 className="w-4 h-4" />} loading={processing} onClick={() => updateStatus(selected.id, "active")}>
                  Confirm Handover
                </Button>
              )}
              {selected.status === "active" && (
                <Button size="sm" variant="accent" icon={<CheckCircle2 className="w-4 h-4" />} loading={processing} onClick={() => updateStatus(selected.id, "returned")}>
                  Mark as Returned
                </Button>
              )}
              {selected.status === "returned" && (
                <Button size="sm" icon={<CheckCircle2 className="w-4 h-4" />} loading={processing} onClick={() => updateStatus(selected.id, "completed")}>
                  Complete (No Issues)
                </Button>
              )}
              {selected.status === "returned" && (
                <Button size="sm" variant="danger" icon={<AlertTriangle className="w-4 h-4" />}
                  onClick={() => setDisputeModal(true)}>
                  Report Issue / Dispute
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Dispute modal */}
      <Modal open={disputeModal} title="Report an Issue" onClose={() => { setDisputeModal(false); setDispute({ reason: "", description: "" }); }}
        footer={
          <>
            <Button variant="outline" onClick={() => setDisputeModal(false)}>Cancel</Button>
            <Button variant="danger" loading={disputeSubmitting} icon={<AlertTriangle className="w-4 h-4" />} onClick={handleDispute}>
              File Dispute
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Filing a dispute will hold the security deposit and flag this rental for admin review.
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">Reason *</label>
            <select value={dispute.reason} onChange={e => setDispute(d => ({ ...d, reason: e.target.value }))}
              className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[var(--primary)] bg-white">
              <option value="">Select a reason…</option>
              <option value="item_damaged">Item returned damaged</option>
              <option value="item_not_returned">Item not returned</option>
              <option value="late_return">Late return (beyond agreed date)</option>
              <option value="renter_no_show">Renter no-show</option>
              <option value="payment_issue">Payment issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">Description</label>
            <textarea rows={3} value={dispute.description} onChange={e => setDispute(d => ({ ...d, description: e.target.value }))}
              placeholder="Describe what happened…"
              className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)] transition-colors" />
          </div>
        </div>
      </Modal>
    </LessorLayout>
  );
}
