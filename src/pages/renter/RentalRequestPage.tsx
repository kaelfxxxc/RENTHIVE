import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, CreditCard, Shield, Loader2 } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { RenterLayout } from "../../components/layout/RenterLayout";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import type { Listing } from "../../types";

export default function RentalRequestPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [pickupOption, setPickupOption] = useState<"pickup" | "delivery">("pickup");

  const startDate = params.get("start") || "";
  const endDate = params.get("end") || "";
  const days = startDate && endDate
    ? Math.max(0, (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  useEffect(() => {
    if (id) supabase.from("listings").select("*, lessor:profiles!listings_lessor_id_fkey(id,full_name)").eq("id", id).single()
      .then(({ data }) => { setListing(data as unknown as Listing); setLoading(false); });
  }, [id]);

  if (loading) return <RenterLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div></RenterLayout>;
  if (!listing) return <RenterLayout><p className="text-center py-20 text-[var(--muted-foreground)]">Listing not found.</p></RenterLayout>;

  const rentalFee = days * listing.price_per_day;
  const deliveryFee = pickupOption === "delivery" ? (listing.delivery_fee || 0) : 0;
  const total = rentalFee + listing.security_deposit + (listing.incidental_fee || 0) + deliveryFee;

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { data, error } = await db.from("rental_requests").insert({
      listing_id: listing.id,
      renter_id: user.id,
      lessor_id: listing.lessor_id,
      start_date: startDate,
      end_date: endDate,
      total_days: days,
      rental_fee: rentalFee,
      security_deposit: listing.security_deposit,
      incidental_fee: listing.incidental_fee,
      delivery_fee: deliveryFee,
      total_amount: total,
      pickup_option: pickupOption,
      status: "pending",
      renter_message: message || null,
    }).select().single();

    if (error) {
      toastError("Request failed", "Unable to submit rental request. Please try again.");
    } else {
      success("Request sent!", "Your rental request has been sent to the lessor.");
      navigate(`/renter/rentals/${data.id}`);
    }
    setSubmitting(false);
  };

  return (
    <RenterLayout>
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>Confirm Rental Request</h1>

        <div className="space-y-4">
          {/* Listing summary */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-sm text-[var(--muted-foreground)] mb-3">Rental Summary</h3>
            <p className="font-bold">{listing.title}</p>
            <p className="text-sm text-[var(--muted-foreground)]">Lessor: {listing.lessor?.full_name}</p>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div className="bg-[var(--muted)] rounded-lg p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Start</p>
                <p className="font-medium">{new Date(startDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-[var(--muted)] rounded-lg p-3">
                <p className="text-xs text-[var(--muted-foreground)]">End</p>
                <p className="font-medium">{new Date(endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Pickup option */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Pickup / Delivery</h3>
            <div className="grid grid-cols-2 gap-3">
              {listing.pickup_available && (
                <button type="button" onClick={() => setPickupOption("pickup")}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${pickupOption === "pickup" ? "border-[var(--primary)] bg-amber-50 text-[var(--primary)]" : "border-[var(--border)]"}`}>
                  Self-pickup<br /><span className="font-normal text-xs text-[var(--muted-foreground)]">Free</span>
                </button>
              )}
              {listing.delivery_available && (
                <button type="button" onClick={() => setPickupOption("delivery")}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${pickupOption === "delivery" ? "border-[var(--primary)] bg-amber-50 text-[var(--primary)]" : "border-[var(--border)]"}`}>
                  Delivery<br /><span className="font-normal text-xs text-[var(--muted-foreground)]">{listing.delivery_fee ? `+₱${listing.delivery_fee}` : "Free"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-2">Message to Lessor <span className="font-normal text-[var(--muted-foreground)]">(optional)</span></h3>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Introduce yourself or add notes about your rental…"
              rows={3}
              className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Price breakdown */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-4 space-y-2 text-sm">
            <h3 className="font-semibold mb-1">Price Breakdown</h3>
            <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">₱{listing.price_per_day.toLocaleString()} × {days} days</span><span>₱{rentalFee.toLocaleString()}</span></div>
            {listing.incidental_fee && <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Incidental fee</span><span>₱{listing.incidental_fee.toLocaleString()}</span></div>}
            {deliveryFee > 0 && <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Delivery fee</span><span>₱{deliveryFee.toLocaleString()}</span></div>}
            <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Security deposit</span><span>₱{listing.security_deposit.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold border-t border-[var(--border)] pt-2">
              <span>Total</span><span className="text-[var(--primary)]">₱{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex gap-3">
            <Shield className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
            <p className="text-xs text-teal-700 leading-relaxed">
              You will only be charged after the lessor accepts your request. The security deposit is refunded after successful return.
            </p>
          </div>

          <Button onClick={handleSubmit} loading={submitting} className="w-full" size="lg" icon={<CreditCard className="w-5 h-5" />}>
            Send Rental Request
          </Button>
        </div>
      </div>
    </RenterLayout>
  );
}
