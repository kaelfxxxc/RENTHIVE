import { useState, useEffect } from "react";
import { Users, Package, DollarSign, AlertTriangle, ShieldCheck, FileText, TrendingUp, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { supabase, db } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { statusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { CardSkeleton } from "../../components/ui/Skeleton";
import type { AdminDashboardStats, AdminMonthlyPoint } from "../../types/database";

const PIE_COLORS = ["#D97706", "#0D9488", "#3B82F6", "#8B5CF6", "#6B7280"];

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

/**
 * Month-over-month change. Returns null when there is no prior-month
 * baseline — we show nothing rather than an invented percentage.
 */
function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function StatCard({ icon, label, value, change, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number | null;
  color: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {change !== null && change !== undefined && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${up ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}
            title="Compared with last month"
          >
            {up ? "+" : ""}{change.toFixed(0)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="h-55 flex items-center justify-center text-center">
      <p className="text-sm text-[var(--muted-foreground)] max-w-[16rem]">{label}</p>
    </div>
  );
}

interface RecentUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [series, setSeries] = useState<AdminMonthlyPoint[]>([]);
  const [categories, setCategories] = useState<{ name: string; value: number }[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);

    // Every aggregate is computed server-side over the full table. Previously
    // these were derived from a 5-row page, so each one silently capped at 5.
    const [statsRes, seriesRes, catRes, usersRes] = await Promise.all([
      db.rpc("admin_dashboard_stats"),
      db.rpc("admin_monthly_series", { p_months: 6 }),
      db.rpc("admin_category_breakdown"),
      supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (statsRes.data) {
      const raw = statsRes.data as Record<string, unknown>;
      // jsonb numerics arrive as strings over the wire.
      const num = (k: string) => Number(raw[k] ?? 0);
      setStats({
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
      });
    }

    setSeries(
      ((seriesRes.data as AdminMonthlyPoint[]) || []).map(p => ({
        ...p,
        gross_volume: Number(p.gross_volume),
        platform_revenue: Number(p.platform_revenue),
        rentals: Number(p.rentals),
        renters: Number(p.renters),
        lessors: Number(p.lessors),
      })),
    );
    setCategories(((catRes.data as { name: string; value: number }[]) || []).map(c => ({ ...c, value: Number(c.value) })));
    setRecentUsers((usersRes.data as RecentUser[]) || []);
    setLoading(false);
  };

  const hasRevenue = series.some(p => p.platform_revenue > 0 || p.rentals > 0);
  const hasUsers = series.some(p => p.renters > 0 || p.lessors > 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Platform Overview</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Real-time platform analytics and management</p>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Users"
              value={String(stats?.total_users ?? 0)} color="bg-blue-50"
              change={pctChange(stats?.users_this_month ?? 0, stats?.users_prev_month ?? 0)} />
            <StatCard icon={<Package className="w-5 h-5 text-amber-600" />} label="Active Rentals"
              value={String(stats?.active_rentals ?? 0)} color="bg-amber-50"
              change={pctChange(stats?.rentals_this_month ?? 0, stats?.rentals_prev_month ?? 0)} />
            <StatCard icon={<DollarSign className="w-5 h-5 text-emerald-600" />} label="Platform Revenue"
              value={peso(stats?.platform_revenue ?? 0)} color="bg-emerald-50"
              change={pctChange(stats?.revenue_this_month ?? 0, stats?.revenue_prev_month ?? 0)} />
            <StatCard icon={<FileText className="w-5 h-5 text-indigo-600" />} label="Total Listings"
              value={String(stats?.total_listings ?? 0)} color="bg-indigo-50" />
            <StatCard icon={<ShieldCheck className="w-5 h-5 text-teal-600" />} label="Pending Verifications"
              value={String(stats?.pending_verifications ?? 0)} color="bg-teal-50" />
            <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="Open Disputes"
              value={String(stats?.open_disputes ?? 0)} color="bg-red-50" />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Completed Rentals"
              value={String(stats?.completed_rentals ?? 0)} color="bg-purple-50" />
            <StatCard icon={<Activity className="w-5 h-5 text-pink-600" />} label="Active Lessors"
              value={String(stats?.lessors ?? 0)} color="bg-pink-50" />
          </div>
        )}

        {/* Charts row 1 */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Platform Revenue &amp; Rentals</h2>
            {!loading && !hasRevenue ? (
              <ChartEmpty label="No completed rentals yet. Revenue will appear here once transactions are completed." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v / 1000}k`} />
                  <Tooltip formatter={(v, n) => [n === "platform_revenue" ? peso(Number(v)) : v, n === "platform_revenue" ? "Revenue" : "Rentals"]} />
                  <Area type="monotone" dataKey="platform_revenue" stroke="#D97706" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Top Categories</h2>
            {!loading && categories.length === 0 ? (
              <ChartEmpty label="No published listings yet." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" outerRadius={80} dataKey="value" // eslint-disable-next-line @typescript-eslint/no-explicit-any
label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* User growth + recent users */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">User Registration Growth</h2>
            {!loading && !hasUsers ? (
              <ChartEmpty label="No registrations in the last 6 months." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={series} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="renters" fill="#D97706" radius={[4, 4, 0, 0]} name="Renters" />
                  <Bar dataKey="lessors" fill="#0D9488" radius={[4, 4, 0, 0]} name="Lessors" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Recent Users</h2>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No users yet</p>
              ) : (
                recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar name={u.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || "Unknown"}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{u.email}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {statusBadge(u.role)}
                      <p className="text-xs text-[var(--muted-foreground)]">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
