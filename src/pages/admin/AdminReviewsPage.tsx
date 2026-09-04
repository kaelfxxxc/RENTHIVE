import { useState, useEffect } from "react";
import { Star, Trash2 } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";

interface ReviewRow {
  id: string;
  overall_rating: number;
  comment: string | null;
  review_type: string | null;
  created_at: string;
  reviewer: { full_name: string | null } | null;
  reviewee: { full_name: string | null } | null;
  listing: { title: string } | null;
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-100"}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id,overall_rating,comment,review_type,created_at,reviewer:profiles!reviews_reviewer_id_fkey(full_name),reviewee:profiles!reviews_reviewee_id_fkey(full_name),listing:listings(title)")
      .order("created_at", { ascending: false })
      .limit(200);
    setReviews((data as unknown as ReviewRow[]) || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await db.from("reviews").delete().eq("id", deleteTarget.id);
    if (error) toastError("Failed", error.message);
    else { success("Review deleted"); setReviews(r => r.filter(x => x.id !== deleteTarget.id)); setDeleteTarget(null); }
    setDeleting(false);
  };

  const filtered = reviews.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.reviewer?.full_name?.toLowerCase().includes(q) || r.reviewee?.full_name?.toLowerCase().includes(q) || r.listing?.title?.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q);
  });

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.overall_rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Reviews</h1>
          <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-4 py-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-bold">{avgRating}</span>
            <span className="text-sm text-[var(--muted-foreground)]">platform avg ({reviews.length})</span>
          </div>
        </div>

        <Input placeholder="Search by reviewer, reviewee, or listing…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
          <EmptyState icon={<Star className="w-8 h-8" />} title="No reviews" description="Reviews appear here after rentals are completed." />
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <tr>
                    {["Reviewer", "Reviewee", "Listing", "Rating", "Comment", "Type", "Date", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-[var(--muted)] transition-colors">
                      <td className="px-4 py-3 font-medium">{r.reviewer?.full_name || "—"}</td>
                      <td className="px-4 py-3">{r.reviewee?.full_name || "—"}</td>
                      <td className="px-4 py-3 max-w-[140px] truncate text-[var(--muted-foreground)]">{r.listing?.title || "—"}</td>
                      <td className="px-4 py-3"><Stars n={r.overall_rating} /></td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-[var(--muted-foreground)] text-xs">{r.comment || "—"}</td>
                      <td className="px-4 py-3 text-xs capitalize text-[var(--muted-foreground)]">{r.review_type?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="xs" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => setDeleteTarget(r)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!deleteTarget} title="Delete Review" onClose={() => setDeleteTarget(null)}
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--muted-foreground)]">
          Are you sure you want to delete this review by <strong>{deleteTarget?.reviewer?.full_name}</strong>? This cannot be undone.
        </p>
      </Modal>
    </AdminLayout>
  );
}
