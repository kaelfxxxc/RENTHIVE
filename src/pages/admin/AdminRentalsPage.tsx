import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { statusBadge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import type { RentalStatus } from "../../types";

interface RentalRow {
  id: string;
  status: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  renter: { full_name: string | null } | null;
  lessor: { full_name: string | null } | null;
  listing: { title: string } | null;
}

const STATUSES: (RentalStatus | "all")[] = ["all", "pending", "accepted", "payment_pending", "confirmed", "active", "returned", "completed", "cancelled", "disputed", "declined"];

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RentalStatus | "all">("all");

  useEffect(() => { load(); }, [filter]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("rental_requests")
      .select("id,status,total_amount,start_date,end_date,created_at,renter:profiles!rental_requests_renter_id_fkey(full_name),lessor:profiles!rental_requests_lessor_id_fkey(full_name),listing:listings(title)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRentals((data as unknown as RentalRow[]) || []);
    setLoading(false);
  };

  const filtered = rentals.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.listing?.title?.toLowerCase().includes(q) || r.renter?.full_name?.toLowerCase().includes(q) || r.lessor?.full_name?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>All Rentals</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Search by listing, renter, or lessor..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-sm" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${filter === s ? "bg-[#0F172A] text-white" : "bg-white border border-[var(--border)] hover:bg-[var(--muted)]"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
          <EmptyState icon={<Package className="w-8 h-8" />} title="No rentals found" description="Adjust your filters." />
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <tr>
                    {["Listing", "Renter", "Lessor", "Dates", "Total", "Status", "Created"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-[var(--muted)] transition-colors">
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate">{r.listing?.title || "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.renter?.full_name || "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.lessor?.full_name || "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                        {new Date(r.start_date).toLocaleDateString()} – {new Date(r.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold">₱{r.total_amount.toLocaleString()}</td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
