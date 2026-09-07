import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, ArrowUpRight, Calendar } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { statusBadge } from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import type { LessorEarningsSummary, LessorMonthlyPoint } from "../../types/database";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

interface RentalRow {
  id: string;
  status: string;
  rental_fee: number;
  total_amount: number;
  created_at: string;
  listing: { title: string } | null;
}

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

const EMPTY_SUMMARY: LessorEarningsSummary = {
  gross: 0, net: 0, this_month: 0, released: 0, pending: 0, fee_percent: 0,
};

export default function EarningsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<LessorEarningsSummary>(EMPTY_SUMMARY);
  const [rentals, setRentals] = useState<RentalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<LessorMonthlyPoint[]>([]);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);

    const [summaryRes, seriesRes, rowsRes] = await Promise.all([
      // Released / pending come from real `payments` rows for this lessor's
      // rentals — previously these were invented as total * 0.9 / total * 0.1.
      db.rpc("lessor_earnings_summary", { p_lessor: user!.id }),
      db.rpc("lessor_monthly_series", { p_lessor: user!.id, p_months: 6 }),
      supabase
        .from("rental_requests")
        .select("id,status,rental_fee,total_amount,created_at,listing:listings(title)")
        .eq("lessor_id", user!.id)
        .in("status", ["confirmed", "active", "returned", "completed"])
        .order("created_at", { ascending: false }),
    ]);

    if (summaryRes.data) {
      const raw = summaryRes.data as Record<string, unknown>;
      const num = (k: string) => Number(raw[k] ?? 0);
      setSummary({
        gross: num("gross"),
        net: num("net"),
        this_month: num("this_month"),
        released: num("released"),
        pending: num("pending"),
        fee_percent: num("fee_percent"),
      });
    }

    setChartData(
      ((seriesRes.data as LessorMonthlyPoint[]) || []).map(p => ({
        ...p,
        earnings: Number(p.earnings),
        rentals: Number(p.rentals),
        accepted: Number(p.accepted),
        declined: Number(p.declined),
      })),
    );
    setRentals((rowsRes.data as unknown as RentalRow[]) || []);
    setLoading(false);
  };

  const stats = [
    { label: "Total Earned", value: peso(summary.net), sub: `Net after ${summary.fee_percent}% platform fee`, icon: <DollarSign className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50" },
    { label: "This Month", value: peso(summary.this_month), sub: "Net earnings", icon: <Calendar className="w-5 h-5 text-teal-600" />, bg: "bg-teal-50" },
    { label: "Released", value: peso(summary.released), sub: "Paid out to you", icon: <ArrowUpRight className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
    { label: "Pending Release", value: peso(summary.pending), sub: "Held until completion", icon: <TrendingUp className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
  ];

  const hasEarnings = chartData.some(p => p.earnings > 0);
  const hasRentals = chartData.some(p => p.rentals > 0);

  return (
    <LessorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Earnings</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-[var(--muted-foreground)]">{s.label}</span></div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {loading ? <TableSkeleton rows={4} /> : (
          <>
            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Earnings Over Last 6 Months</h3>
              {!hasEarnings ? (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-10">
                  No completed rentals yet — earnings will chart here once a rental completes.
                </p>
              ) : (
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
                    <Tooltip formatter={v => [peso(Number(v ?? 0)), "Earnings"]} />
                    <Area type="monotone" dataKey="earnings" stroke="#D97706" fill="url(#earnGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Monthly Rental Count</h3>
              {!hasRentals ? (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
                  No rental requests in the last 6 months.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="rentals" fill="#0D9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
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
