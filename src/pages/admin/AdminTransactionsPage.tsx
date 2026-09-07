import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
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

interface Totals { processed: number; held: number; refunded: number; count: number; }

const EMPTY_TOTALS: Totals = { processed: 0, held: 0, refunded: 0, count: 0 };

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [rowsRes, totalsRes] = await Promise.all([
      supabase
        .from("payments")
        .select("id,amount,payment_type,payment_method,status,transaction_ref,notes,created_at,payer:profiles!payments_payer_id_fkey(full_name),rental:rental_requests(id,listing:listings(title))")
        .order("created_at", { ascending: false })
        .limit(200),
      // Totals must cover every payment, not just the 200 rows on screen.
      db.rpc("admin_payment_totals"),
    ]);

    setTxs((rowsRes.data as unknown as TxRow[]) || []);
    if (totalsRes.data) {
      const raw = totalsRes.data as Record<string, unknown>;
      setTotals({
        processed: Number(raw.processed ?? 0),
        held: Number(raw.held ?? 0),
        refunded: Number(raw.refunded ?? 0),
        count: Number(raw.count ?? 0),
      });
    }
    setLoading(false);
  };

  const filtered = txs.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.transaction_ref?.toLowerCase().includes(q) || t.payer?.full_name?.toLowerCase().includes(q) || t.rental?.listing?.title?.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Transactions</h1>
          <div className="flex flex-wrap gap-3">
            <div className="bg-teal-50 rounded-xl px-4 py-2">
              <p className="text-xs text-teal-600">Total Processed</p>
              <p className="text-lg font-bold text-teal-800">₱{Math.round(totals.processed).toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-2">
              <p className="text-xs text-blue-600">Held / Pending</p>
              <p className="text-lg font-bold text-blue-800">₱{Math.round(totals.held).toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-4 py-2">
              <p className="text-xs text-amber-600">Refunded</p>
              <p className="text-lg font-bold text-amber-800">₱{Math.round(totals.refunded).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Input placeholder="Search by ref, payer, or listing..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          {totals.count > txs.length && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Showing the {txs.length} most recent of {totals.count.toLocaleString()} payments. Totals above cover all of them.
            </p>
          )}
        </div>

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
