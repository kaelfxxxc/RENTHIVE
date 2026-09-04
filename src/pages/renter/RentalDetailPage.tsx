import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MessageSquare, AlertTriangle, Loader2, CheckCircle2, CreditCard, Shield } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { RenterLayout } from "../../components/layout/RenterLayout";
import { Button } from "../../components/ui/Button";
import { Badge, statusBadge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { TransactionTimeline } from "../../components/ui/TransactionTimeline";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { usePlatformSettings } from "../../contexts/SettingsContext";
import type { RentalRequest, Payment } from "../../types";

const TEST_MODE = !import.meta.env.VITE_PAYMENT_LIVE;

/**
 * Splits a rental into its two payable instalments using the reservation
 * percentage configured in `platform_settings`.
 *
 * The balance is derived by subtracting the reservation from the rental fee
 * rather than applying the inverse percentage, so the two instalments always
 * sum to exactly the rental fee with no rounding gap.
 */
function splitFees(rental: RentalRequest, reservationRate: number) {
  const reservation = Math.round(rental.rental_fee * reservationRate);
  const balance = Math.round(
    rental.security_deposit
    + (rental.rental_fee - reservation)
    + (rental.incidental_fee || 0)
    + (rental.delivery_fee || 0),
  );
  return { reservation, balance };
}

function buildTimeline(rental: RentalRequest, payments: Payment[]) {
  const paid = (type: string) => payments.some(p => p.payment_type === type && p.status === "paid");
  const statuses: Record<string, "completed" | "active" | "pending" | "failed" | "disputed"> = {
    pending: "active", accepted: "active", payment_pending: "active",
    confirmed: "completed", active: "completed", returned: "completed",
    completed: "completed", disputed: "disputed", cancelled: "failed", declined: "failed",
  };

  const now = statuses[rental.status] ?? "pending";

  return [
    { label: "Request Sent", status: "completed" as const, date: new Date(rental.created_at).toLocaleDateString() },
    { label: "Request Accepted", status: ["pending"].includes(rental.status) ? "pending" as const : "completed" as const },
    { label: "Reservation Fee Paid", status: paid("reservation_fee") ? "completed" as const : ["accepted", "payment_pending"].includes(rental.status) ? "active" as const : "pending" as const },
    { label: "Balance + Deposit Paid", status: paid("deposit") ? "completed" as const : "pending" as const },
    { label: "Product Handed Over", status: ["active", "returned", "completed"].includes(rental.status) ? "completed" as const : "pending" as const },
    { label: "Rental Active", status: rental.status === "active" ? "active" as const : ["returned", "completed"].includes(rental.status) ? "completed" as const : "pending" as const },
    { label: "Product Returned", status: ["returned", "completed"].includes(rental.status) ? "completed" as const : "pending" as const },
    { label: "Deposit Released", status: rental.status === "completed" ? "completed" as const : rental.status === "disputed" ? "disputed" as const : "pending" as const },
    { label: "Review Completed", status: rental.status === "completed" ? "completed" as const : "pending" as const },
  ];
}

export default function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { reservationFeeRate } = usePlatformSettings();
  const [rental, setRental] = useState<RentalRequest | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<"reservation_fee" | "deposit" | null>(null);
  const [paying, setPaying] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const [dispute, setDispute] = useState({ reason: "", description: "" });
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    setLoading(true);
    const [rentRes, payRes] = await Promise.all([
      supabase.from("rental_requests")
        .select("*, listing:listings(id,title,primary_image_url,price_per_day,security_deposit,city), lessor:profiles!rental_requests_lessor_id_fkey(id,full_name,avatar_url,verification_status)")
        .eq("id", id!).single(),
      supabase.from("payments").select("*").eq("rental_request_id", id!),
    ]);
    if (rentRes.data) setRental(rentRes.data as unknown as RentalRequest);
    setPayments((payRes.data as Payment[]) || []);
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!rental || !payModal) return;
    setPaying(true);

    // TEST MODE: simulate payment
    await new Promise(r => setTimeout(r, 1200));

    const split = splitFees(rental, reservationFeeRate);
    const amount = payModal === "reservation_fee" ? split.reservation : split.balance;

    const { error } = await db.from("payments").insert({
      rental_request_id: rental.id,
      payer_id: user!.id,
      amount,
      payment_type: payModal,
      status: "paid",
      payment_method: "test_mode",
      transaction_ref: `TEST-${Date.now()}`,
      notes: "TEST MODE payment",
    });

    if (!error) {
      const newStatus = payModal === "reservation_fee" ? "payment_pending" : "confirmed";
      await db.from("rental_requests").update({ status: newStatus }).eq("id", rental.id);
      success("Payment successful", `₱${amount.toLocaleString()} processed in TEST MODE.`);
      setPayModal(null);
      load();
    } else {
      toastError("Payment failed", error.message);
    }
    setPaying(false);
  };

  const handleCancel = async () => {
    if (!rental) return;
    setCancelling(true);
    await db.from("rental_requests").update({ status: "cancelled" }).eq("id", rental.id);
    success("Rental cancelled");
    setCancelModal(false);
    load();
    setCancelling(false);
  };

  const handleDispute = async () => {
    if (!rental || !dispute.reason) { toastError("Missing info", "Please select a reason."); return; }
    setDisputeSubmitting(true);
    const { error } = await db.from("disputes").insert({
      rental_request_id: rental.id,
      complainant_id: user!.id,
      respondent_id: rental.lessor_id,
      reason: dispute.reason,
      description: dispute.description || null,
      status: "open",
    });
    if (!error) {
      await db.from("rental_requests").update({ status: "disputed" }).eq("id", rental.id);
      success("Dispute filed", "Our team will review your case within 24-48 hours.");
      setDisputeModal(false);
      setDispute({ reason: "", description: "" });
      load();
    } else {
      toastError("Failed", error.message);
    }
    setDisputeSubmitting(false);
  };

  if (loading) return <RenterLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div></RenterLayout>;
  if (!rental) return <RenterLayout><p className="text-center py-20 text-[var(--muted-foreground)]">Rental not found.</p></RenterLayout>;

  const reservationPaid = payments.some(p => p.payment_type === "reservation_fee" && p.status === "paid");
  const fullyPaid = payments.some(p => p.payment_type === "deposit" && p.status === "paid");
  const canCancel = ["pending", "accepted", "payment_pending"].includes(rental.status);
  const canPayReservation = rental.status === "accepted" && !reservationPaid;
  const canPayBalance = reservationPaid && !fullyPaid && rental.status === "payment_pending";

  const timeline = buildTimeline(rental, payments);
  const split = splitFees(rental, reservationFeeRate);

  return (
    <RenterLayout>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to My Rentals
        </button>

        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{rental.listing?.title}</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Rental #{rental.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(rental.status)}
            {canCancel && <Button variant="outline" size="sm" onClick={() => setCancelModal(true)}>Cancel</Button>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Listing info */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {rental.listing?.primary_image_url && <img src={rental.listing.primary_image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{rental.listing?.title}</h3>
                  {rental.listing?.city && <p className="text-sm text-[var(--muted-foreground)]">{rental.listing.city}</p>}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="bg-[var(--muted)] rounded-lg p-2.5">
                      <p className="text-xs text-[var(--muted-foreground)]">Start</p>
                      <p className="font-medium">{new Date(rental.start_date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-[var(--muted)] rounded-lg p-2.5">
                      <p className="text-xs text-[var(--muted-foreground)]">End</p>
                      <p className="font-medium">{new Date(rental.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Payment Breakdown</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: `Rental fee (${rental.total_days} days)`, amount: rental.rental_fee },
                  { label: "Security deposit", amount: rental.security_deposit },
                  ...(rental.incidental_fee ? [{ label: "Incidental fee", amount: rental.incidental_fee }] : []),
                  ...(rental.delivery_fee ? [{ label: "Delivery fee", amount: rental.delivery_fee }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">{row.label}</span>
                    <span>₱{row.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base border-t border-[var(--border)] pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-[var(--primary)]">₱{rental.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment history */}
              {payments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Payment Records</p>
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                      <div>
                        <span className="capitalize font-medium">{p.payment_type.replace("_", " ")}</span>
                        {p.transaction_ref && <span className="text-xs text-[var(--muted-foreground)] ml-2 font-mono">{p.transaction_ref}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">₱{p.amount.toLocaleString()}</span>
                        {statusBadge(p.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TEST MODE payment actions */}
            {(canPayReservation || canPayBalance) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-amber-600" />
                  <p className="font-semibold text-amber-800 text-sm">TEST MODE — Simulated Payments</p>
                </div>
                <p className="text-xs text-amber-700 mb-4 leading-relaxed">
                  No real payment processor is configured. Clicking below will simulate a payment for demo purposes.
                  In production, integrate GCash, Maya, or Stripe via a Supabase Edge Function.
                </p>
                {canPayReservation && (
                  <Button onClick={() => setPayModal("reservation_fee")} icon={<CreditCard className="w-4 h-4" />} className="w-full mb-2">
                    Pay Reservation Fee — ₱{split.reservation.toLocaleString()} (TEST)
                  </Button>
                )}
                {canPayBalance && (
                  <Button onClick={() => setPayModal("deposit")} icon={<CreditCard className="w-4 h-4" />} className="w-full">
                    Pay Balance + Deposit — ₱{split.balance.toLocaleString()} (TEST)
                  </Button>
                )}
              </div>
            )}

            {/* Dispute button for active/returned rentals */}
            {["active", "returned"].includes(rental.status) && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                  onClick={() => setDisputeModal(true)}>
                  Report an Issue
                </Button>
              </div>
            )}
          </div>

          {/* Right: timeline + lessor */}
          <div className="space-y-4">
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Transaction Progress</h3>
              <TransactionTimeline steps={timeline} />
            </div>

            {rental.lessor && (
              <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
                <h3 className="font-semibold mb-3">Lessor</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                    {rental.lessor.full_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{rental.lessor.full_name}</p>
                    {rental.lessor.verification_status === "verified" && (
                      <p className="text-xs text-teal-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Verified</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" icon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => navigate(`/renter/messages?with=${rental.lessor_id}&rental=${rental.id}`)}>
                  Message Lessor
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title="Confirm Payment (TEST MODE)"
        footer={
          <>
            <Button variant="outline" onClick={() => setPayModal(null)}>Cancel</Button>
            <Button loading={paying} onClick={handlePayment} icon={<CreditCard className="w-4 h-4" />}>
              Confirm Test Payment
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <strong>TEST MODE:</strong> No real money will be charged. This simulates a payment for demo purposes.
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            You are about to pay{" "}
            <strong>
              ₱{(payModal === "reservation_fee" ? split.reservation : split.balance).toLocaleString()}
            </strong>{" "}
            for {payModal === "reservation_fee" ? "the reservation fee" : "the balance and deposit"}.
          </p>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal
        open={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Cancel Rental"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelModal(false)}>Keep Rental</Button>
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>Cancel Rental</Button>
          </>
        }
      >
        <p className="text-sm text-[var(--muted-foreground)]">
          Are you sure you want to cancel this rental? Cancellation policies as agreed apply.
        </p>
      </Modal>

      {/* Dispute modal */}
      <Modal
        open={disputeModal}
        onClose={() => { setDisputeModal(false); setDispute({ reason: "", description: "" }); }}
        title="Report an Issue"
        footer={
          <>
            <Button variant="outline" onClick={() => setDisputeModal(false)}>Cancel</Button>
            <Button variant="danger" loading={disputeSubmitting} icon={<AlertTriangle className="w-4 h-4" />} onClick={handleDispute}>
              File Dispute
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Filing a dispute will flag this rental for admin review. The rental status will change to <strong>Disputed</strong> and the security deposit will be held until resolved.
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">Reason *</label>
            <select value={dispute.reason} onChange={e => setDispute(d => ({ ...d, reason: e.target.value }))}
              className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[var(--primary)] bg-white">
              <option value="">Select a reason…</option>
              <option value="item_damaged">Item was damaged during rental</option>
              <option value="item_not_as_described">Item not as described</option>
              <option value="item_not_returned">Item not returned on time</option>
              <option value="deposit_not_released">Deposit not released</option>
              <option value="payment_issue">Payment issue</option>
              <option value="safety_concern">Safety concern</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">Description</label>
            <textarea
              rows={4}
              value={dispute.description}
              onChange={e => setDispute(d => ({ ...d, description: e.target.value }))}
              placeholder="Describe what happened in detail. Include dates, amounts, and any relevant context…"
              className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
        </div>
      </Modal>
    </RenterLayout>
  );
}
