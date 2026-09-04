import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Loader2 } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { RenterLayout } from "../../components/layout/RenterLayout";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";

interface RentalInfo {
  id: string;
  lessor_id: string;
  listing_id: string;
  listing: { title: string; primary_image_url: string | null } | null;
  lessor: { full_name: string | null; avatar_url: string | null } | null;
}

function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => onChange(i)}
            className="transition-transform hover:scale-110">
            <Star className={`w-6 h-6 ${i <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-100"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WriteReviewPage() {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [rental, setRental] = useState<RentalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ratings, setRatings] = useState({ overall: 0, communication: 0, accuracy: 0, condition: 0 });
  const [comment, setComment] = useState("");

  useEffect(() => { if (rentalId) load(); }, [rentalId]);

  const load = async () => {
    const { data } = await supabase
      .from("rental_requests")
      .select("id,lessor_id,listing_id,listing:listings(title,primary_image_url),lessor:profiles!rental_requests_lessor_id_fkey(full_name,avatar_url)")
      .eq("id", rentalId!)
      .eq("renter_id", user!.id)
      .single();
    setRental(data as unknown as RentalInfo);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0) { toastError("Rating required", "Please give an overall rating."); return; }
    setSubmitting(true);
    const { error } = await db.from("reviews").insert({
      rental_request_id: rentalId,
      reviewer_id: user!.id,
      reviewee_id: rental!.lessor_id,
      listing_id: rental!.listing_id,
      overall_rating: ratings.overall,
      communication_rating: ratings.communication || null,
      accuracy_rating: ratings.accuracy || null,
      condition_rating: ratings.condition || null,
      comment: comment.trim() || null,
      review_type: "renter_to_lessor",
    });
    if (error) toastError("Failed", error.message);
    else {
      success("Review submitted!", "Thank you for your feedback.");
      navigate("/renter/rentals");
    }
    setSubmitting(false);
  };

  if (loading) return <RenterLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div></RenterLayout>;
  if (!rental) return <RenterLayout><p className="text-center py-20 text-[var(--muted-foreground)]">Rental not found.</p></RenterLayout>;

  const allRated = ratings.overall > 0;

  return (
    <RenterLayout>
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-5 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>Write a Review</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">Share your experience to help other renters.</p>

        {/* Listing info */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-4 flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
            {rental.listing?.primary_image_url && <img src={rental.listing.primary_image_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className="font-semibold">{rental.listing?.title}</p>
            <p className="text-sm text-[var(--muted-foreground)]">Lessor: {rental.lessor?.full_name}</p>
          </div>
        </div>

        {/* Ratings */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 space-y-4 mb-5">
          <h2 className="font-semibold">Ratings</h2>
          <StarPicker label="Overall Experience *" value={ratings.overall} onChange={v => setRatings(r => ({ ...r, overall: v }))} />
          <StarPicker label="Communication" value={ratings.communication} onChange={v => setRatings(r => ({ ...r, communication: v }))} />
          <StarPicker label="Listing Accuracy" value={ratings.accuracy} onChange={v => setRatings(r => ({ ...r, accuracy: v }))} />
          <StarPicker label="Item Condition" value={ratings.condition} onChange={v => setRatings(r => ({ ...r, condition: v }))} />
        </div>

        {/* Comment */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5 mb-5">
          <label className="text-sm font-semibold block mb-2">Your Review</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            placeholder="Describe your experience — was the item as described? How was the handover? Would you recommend this lessor?"
            className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)] transition-colors"
          />
          <p className="text-xs text-[var(--muted-foreground)] mt-1.5">{comment.length}/500 characters</p>
        </div>

        <Button
          onClick={handleSubmit}
          loading={submitting}
          disabled={!allRated}
          className="w-full"
          size="lg"
          icon={<Star className="w-5 h-5" />}
        >
          Submit Review
        </Button>
      </div>
    </RenterLayout>
  );
}
