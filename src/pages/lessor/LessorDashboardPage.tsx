import { useState, useEffect } from "react";
import { DollarSign, Package, FileText, Star, CheckCircle2, AlertTriangle, TrendingUp, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { supabase } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { Badge, statusBadge } from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import type { RentalRequest } from "../../types";

interface Stats {
  totalEarnings: number;
  activeRentals: number;
  totalListings: number;
  pendingRequests: number;
  completedRentals: number;
  avgRating: number;
}

const mockEarnings = [
  { month: "Apr", earnings: 4200 }, { month: "May", earnings: 6800 },
  { month: "Jun", earnings: 5400 }, { month: "Jul", earnings: 7900 },
  { month: "Aug", earnings: 6200 }, { month: "Sep", earnings: 8400 },
];

const mockRequests = [
  { month: "Apr", accepted: 8, declined: 2 }, { month: "May", accepted: 12, declined: 1 },
  { month: "Jun", accepted: 9, declined: 3 }, { month: "Jul", accepted: 15, declined: 2 },
  { month: "Aug", accepted: 11, declined: 1 }, { month: "Sep", accepted: 14, declined: 2 },
];

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
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

export default function LessorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalEarnings: 0, activeRentals: 0, totalListings: 0, pendingRequests: 0, completedRentals: 0, avgRating: 0 });
  const [recentRequests, setRecentRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    const [listingsRes, requestsRes] = await Promise.all([
      supabase.from("listings").select("id, status").eq("lessor_id", user!.id),
      supabase.from("rental_requests")
        .select("*, listing:listings(id,title,primary_image_url), renter:profiles!rental_requests_renter_id_fkey(id,full_name,avatar_url)")
        .eq("lessor_id", user!.id).order("created_at", { ascending: false }).limit(5),
    ]);

    const listings = listingsRes.data || [];
    const requests = (requestsRes.data as unknown as RentalRequest[]) || [];

    setStats({
      totalEarnings: requests.filter(r => r.status === "completed").reduce((sum, r) => sum + r.total_amount, 0),
      activeRentals: requests.filter(r => r.status === "active").length,
      totalListings: listings.length,
      pendingRequests: requests.filter(r => r.status === "pending").length,
      completedRentals: requests.filter(r => r.status === "completed").length,
      avgRating: 4.7,
    });
    setRecentRequests(requests);
    setLoading(false);
  };

  return (
    <LessorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Overview of your rental business</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<DollarSign className="w-5 h-5 text-emerald-600" />} label="Total Earnings" value={`₱${stats.totalEarnings.toLocaleString()}`} sub="From completed rentals" color="bg-emerald-50" />
          <StatCard icon={<Package className="w-5 h-5 text-blue-600" />} label="Active Rentals" value={String(stats.activeRentals)} sub="Currently rented out" color="bg-blue-50" />
          <StatCard icon={<FileText className="w-5 h-5 text-amber-600" />} label="Pending Requests" value={String(stats.pendingRequests)} sub="Awaiting your response" color="bg-amber-50" />
          <StatCard icon={<Star className="w-5 h-5 text-purple-600" />} label="Avg. Rating" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "–"} sub="From completed rentals" color="bg-purple-50" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />} label="Completed Rentals" value={String(stats.completedRentals)} color="bg-teal-50" />
          <StatCard icon={<Eye className="w-5 h-5 text-indigo-600" />} label="Total Listings" value={String(stats.totalListings)} color="bg-indigo-50" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-pink-600" />} label="Monthly Revenue" value="₱8,400" sub="This month" color="bg-pink-50" />
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="Open Disputes" value="0" color="bg-red-50" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Earnings Over Time</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mockEarnings}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v/1000}k`} />
                <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, "Earnings"]} />
                <Area type="monotone" dataKey="earnings" stroke="#D97706" strokeWidth={2} fill="url(#earningsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Requests: Accepted vs Declined</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockRequests} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="accepted" fill="#10B981" radius={[4, 4, 0, 0]} name="Accepted" />
                <Bar dataKey="declined" fill="#EF4444" radius={[4, 4, 0, 0]} name="Declined" />
              </BarChart>
            </ResponsiveContainer>
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
                    <p className="text-sm font-bold">₱{r.total_amount.toLocaleString()}</p>
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
