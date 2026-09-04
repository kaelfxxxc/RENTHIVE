import { useState, useEffect } from "react";
import { DollarSign, Package, FileText, Star, CheckCircle2, AlertTriangle, TrendingUp, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from "recharts";
import { supabase, db } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { statusBadge } from "../../components/ui/Badge";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../contexts/AuthContext";
import type { RentalRequest } from "../../types";
import type { LessorDashboardStats, LessorMonthlyPoint } from "../../types/database";

const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      {sub && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{sub}</p>}
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="h-50 flex items-center justify-center text-center">
      <p className="text-sm text-[var(--muted-foreground)] max-w-[16rem]">{label}</p>
    </div>
  );
}

export default function LessorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<LessorDashboardStats | null>(null);
  const [series, setSeries] = useState<LessorMonthlyPoint[]>([]);
  const [recentRequests, setRecentRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);

    const [statsRes, seriesRes, requestsRes] = await Promise.all([
      // Aggregates run over every row server-side. They used to be derived
      // from the 5-row preview query below, so they capped at 5.
      db.rpc("lessor_dashboard_stats", { p_lessor: user!.id }),
      db.rpc("lessor_monthly_series", { p_lessor: user!.id, p_months: 6 }),
      supabase.from("rental_requests")
        .select("*, listing:listings(id,title,primary_image_url), renter:profiles!rental_requests_renter_id_fkey(id,full_name,avatar_url)")
        .eq("lessor_id", user!.id).order("created_at", { ascending: false }).limit(5),
    ]);

    if (statsRes.data) {
      const raw = statsRes.data as Record<string, unknown>;
      const num = (k: string) => Number(raw[k] ?? 0);
      setStats({
        total_listings: num("total_listings"),
        published_listings: num("published_listings"),
        active_rentals: num("active_rentals"),
        pending_requests: num("pending_requests"),
        completed_rentals: num("completed_rentals"),
        total_earnings: num("total_earnings"),
        month_earnings: num("month_earnings"),
        avg_rating: raw.avg_rating === null || raw.avg_rating === undefined ? null : Number(raw.avg_rating),
        review_count: num("review_count"),
        open_disputes: num("open_disputes"),
        total_views: num("total_views"),
      });
    }

    setSeries(
      ((seriesRes.data as LessorMonthlyPoint[]) || []).map(p => ({
        ...p,
        earnings: Number(p.earnings),
        rentals: Number(p.rentals),
        accepted: Number(p.accepted),
        declined: Number(p.declined),
      })),
    );
    setRecentRequests((requestsRes.data as unknown as RentalRequest[]) || []);
    setLoading(false);
  };

  const hasEarnings = series.some(p => p.earnings > 0);
  const hasRequests = series.some(p => p.accepted > 0 || p.declined > 0);

  return (
    <LessorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Overview of your rental business</p>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<DollarSign className="w-5 h-5 text-emerald-600" />} label="Total Earnings"
              value={peso(stats?.total_earnings ?? 0)} sub="Net of platform fee" color="bg-emerald-50" />
            <StatCard icon={<Package className="w-5 h-5 text-blue-600" />} label="Active Rentals"
              value={String(stats?.active_rentals ?? 0)} sub="Currently rented out" color="bg-blue-50" />
            <StatCard icon={<FileText className="w-5 h-5 text-amber-600" />} label="Pending Requests"
              value={String(stats?.pending_requests ?? 0)} sub="Awaiting your response" color="bg-amber-50" />
            <StatCard icon={<Star className="w-5 h-5 text-purple-600" />} label="Avg. Rating"
              value={stats?.avg_rating ? stats.avg_rating.toFixed(1) : "–"}
              sub={stats?.review_count ? `From ${stats.review_count} review${stats.review_count === 1 ? "" : "s"}` : "No reviews yet"}
              color="bg-purple-50" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />} label="Completed Rentals"
              value={String(stats?.completed_rentals ?? 0)} color="bg-teal-50" />
            <StatCard icon={<Eye className="w-5 h-5 text-indigo-600" />} label="Total Listings"
              value={String(stats?.total_listings ?? 0)}
              sub={`${stats?.total_views ?? 0} total views`} color="bg-indigo-50" />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-pink-600" />} label="Monthly Revenue"
              value={peso(stats?.month_earnings ?? 0)} sub="This month" color="bg-pink-50" />
            <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="Open Disputes"
              value={String(stats?.open_disputes ?? 0)} color="bg-red-50" />
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Earnings Over Time</h2>
            {!loading && !hasEarnings ? (
              <ChartEmpty label="No completed rentals yet. Your earnings will chart here once a rental completes." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v / 1000}k`} />
                  <Tooltip formatter={(v) => [peso(Number(v)), "Earnings"]} />
                  <Area type="monotone" dataKey="earnings" stroke="#D97706" strokeWidth={2} fill="url(#earningsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Requests: Accepted vs Declined</h2>
            {!loading && !hasRequests ? (
              <ChartEmpty label="No rental requests in the last 6 months." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={series} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="accepted" fill="#10B981" radius={[4, 4, 0, 0]} name="Accepted" />
                  <Bar dataKey="declined" fill="#EF4444" radius={[4, 4, 0, 0]} name="Declined" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent requests */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Recent Requests</h2>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-6">No rental requests yet</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {r.listing?.primary_image_url
                      ? <img src={r.listing.primary_image_url} alt={r.listing?.title} className="w-full h-full object-cover" />
                      : <Package className="w-5 h-5 m-auto mt-2.5 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.listing?.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {r.renter?.full_name} · {new Date(r.start_date).toLocaleDateString()} – {new Date(r.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-bold">{peso(r.total_amount)}</p>
                    {statusBadge(r.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LessorLayout>
  );
}
