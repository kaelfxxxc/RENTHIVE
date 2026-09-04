import { useState, useEffect } from "react";
import { FileText, CheckCircle2, XCircle, MessageSquare, ShieldCheck } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { Button } from "../../components/ui/Button";
import { Badge, statusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import type { RentalRequest } from "../../types";

export default function LessorRequestsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<{ id: string; action: "accepted" | "declined" } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rental_requests")
      .select("*, listing:listings(id,title,primary_image_url,price_per_day), renter:profiles!rental_requests_renter_id_fkey(id,full_name,avatar_url,verification_status,created_at)")
      .eq("lessor_id", user!.id)
      .in("status", ["pending"])
      .order("created_at", { ascending: false });
    setRequests((data as unknown as RentalRequest[]) || []);
    setLoading(false);
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    setProcessing(true);
    const { error } = await db.from("rental_requests").update({ status: actionTarget.action }).eq("id", actionTarget.id);
    if (error) {
      toastError("Action failed", error.message);
    } else {
      success(actionTarget.action === "accepted" ? "Request accepted!" : "Request declined.");
      setRequests(r => r.filter(x => x.id !== actionTarget.id));
    }
    setActionTarget(null);
    setProcessing(false);
  };

  return (
    <LessorLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Rental Requests</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{requests.length} pending request{requests.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? <TableSkeleton /> : requests.length === 0 ? (
          <EmptyState icon={<FileText className="w-8 h-8" />} title="No pending requests" description="New rental requests will appear here." />
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r.id} className="bg-white border border-[var(--border)] rounded-2xl p-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {r.listing?.primary_image_url && <img src={r.listing.primary_image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{r.listing?.title}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {new Date(r.start_date).toLocaleDateString()} – {new Date(r.end_date).toLocaleDateString()}
                      {" "}({r.total_days} day{r.total_days !== 1 ? "s" : ""})
                    </p>
                    <p className="text-sm font-bold text-[var(--primary)] mt-1">₱{r.total_amount.toLocaleString()} total</p>
                  </div>
                  {statusBadge(r.status)}
                </div>

                {/* Renter info */}
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Renter</p>
                  <div className="flex items-center gap-3">
                    <Avatar src={r.renter?.avatar_url} name={r.renter?.full_name} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm">{r.renter?.full_name}</p>
                        {r.renter?.verification_status === "verified" && <ShieldCheck className="w-4 h-4 text-teal-500" />}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">{statusBadge(r.renter?.verification_status || "")}</p>
                    </div>
                  </div>
                </div>

                {r.renter_message && (
                  <div className="bg-[var(--muted)] rounded-xl p-3">
                    <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1">Message from renter</p>
                    <p className="text-sm">{r.renter_message}</p>
                  </div>
                )}

                {/* Price breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="bg-[var(--muted)] rounded-xl p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">Rental Fee</p>
                    <p className="font-bold">₱{r.rental_fee.toLocaleString()}</p>
                  </div>
                  <div className="bg-[var(--muted)] rounded-xl p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">Deposit</p>
                    <p className="font-bold">₱{r.security_deposit.toLocaleString()}</p>
                  </div>
                  <div className="bg-[var(--muted)] rounded-xl p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">Incidental</p>
                    <p className="font-bold">₱{(r.incidental_fee || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" icon={<MessageSquare className="w-4 h-4" />}>Message</Button>
                  <div className="flex-1" />
                  <Button variant="danger" size="sm" icon={<XCircle className="w-4 h-4" />} onClick={() => setActionTarget({ id: r.id, action: "declined" })}>Decline</Button>
                  <Button size="sm" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setActionTarget({ id: r.id, action: "accepted" })}>Accept</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!actionTarget} onClose={() => setActionTarget(null)} title={`Confirm ${actionTarget?.action === "accepted" ? "Accept" : "Decline"}`}
        footer={<>
          <Button variant="outline" onClick={() => setActionTarget(null)}>Cancel</Button>
          <Button variant={actionTarget?.action === "accepted" ? "primary" : "danger"} loading={processing} onClick={handleAction}>
            {actionTarget?.action === "accepted" ? "Accept Request" : "Decline Request"}
          </Button>
        </>}>
        <p className="text-sm text-[var(--muted-foreground)]">
          {actionTarget?.action === "accepted"
            ? "The renter will be notified and will proceed with payment."
            : "The renter will be notified that their request was declined."}
        </p>
      </Modal>
    </LessorLayout>
  );
}
