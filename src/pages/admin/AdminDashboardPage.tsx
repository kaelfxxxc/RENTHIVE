import { useState, useEffect } from "react";
import { Users, Package, DollarSign, AlertTriangle, ShieldCheck, FileText, TrendingUp, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, Legend } from "recharts";
import { supabase, db } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { statusBadge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";

const revenueData = [
  { month: "Apr", revenue: 28000, rentals: 32 }, { month: "May", revenue: 43000, rentals: 51 },
  { month: "Jun", revenue: 38000, rentals: 44 }, { month: "Jul", revenue: 55000, rentals: 67 },
  { month: "Aug", revenue: 49000, rentals: 58 }, { month: "Sep", revenue: 61000, rentals: 74 },
];

const userGrowth = [
  { month: "Apr", renters: 18, lessors: 7 }, { month: "May", renters: 25, lessors: 11 },
  { month: "Jun", renters: 22, lessors: 9 }, { month: "Jul", renters: 31, lessors: 14 },
  { month: "Aug", renters: 28, lessors: 12 }, { month: "Sep", renters: 35, lessors: 16 },
];

const categoryData = [
  { name: "Electronics", value: 35 }, { name: "Tools", value: 22 },
  { name: "Cameras", value: 18 }, { name: "Outdoors", value: 15 }, { name: "Other", value: 10 },
];

const PIE_COLORS = ["#D97706", "#0D9488", "#3B82F6", "#8B5CF6", "#6B7280"];

function StatCard({ icon, label, value, change, color }: { icon: React.ReactNode; label: string; value: string; change?: string; color: string }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {change && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{change}</span>}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0, activeRenters: 0, activeLessors: 0, totalListings: 0,
    activeRentals: 0, completedRentals: 0, pendingVerifications: 0, openDisputes: 0,
  });
  const [recentUsers, setRecentUsers] = useState<{ id: string; full_name: string | null; email: string | null; role: string; created_at: string }[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [usersRes, listingsRes, rentalsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, role, verification_status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("listings").select("id, status"),
      supabase.from("rental_requests").select("id, status"),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users: any[] = usersRes.data || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listings: any[] = listingsRes.data || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rentals: any[] = rentalsRes.data || [];

    setStats({
      totalUsers: users.length,
      activeRenters: users.filter((u: { role: string }) => u.role === "renter").length,
      activeLessors: users.filter((u: { role: string }) => u.role === "lessor").length,
      totalListings: listings.length,
      activeRentals: rentals.filter((r: { status: string }) => r.status === "active").length,
      completedRentals: rentals.filter((r: { status: string }) => r.status === "completed").length,
      pendingVerifications: users.filter((u: { verification_status: string }) => u.verification_status === "pending" || u.verification_status === "under_review").length,
      openDisputes: 0,
    });
    setRecentUsers(users as typeof recentUsers);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Platform Overview</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Real-time platform analytics and management</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Users" value={String(stats.totalUsers)} change="+12%" color="bg-blue-50" />
          <StatCard icon={<Package className="w-5 h-5 text-amber-600" />} label="Active Rentals" value={String(stats.activeRentals)} change="+8%" color="bg-amber-50" />
          <StatCard icon={<DollarSign className="w-5 h-5 text-emerald-600" />} label="Platform Revenue" value="₱61,000" change="+24%" color="bg-emerald-50" />
          <StatCard icon={<FileText className="w-5 h-5 text-indigo-600" />} label="Total Listings" value={String(stats.totalListings)} color="bg-indigo-50" />
          <StatCard icon={<ShieldCheck className="w-5 h-5 text-teal-600" />} label="Pending Verifications" value={String(stats.pendingVerifications)} color="bg-teal-50" />
          <StatCard icon={<AlertTriangle className="w-5 h-5 text-red-600" />} label="Open Disputes" value={String(stats.openDisputes)} color="bg-red-50" />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Completed Rentals" value={String(stats.completedRentals)} color="bg-purple-50" />
          <StatCard icon={<Activity className="w-5 h-5 text-pink-600" />} label="Active Lessors" value={String(stats.activeLessors)} color="bg-pink-50" />
        </div>

        {/* Charts row 1 */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Platform Revenue & Rentals</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v / 1000}k`} />
                <Tooltip formatter={(v, n) => [n === "revenue" ? `₱${Number(v).toLocaleString()}` : v, n === "revenue" ? "Revenue" : "Rentals"]} />
                <Area type="monotone" dataKey="revenue" stroke="#D97706" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Top Categories</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" // eslint-disable-next-line @typescript-eslint/no-explicit-any
label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User growth + recent users */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">User Registration Growth</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowth} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="renters" fill="#D97706" radius={[4, 4, 0, 0]} name="Renters" />
                <Bar dataKey="lessors" fill="#0D9488" radius={[4, 4, 0, 0]} name="Lessors" />
              </BarChart>
            </ResponsiveContainer>
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
