import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, ArrowUpRight, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { statusBadge } from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";

interface EarningSummary {
  total: number;
  thisMonth: number;
  pending: number;
  paid: number;
}

interface RentalRow {
  id: string;
  status: string;
  rental_fee: number;
  total_amount: number;
  created_at: string;
  listing: { title: string } | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function EarningsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<EarningSummary>({ total: 0, thisMonth: 0, pending: 0, paid: 0 });
  const [rentals, setRentals] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ month: string; earnings: number; rentals: number }[]>([]);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rental_requests")
      .select("id,status,rental_fee,total_amount,created_at,listing:listings(title)")
      .eq("lessor_id", user!.id)
      .in("status", ["confirmed", "active", "returned", "completed"])
      .order("created_at", { ascending: false });

    const rows = (data as unknown as RentalRow[]) || [];
    setRentals(rows);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let total = 0, thisMonth = 0;
    rows.forEach(r => {
      total += r.rental_fee;
      if (new Date(r.created_at) >= thisMonthStart) thisMonth += r.rental_fee;
    });
    setSummary({ total, thisMonth, pending: total * 0.1, paid: total * 0.9 });

    // build last 6 months chart
    const months: { month: string; earnings: number; rentals: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const slice = rows.filter(r => new Date(r.created_at) >= d && new Date(r.created_at) < end);
      months.push({ month: MONTHS[d.getMonth()], earnings: slice.reduce((s, r) => s + r.rental_fee, 0), rentals: slice.length });
    }
    setChartData(months);
    setLoading(false);
  };

  const stats = [
    { label: "Total Earned", value: `₱${summary.total.toLocaleString()}`, icon: <DollarSign className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50" },
    { label: "This Month", value: `₱${summary.thisMonth.toLocaleString()}`, icon: <Calendar className="w-5 h-5 text-teal-600" />, bg: "bg-teal-50" },
    { label: "Released (Est.)", value: `₱${summary.paid.toLocaleString()}`, icon: <ArrowUpRight className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
    { label: "Pending Release", value: `₱${summary.pending.toLocaleString()}`, icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
  ];

  return (
    <LessorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Earnings</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-[var(--muted-foreground)]">{s.label}</span></div>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? <TableSkeleton rows={4} /> : (
          <>
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Earnings Over Last 6 Months</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Earnings"]} />
                  <Area type="monotone" dataKey="earnings" stroke="#D97706" fill="url(#earnGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Monthly Rental Count</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="rentals" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Rental Transactions</h3>
              {rentals.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-6">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
                        <th className="text-left py-2 pb-3">Listing</th>
                        <th className="text-left py-2 pb-3">Date</th>
                        <th className="text-left py-2 pb-3">Status</th>
                        <th className="text-right py-2 pb-3">Rental Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {rentals.map(r => (
                        <tr key={r.id}>
                          <td className="py-3 font-medium truncate max-w-[200px]">{r.listing?.title || "—"}</td>
                          <td className="py-3 text-[var(--muted-foreground)]">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="py-3">{statusBadge(r.status)}</td>
                          <td className="py-3 text-right font-semibold">₱{r.rental_fee.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </LessorLayout>
  );
}
