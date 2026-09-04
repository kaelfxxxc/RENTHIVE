import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Star, ShieldCheck, Calendar, MessageSquare, Heart, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { RenterLayout } from "../../components/layout/RenterLayout";
import { Button } from "../../components/ui/Button";
import { Badge, statusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { StarRating } from "../../components/ui/StarRating";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import type { Listing, Review } from "../../types";

const conditionLabels: Record<string, string> = {
  new: "New", like_new: "Like New", good: "Good", fair: "Fair", poor: "Poor",
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { info } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [favorited, setFavorited] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (id) loadListing();
  }, [id]);

  const loadListing = async () => {
    const { data } = await supabase
      .from("listings")
      .select("*, lessor:profiles!listings_lessor_id_fkey(id,full_name,avatar_url,verification_status,created_at), category:categories(id,name,slug)")
      .eq("id", id!)
      .single();
    if (data) {
      setListing(data as unknown as Listing);
      // Track view
      await db.from("listings").update({ views: ((data as { views?: number }).views || 0) + 1 }).eq("id", id!);
    }

    const { data: rev } = await supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviews_reviewer_id_fkey(id,full_name,avatar_url)")
      .eq("listing_id", id!)
      .order("created_at", { ascending: false })
      .limit(5);
    setReviews((rev as unknown as Review[]) || []);
    setLoading(false);
  };

  const totalDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, diff);
  };

  const handleRent = () => {
    if (!user) { navigate("/login"); return; }
    if (!startDate || !endDate) { info("Select dates", "Please select your rental start and end dates."); return; }
    navigate(`/renter/request/${id}?start=${startDate}&end=${endDate}`);
  };

  const images = listing?.primary_image_url
    ? [listing.primary_image_url]
    : [`https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=500&fit=crop&auto=format`];

  if (loading) return (
    <RenterLayout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    </RenterLayout>
  );

  if (!listing) return (
    <RenterLayout>
      <div className="text-center py-20">
        <p className="text-[var(--muted-foreground)]">Listing not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go back</Button>
      </div>
    </RenterLayout>
  );

  const days = totalDays();
  const total = days * listing.price_per_day + listing.security_deposit + (listing.incidental_fee || 0);

  return (
    <RenterLayout>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Images */}
            <div className="bg-gray-100 rounded-2xl overflow-hidden">
              <img src={images[activeImg]} alt={listing.title} className="w-full h-72 md:h-96 object-cover" />
            </div>

            {/* Title */}
            <div>
              <div className="flex items-start justify-between gap-4">
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
                <button onClick={() => setFavorited(!favorited)} className="p-2 rounded-full border border-[var(--border)] hover:bg-red-50 transition-colors">
                  <Heart className={`w-5 h-5 ${favorited ? "fill-red-500 text-red-500" : "text-[var(--muted-foreground)]"}`} />
                </button>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h3 className="font-semibold mb-2">About this listing</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Rental rules */}
            {listing.rental_rules && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h3 className="font-semibold text-amber-800 mb-2 text-sm">Rental Rules</h3>
                <p className="text-sm text-amber-700 leading-relaxed">{listing.rental_rules}</p>
              </div>
            )}

            {/* Pickup/Delivery */}
            <div>
              <h3 className="font-semibold mb-2">Pickup & Delivery</h3>
              <div className="flex gap-3">
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

            {/* Lessor */}
            {listing.lessor && (
              <div className="border border-[var(--border)] rounded-xl p-4">
                <h3 className="font-semibold mb-3">Lessor</h3>
                <div className="flex items-center gap-3">
                  <Avatar src={listing.lessor.avatar_url} name={listing.lessor.full_name} size="lg" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold">{listing.lessor.full_name}</p>
                      {listing.lessor.verification_status === "verified" && (
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Member since {new Date(listing.lessor.created_at).getFullYear()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" icon={<MessageSquare className="w-4 h-4" />} className="ml-auto"
                    onClick={() => navigate(`/renter/messages?with=${listing.lessor.id}`)}>
                    Message
                  </Button>
                </div>
              </div>
            )}

            {/* Reviews */}
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
                          <StarRating value={r.rating} size={12} />
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

          {/* Booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <p className="text-2xl font-bold text-[var(--primary)]">₱{listing.price_per_day.toLocaleString()}<span className="text-sm font-normal text-[var(--muted-foreground)]">/day</span></p>
                {listing.price_per_week && <p className="text-xs text-[var(--muted-foreground)]">₱{listing.price_per_week.toLocaleString()}/week</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">Start date</label>
                  <input type="date" value={startDate} min={new Date().toISOString().split("T")[0]}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">End date</label>
                  <input type="date" value={endDate} min={startDate || new Date().toISOString().split("T")[0]}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                </div>
              </div>

              {days > 0 && (
                <div className="space-y-2 text-sm border-t border-[var(--border)] pt-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">₱{listing.price_per_day.toLocaleString()} × {days} days</span>
                    <span>₱{(listing.price_per_day * days).toLocaleString()}</span>
                  </div>
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
                  <div className="flex justify-between font-bold border-t border-[var(--border)] pt-2">
                    <span>Total</span>
                    <span className="text-[var(--primary)]">₱{total.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">Deposit refunded after successful return</p>
                </div>
              )}

              <Button onClick={handleRent} className="w-full" size="lg" icon={<Calendar className="w-4 h-4" />}>
                Request Rental
              </Button>
              <p className="text-xs text-center text-[var(--muted-foreground)]">You won't be charged until the lessor accepts</p>
            </div>
          </div>
        </div>
      </div>
    </RenterLayout>
  );
}
