import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { statusBadge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";

interface TxRow {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  status: string;
  transaction_ref: string | null;
  notes: string | null;
  created_at: string;
  payer: { full_name: string | null } | null;
  rental: { id: string; listing: { title: string } | null } | null;
}

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payments")
      .select("id,amount,payment_type,payment_method,status,transaction_ref,notes,created_at,payer:profiles!payments_payer_id_fkey(full_name),rental:rental_requests(id,listing:listings(title))")
      .order("created_at", { ascending: false })
      .limit(200);
    setTxs((data as unknown as TxRow[]) || []);
    setLoading(false);
  };

  const filtered = txs.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.transaction_ref?.toLowerCase().includes(q) || t.payer?.full_name?.toLowerCase().includes(q) || t.rental?.listing?.title?.toLowerCase().includes(q);
  });

  const totalRevenue = txs.filter(t => t.status === "paid").reduce((s, t) => s + t.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Transactions</h1>
          <div className="bg-teal-50 rounded-xl px-4 py-2">
            <p className="text-xs text-teal-600">Total Processed</p>
            <p className="text-lg font-bold text-teal-800">₱{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <Input placeholder="Search by ref, payer, or listing..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
          <EmptyState icon={<CreditCard className="w-8 h-8" />} title="No transactions" description="Payment records appear here." />
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <tr>
                    {["Ref", "Payer", "Listing", "Type", "Method", "Amount", "Status", "Date"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-[var(--muted)] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{t.transaction_ref || "—"}</td>
                      <td className="px-4 py-3">{t.payer?.full_name || "—"}</td>
                      <td className="px-4 py-3 max-w-[140px] truncate">{t.rental?.listing?.title || "—"}</td>
                      <td className="px-4 py-3 capitalize text-[var(--muted-foreground)]">{t.payment_type.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{t.payment_method || "—"}</td>
                      <td className="px-4 py-3 font-semibold">₱{t.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{new Date(t.created_at).toLocaleDateString()}</td>
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
