import { useState, useEffect } from "react";
import { TrendingUp, Users, Package, DollarSign, ShoppingBag, Star, AlertTriangle, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { TableSkeleton } from "../../components/ui/Skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#D97706", "#0D9488", "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, listings: 0, rentals: 0, revenue: 0, disputes: 0, verifications: 0 });
  const [monthlyData, setMonthlyData] = useState<{ month: string; users: number; rentals: number; revenue: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [roleData, setRoleData] = useState<{ role: string; count: number }[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [usersRes, listingsRes, rentalsRes, disputesRes, verifRes] = await Promise.all([
      supabase.from("profiles").select("id, role, created_at", { count: "exact" }),
      supabase.from("listings").select("id, category_id, status, categories(name)", { count: "exact" }),
      supabase.from("rental_requests").select("id, status, rental_fee, created_at", { count: "exact" }),
      supabase.from("disputes").select("id", { count: "exact" }),
      supabase.from("identity_verifications").select("id, status", { count: "exact" }),
    ]);

    const allUsers: any[] = usersRes.data || [];
    const allListings: any[] = listingsRes.data || [];
    const allRentals: any[] = rentalsRes.data || [];

    const revenue = allRentals.filter(r => ["completed", "returned"].includes(r.status)).reduce((s: number, r: any) => s + (r.rental_fee || 0), 0);

    setStats({
      users: usersRes.count || 0,
      listings: listingsRes.count || 0,
      rentals: rentalsRes.count || 0,
      revenue,
      disputes: disputesRes.count || 0,
      verifications: verifRes.count || 0,
    });

    // Role breakdown
    const roleCounts: Record<string, number> = {};
    allUsers.forEach((u: any) => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
    setRoleData(Object.entries(roleCounts).map(([role, count]) => ({ role, count })));

    // Category breakdown for listings
    const catCounts: Record<string, number> = {};
    allListings.forEach((l: any) => {
      const name = l.categories?.name || "Uncategorized";
      catCounts[name] = (catCounts[name] || 0) + 1;
    });
    setCategoryData(Object.entries(catCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

    // Monthly breakdown (last 6 months)
    const now = new Date();
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const newUsers = allUsers.filter((u: any) => new Date(u.created_at) >= start && new Date(u.created_at) < end).length;
      const monthRentals = allRentals.filter((r: any) => new Date(r.created_at) >= start && new Date(r.created_at) < end);
      const monthRevenue = monthRentals.filter((r: any) => ["completed", "returned"].includes(r.status)).reduce((s: number, r: any) => s + (r.rental_fee || 0), 0);
      monthly.push({ month: MONTHS[start.getMonth()], users: newUsers, rentals: monthRentals.length, revenue: monthRevenue });
    }
    setMonthlyData(monthly);
    setLoading(false);
  };

  const kpis = [
    { label: "Total Users", value: stats.users.toLocaleString(), icon: <Users className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50" },
    { label: "Listings", value: stats.listings.toLocaleString(), icon: <Package className="w-5 h-5 text-teal-600" />, bg: "bg-teal-50" },
    { label: "Rentals", value: stats.rentals.toLocaleString(), icon: <ShoppingBag className="w-5 h-5 text-amber-600" />, bg: "bg-amber-50" },
    { label: "Platform Revenue", value: `₱${stats.revenue.toLocaleString()}`, icon: <DollarSign className="w-5 h-5 text-green-600" />, bg: "bg-green-50" },
    { label: "Active Disputes", value: stats.disputes.toLocaleString(), icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: "bg-red-50" },
    { label: "ID Verifications", value: stats.verifications.toLocaleString(), icon: <ShieldCheck className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Analytics & Reports</h1>

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
              <h3 className="font-semibold mb-4">Platform Revenue (Last 6 Months)</h3>
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
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#D97706" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
                <h3 className="font-semibold mb-4">User & Rental Growth</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#6366F1" radius={[4, 4, 0, 0]} name="New Users" />
                    <Bar dataKey="rentals" fill="#0D9488" radius={[4, 4, 0, 0]} name="Rentals" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
                <h3 className="font-semibold mb-4">Listings by Category</h3>
                {categoryData.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)] text-center py-8">No listings yet.</p>
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
              <div className="flex gap-4">
                {roleData.map((r, i) => (
                  <div key={r.role} className="flex-1 rounded-xl p-4 text-center" style={{ backgroundColor: PIE_COLORS[i] + "20" }}>
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
