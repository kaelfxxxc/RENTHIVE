import { useState, useEffect } from "react";
import { Search, Eye, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { statusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import type { Listing } from "../../types";

export default function AdminListingsPage() {
  const { success, error: toastError } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("listings")
      .select("*, lessor:profiles!listings_lessor_id_fkey(id,full_name), category:categories(id,name)")
      .order("created_at", { ascending: false });
    setListings((data as unknown as Listing[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: Listing["status"]) => {
    setProcessing(true);
    const { error } = await db.from("listings").update({ status }).eq("id", id);
    if (error) toastError("Failed", error.message);
    else {
      success(`Listing ${status}`);
      setListings(l => l.map(x => x.id === id ? { ...x, status } : x));
      setSelected(null);
    }
    setProcessing(false);
  };

  const filtered = listings.filter(l => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Listings</h1>

        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[var(--border)] rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings…" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-[var(--border)] bg-white rounded-xl px-3 py-2 text-sm outline-none">
            <option value="">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? <TableSkeleton /> : (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  {["Listing", "Lessor", "Category", "Price/day", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.id} className={`border-b border-[var(--border)] hover:bg-[var(--muted)] ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                          {l.primary_image_url && <img src={l.primary_image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <p className="font-medium max-w-48 truncate">{l.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{l.lessor?.full_name}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{l.category?.name || "–"}</td>
                    <td className="px-4 py-3 font-medium">₱{l.price_per_day.toLocaleString()}</td>
                    <td className="px-4 py-3">{statusBadge(l.status)}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="xs" onClick={() => setSelected(l)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-sm text-[var(--muted-foreground)] py-8">No listings found</p>}
          </div>
        )}
      </div>

      {selected && (
        <Modal open title="Review Listing" onClose={() => setSelected(null)} size="lg">
          <div className="space-y-4">
            {selected.primary_image_url && <img src={selected.primary_image_url} alt={selected.title} className="w-full h-48 object-cover rounded-xl" />}
            <div>
              <h2 className="font-bold text-lg">{selected.title}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">By {selected.lessor?.full_name} · {selected.category?.name}</p>
            </div>
            {selected.description && <p className="text-sm">{selected.description}</p>}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Price/day</p>
                <p className="font-bold">₱{selected.price_per_day.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Deposit</p>
                <p className="font-bold">₱{selected.security_deposit.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--muted)] rounded-xl p-3">
                <p className="text-xs text-[var(--muted-foreground)]">Condition</p>
                <p className="font-bold capitalize">{selected.condition.replace("_", " ")}</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button size="sm" variant="accent" icon={<CheckCircle2 className="w-4 h-4" />} loading={processing} onClick={() => updateStatus(selected.id, "published")}>Approve & Publish</Button>
              <Button size="sm" variant="danger" icon={<XCircle className="w-4 h-4" />} loading={processing} onClick={() => updateStatus(selected.id, "rejected")}>Reject</Button>
              <Button size="sm" variant="secondary" loading={processing} onClick={() => updateStatus(selected.id, "suspended")}>Suspend</Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
