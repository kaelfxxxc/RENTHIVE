import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, MoreHorizontal, Package } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { Button } from "../../components/ui/Button";
import { Badge, statusBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import type { Listing } from "../../types";

export default function ListingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => { if (user) loadListings(); }, [user]);

  const loadListings = async () => {
    setLoading(true);
    const { data } = await supabase.from("listings").select("*, category:categories(id,name)").eq("lessor_id", user!.id).order("created_at", { ascending: false });
    setListings((data as unknown as Listing[]) || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await db.from("listings").delete().eq("id", deleteTarget);
    if (error) toastError("Delete failed", error.message);
    else { success("Listing deleted"); setListings(l => l.filter(x => x.id !== deleteTarget)); }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const toggleStatus = async (listing: Listing) => {
    const newStatus = listing.status === "published" ? "unpublished" : "published";
    const { error } = await db.from("listings").update({ status: newStatus }).eq("id", listing.id);
    if (!error) setListings(l => l.map(x => x.id === listing.id ? { ...x, status: newStatus } : x));
    setOpenMenu(null);
  };

  return (
    <LessorLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>My Listings</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{listings.length} listing{listings.length !== 1 ? "s" : ""}</p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate("/lessor/listings/create")}>New Listing</Button>
        </div>

        {loading ? <TableSkeleton /> : listings.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="No listings yet"
            description="Create your first listing to start earning from your idle assets."
            action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate("/lessor/listings/create")}>Create Listing</Button>}
          />
        ) : (
          <div className="space-y-3">
            {listings.map(l => (
              <div key={l.id} className="bg-white border border-[var(--border)] rounded-xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  {l.primary_image_url
                    ? <img src={l.primary_image_url} alt={l.title} className="w-full h-full object-cover" />
                    : <Package className="w-6 h-6 m-auto mt-5 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{l.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{l.category?.name} · ₱{l.price_per_day.toLocaleString()}/day</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{l.views} views · {l.total_rentals} rentals</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {statusBadge(l.status)}
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === l.id ? null : l.id)} className="p-1.5 hover:bg-[var(--muted)] rounded-lg">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenu === l.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                          <Link to={`/renter/listing/${l.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--muted)]" onClick={() => setOpenMenu(null)}><Eye className="w-4 h-4" />View</Link>
                          <Link to={`/lessor/listings/${l.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--muted)]" onClick={() => setOpenMenu(null)}><Edit className="w-4 h-4" />Edit</Link>
                          <button onClick={() => toggleStatus(l)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--muted)]">{l.status === "published" ? "Unpublish" : "Publish"}</button>
                          <button onClick={() => { setDeleteTarget(l.id); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" />Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Listing"
        footer={<><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-[var(--muted-foreground)]">Are you sure you want to delete this listing? This action cannot be undone.</p>
      </Modal>
    </LessorLayout>
  );
}
