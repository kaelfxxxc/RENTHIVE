import { useState, useEffect } from "react";
import { Users, Package, DollarSign, ShoppingBag, AlertTriangle, ShieldCheck } from "lucide-react";
import { db } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { TableSkeleton } from "../../components/ui/Skeleton";
import type { AdminDashboardStats, AdminMonthlyPoint } from "../../types/database";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#D97706", "#0D9488", "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

const EMPTY_STATS: AdminDashboardStats = {
  total_users: 0, renters: 0, lessors: 0, admins: 0,
  total_listings: 0, published_listings: 0,
  active_rentals: 0, completed_rentals: 0,
  pending_verifications: 0, open_disputes: 0,
  gross_volume: 0, platform_revenue: 0,
  users_this_month: 0, users_prev_month: 0,
  rentals_this_month: 0, rentals_prev_month: 0,
  revenue_this_month: 0, revenue_prev_month: 0,
};

/** jsonb numerics arrive as strings, so every field is coerced. */
function toStats(raw: Record<string, unknown>): AdminDashboardStats {
  const num = (k: keyof AdminDashboardStats) => Number(raw[k] ?? 0);
  return {
    total_users: num("total_users"),
    renters: num("renters"),
    lessors: num("lessors"),
    admins: num("admins"),
    total_listings: num("total_listings"),
    published_listings: num("published_listings"),
    active_rentals: num("active_rentals"),
    completed_rentals: num("completed_rentals"),
    pending_verifications: num("pending_verifications"),
    open_disputes: num("open_disputes"),
    gross_volume: num("gross_volume"),
    platform_revenue: num("platform_revenue"),
    users_this_month: num("users_this_month"),
    users_prev_month: num("users_prev_month"),
    rentals_this_month: num("rentals_this_month"),
    rentals_prev_month: num("rentals_prev_month"),
    revenue_this_month: num("revenue_this_month"),
    revenue_prev_month: num("revenue_prev_month"),
  };
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats>(EMPTY_STATS);
  const [monthlyData, setMonthlyData] = useState<AdminMonthlyPoint[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);

    // All three come from the same SQL functions the dashboard uses, so the
    // two pages can no longer disagree about revenue.
    const [statsRes, seriesRes, catRes] = await Promise.all([
      db.rpc("admin_dashboard_stats"),
      db.rpc("admin_monthly_series", { p_months: 6 }),
      db.rpc("admin_category_breakdown"),
    ]);

    if (statsRes.data) setStats(toStats(statsRes.data as Record<string, unknown>));

    setMonthlyData(
      ((seriesRes.data as AdminMonthlyPoint[]) || []).map(p => ({
        ...p,
        gross_volume: Number(p.gross_volume),
        platform_revenue: Number(p.platform_revenue),
        rentals: Number(p.rentals),
        renters: Number(p.renters),
        lessors: Number(p.lessors),
      })),
    );

    setCategoryData(
      ((catRes.data as { name: string; value: number | string }[]) || [])
        .map(c => ({ name: c.name, value: Number(c.value) }))
        .filter(c => c.value > 0),
    );

    setLoading(false);
  };

  const kpis = [
    { label: "Total Users", value: stats.total_users.toLocaleString(), icon: <Users className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
    { label: "Listings", value: stats.total_listings.toLocaleString(), icon: <Package className="w-5 h-5 text-teal-600" />, bg: "bg-teal-50" },
    { label: "Completed Rentals", value: stats.completed_rentals.toLocaleString(), icon: <ShoppingBag className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50" },
    { label: "Platform Revenue", value: peso(stats.platform_revenue), icon: <DollarSign className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
    { label: "Open Disputes", value: stats.open_disputes.toLocaleString(), icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: "bg-red-50" },
    { label: "Pending Verifications", value: stats.pending_verifications.toLocaleString(), icon: <ShieldCheck className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50" },
  ];

  const roleData = [
    { role: "renter", count: stats.renters },
    { role: "lessor", count: stats.lessors },
    { role: "admin", count: stats.admins },
  ];

  const hasRevenue = monthlyData.some(p => p.platform_revenue > 0);
  const hasGrowth = monthlyData.some(p => p.rentals > 0 || p.renters > 0 || p.lessors > 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Analytics &amp; Reports</h1>

        {loading ? <TableSkeleton rows={3} /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.map(k => (
                <div key={k.label} className={`${k.bg} rounded-2xl p-4`}>
                  <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-xs text-[var(--muted-foreground)]">{k.label}</span></div>
                  <p className="text-2xl font-bold">{k.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                <h3 className="font-semibold">Platform Revenue (Last 6 Months)</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Gross transaction volume: {peso(stats.gross_volume)}
                </p>
              </div>
              {!hasRevenue ? (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-10">
                  No completed rentals yet — revenue will chart here once a rental completes.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={v => [peso(Number(v ?? 0)), "Revenue"]} />
                    <Area type="monotone" dataKey="platform_revenue" stroke="#D97706" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
                <h3 className="font-semibold mb-4">User &amp; Rental Growth</h3>
                {!hasGrowth ? (
                  <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No activity in the last 6 months.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="renters" fill="#6366F1" radius={[4, 4, 0, 0]} name="New Renters" />
                      <Bar dataKey="lessors" fill="#F59E0B" radius={[4, 4, 0, 0]} name="New Lessors" />
                      <Bar dataKey="rentals" fill="#0D9488" radius={[4, 4, 0, 0]} name="Rentals" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
                <h3 className="font-semibold mb-4">Published Listings by Category</h3>
                {categoryData.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No published listings yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                        label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}>
                        {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
              <h3 className="font-semibold mb-4">User Role Distribution</h3>
              <div className="flex gap-4 flex-wrap">
                {roleData.map((r, i) => (
                  <div key={r.role} className="flex-1 min-w-24 rounded-xl p-4 text-center" style={{ backgroundColor: PIE_COLORS[i] + "20" }}>
                    <p className="text-2xl font-bold" style={{ color: PIE_COLORS[i] }}>{r.count}</p>
                    <p className="text-sm capitalize text-[var(--muted-foreground)]">{r.role}s</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
