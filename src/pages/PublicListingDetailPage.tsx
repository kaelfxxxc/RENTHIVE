import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { MapPin, Star, ShieldCheck, Calendar, ChevronLeft, CheckCircle2 } from "lucide-react";
import { supabase, db } from "../lib/supabase";
import { PublicLayout } from "../components/layout/PublicLayout";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { StarRating } from "../components/ui/StarRating";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import type { Listing, Review } from "../types";

const conditionLabels: Record<string, string> = {
  new: "New", like_new: "Like New", good: "Good", fair: "Fair", poor: "Poor",
};

/**
 * Public, session-free view of a single listing — what a signed-out visitor
 * reaches from the landing page. The signed-in renter equivalent is
 * src/pages/renter/ListingDetailPage.tsx, which adds date pickers and the
 * real request flow; this one only has to inform and route to sign-in.
 */
export default function PublicListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { info } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      // maybeSingle(), not single(): "no such listing" and "RLS is hiding this
      // draft/suspended listing" both resolve to null instead of a 406, so a
      // visitor can't tell a hidden listing apart from a nonexistent one.
      const { data } = await supabase
        .from("listings")
        .select("*, lessor:profiles!listings_lessor_id_fkey(id,full_name,avatar_url,verification_status,created_at), category:categories(id,name,slug)")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setListing(data as unknown as Listing);
        // Counted through a definer function because a direct UPDATE is blocked
        // by RLS; it only touches published rows, so it can't probe drafts.
        await db.rpc("increment_listing_views", { p_listing: id });
        if (cancelled) return;

        const { data: rev } = await supabase
          .from("reviews")
          .select("*, reviewer:profiles!reviews_reviewer_id_fkey(id,full_name,avatar_url)")
          .eq("listing_id", id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (cancelled) return;
        setReviews((rev as unknown as Review[]) || []);
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [id]);

  const handleRequest = () => {
    // Signed out: sign in first, then come straight back to this listing.
    if (!user) { navigate(`/login?redirect=/listing/${id}`); return; }
    if (role === "renter") { navigate(`/renter/listing/${id}`); return; }
    info("Renter account required", "Only renter accounts can send rental requests.");
  };

  if (loading) return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="w-full h-72 md:h-96 rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </PublicLayout>
  );

  if (!listing) return (
    <PublicLayout>
      <EmptyState
        title="Listing not found"
        description="This item may have been removed, or it isn't available for public viewing."
        action={<Link to="/"><Button variant="outline" icon={<ChevronLeft className="w-4 h-4" />}>Back to home</Button></Link>}
      />
    </PublicLayout>
  );

  const image = listing.primary_image_url
    || `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=500&fit=crop&auto=format`;
  // Bound once so the lessor block can read fields without re-narrowing.
  const lessor = listing.lessor;

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to browse
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-gray-100 rounded-2xl overflow-hidden">
              <img src={image} alt={listing.title} className="w-full h-72 md:h-96 object-cover" />
            </div>

            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {listing.city && (
                  <span className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
                    <MapPin className="w-4 h-4" />{listing.city}
                  </span>
                )}
                {listing.category && <Badge variant="info">{listing.category.name}</Badge>}
                <Badge variant="default">{conditionLabels[listing.condition]}</Badge>
                {listing.average_rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{listing.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">({reviews.length} reviews)</span>
                  </span>
                )}
              </div>
            </div>

            {listing.description && (
              <div>
                <h3 className="font-semibold mb-2">About this listing</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{listing.description}</p>
              </div>
            )}

            {listing.rental_rules && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h3 className="font-semibold text-amber-800 mb-2 text-sm">Rental Rules</h3>
                <p className="text-sm text-amber-700 leading-relaxed">{listing.rental_rules}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Pickup & Delivery</h3>
              <div className="flex flex-wrap gap-3">
                {listing.pickup_available && (
                  <span className="flex items-center gap-1.5 text-sm bg-[var(--muted)] px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Self-pickup
                  </span>
                )}
                {listing.delivery_available && (
                  <span className="flex items-center gap-1.5 text-sm bg-[var(--muted)] px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Delivery {listing.delivery_fee ? `(+₱${listing.delivery_fee})` : "(free)"}
                  </span>
                )}
              </div>
            </div>

            {lessor && (
              <div className="border border-[var(--border)] rounded-xl p-4">
                <h3 className="font-semibold mb-3">Lessor</h3>
                <div className="flex items-center gap-3">
                  <Avatar src={lessor.avatar_url} name={lessor.full_name} size="lg" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold">{lessor.full_name}</p>
                      {lessor.verification_status === "verified" && (
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Member since {new Date(lessor.created_at).getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Reviews</h3>
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="border border-[var(--border)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar src={r.reviewer?.avatar_url} name={r.reviewer?.full_name} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{r.reviewer?.full_name}</p>
                          <StarRating value={r.overall_rating} size={12} />
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] ml-auto">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      {r.comment && <p className="text-sm text-[var(--muted-foreground)]">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-2xl font-bold text-[var(--primary)]">
                  ₱{listing.price_per_day.toLocaleString()}
                  <span className="text-sm font-normal text-[var(--muted-foreground)]">/day</span>
                </p>
                {listing.price_per_week && (
                  <p className="text-xs text-[var(--muted-foreground)]">₱{listing.price_per_week.toLocaleString()}/week</p>
                )}
              </div>

              <div className="space-y-2 text-sm border-t border-[var(--border)] pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Security deposit</span>
                  <span>₱{listing.security_deposit.toLocaleString()}</span>
                </div>
                {listing.incidental_fee && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Incidental fee</span>
                    <span>₱{listing.incidental_fee.toLocaleString()}</span>
                  </div>
                )}
                {listing.delivery_available && listing.delivery_fee && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Delivery fee</span>
                    <span>₱{listing.delivery_fee.toLocaleString()}</span>
                  </div>
                )}
                <p className="text-xs text-[var(--muted-foreground)] pt-1">Deposit is refunded after a successful return.</p>
              </div>

              <Button onClick={handleRequest} className="w-full" size="lg" icon={<Calendar className="w-4 h-4" />}>
                Request Rental
              </Button>
              <p className="text-xs text-center text-[var(--muted-foreground)]">
                {user
                  ? "You won't be charged until the lessor accepts"
                  : "You'll be asked to sign in first"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
