import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { StarRating } from "../../components/ui/StarRating";
import { useAuth } from "../../contexts/AuthContext";

interface ReviewRow {
  id: string;
  overall_rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { full_name: string | null; avatar_url: string | null } | null;
  listing: { title: string } | null;
}

export default function LessorReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [avg, setAvg] = useState(0);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id,overall_rating,comment,created_at,reviewer:profiles!reviews_reviewer_id_fkey(full_name,avatar_url),listing:listings(title)")
      .eq("reviewee_id", user!.id)
      .order("created_at", { ascending: false });
    const rows = (data as unknown as ReviewRow[]) || [];
    setReviews(rows);
    if (rows.length > 0) {
      setAvg(rows.reduce((s, r) => s + r.overall_rating, 0) / rows.length);
    }
    setLoading(false);
  };

  return (
    <LessorLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Reviews</h1>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-xl font-bold">{avg.toFixed(1)}</span>
              <span className="text-sm text-[var(--muted-foreground)]">({reviews.length} reviews)</span>
            </div>
          )}
        </div>

        {loading ? <TableSkeleton /> : reviews.length === 0 ? (
          <EmptyState icon={<Star className="w-8 h-8" />} title="No reviews yet" description="Completed rentals will generate reviews here." />
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 overflow-hidden shrink-0">
                      {r.reviewer?.avatar_url
                        ? <img src={r.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                        : r.reviewer?.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.reviewer?.full_name || "Anonymous"}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{r.listing?.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StarRating value={r.overall_rating} size={14} />
                    <span className="text-xs text-[var(--muted-foreground)]">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-3 leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </LessorLayout>
  );
}
