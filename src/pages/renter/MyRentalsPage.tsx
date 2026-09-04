import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ChevronRight, Star } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { RenterLayout } from "../../components/layout/RenterLayout";
import { Badge, statusBadge } from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import type { RentalRequest } from "../../types";

const tabs = ["all", "active", "pending", "completed", "cancelled"] as const;
type Tab = typeof tabs[number];

export default function MyRentalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (user) loadRentals();
  }, [user, tab]);

  const loadRentals = async () => {
    setLoading(true);
    let q = supabase
      .from("rental_requests")
      .select("*, listing:listings(id,title,primary_image_url,price_per_day), lessor:profiles!rental_requests_lessor_id_fkey(id,full_name,avatar_url)")
      .eq("renter_id", user!.id)
      .order("created_at", { ascending: false });

    if (tab === "active") q = q.in("status", ["confirmed", "active"]);
    else if (tab === "pending") q = q.in("status", ["pending", "accepted", "payment_pending"]);
    else if (tab === "completed") q = q.eq("status", "completed");
    else if (tab === "cancelled") q = q.in("status", ["cancelled", "declined"]);

    const { data } = await q;
    setRentals((data as unknown as RentalRequest[]) || []);
    setLoading(false);
  };

  return (
    <RenterLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>My Rentals</h1>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-colors ${tab === t ? "bg-[var(--primary)] text-white" : "bg-white border border-[var(--border)] hover:bg-[var(--muted)]"}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? <TableSkeleton /> : rentals.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="No rentals yet"
            description="When you rent a product, it will appear here."
            action={<Link to="/renter/search"><Button>Browse Listings</Button></Link>}
          />
        ) : (
          <div className="space-y-3">
            {rentals.map(r => (
              <Link key={r.id} to={`/renter/rentals/${r.id}`}
                className="flex items-center gap-4 bg-white border border-[var(--border)] rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {r.listing?.primary_image_url
                    ? <img src={r.listing.primary_image_url} alt={r.listing.title} className="w-full h-full object-cover" />
                    : <Package className="w-6 h-6 m-auto mt-5 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.listing?.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {new Date(r.start_date).toLocaleDateString()} – {new Date(r.end_date).toLocaleDateString()}
                    {" · "}{r.total_days} day{r.total_days !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">From: {r.lessor?.full_name}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {statusBadge(r.status)}
                  <p className="text-sm font-bold text-[var(--primary)]">₱{r.total_amount.toLocaleString()}</p>
                  {r.status === "completed" && (
                    <button
                      onClick={e => { e.preventDefault(); navigate(`/renter/review/${r.id}`); }}
                      className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <Star className="w-3.5 h-3.5" />Review
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RenterLayout>
  );
}
