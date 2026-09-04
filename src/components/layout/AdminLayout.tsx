import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ShieldCheck, ListPlus, Package, CreditCard, AlertTriangle, Star, BarChart2, Settings, FileText, LogOut, Hexagon, Menu, Bell, Search, ChevronLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../ui/Avatar";

interface AdminLayoutProps { children: ReactNode; }

export function AdminLayout({ children }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", icon: <LayoutDashboard className="w-4.5 h-4.5" />, path: "/admin/dashboard" },
        { label: "Analytics", icon: <BarChart2 className="w-4.5 h-4.5" />, path: "/admin/reports" },
      ],
    },
    {
      label: "Users",
      items: [
        { label: "Users", icon: <Users className="w-4.5 h-4.5" />, path: "/admin/users" },
        { label: "Verifications", icon: <ShieldCheck className="w-4.5 h-4.5" />, path: "/admin/verifications" },
      ],
    },
    {
      label: "Marketplace",
      items: [
        { label: "Listings", icon: <ListPlus className="w-4.5 h-4.5" />, path: "/admin/listings" },
        { label: "Rentals", icon: <Package className="w-4.5 h-4.5" />, path: "/admin/rentals" },
        { label: "Transactions", icon: <CreditCard className="w-4.5 h-4.5" />, path: "/admin/transactions" },
        { label: "Disputes", icon: <AlertTriangle className="w-4.5 h-4.5" />, path: "/admin/disputes" },
        { label: "Reviews", icon: <Star className="w-4.5 h-4.5" />, path: "/admin/reviews" },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Audit Logs", icon: <FileText className="w-4.5 h-4.5" />, path: "/admin/audit-logs" },
        { label: "Settings", icon: <Settings className="w-4.5 h-4.5" />, path: "/admin/settings" },
      ],
    },
  ];

  const handleSignOut = async () => { await signOut(); navigate("/login"); };
  const isActive = (path: string) => location.pathname.startsWith(path);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? "w-64" : collapsed ? "w-16" : "w-56"} flex flex-col bg-[#0F172A] text-white h-full transition-all duration-200`}>
      <div className={`h-16 flex items-center border-b border-white/10 ${collapsed && !mobile ? "justify-center" : "px-5 gap-2.5"}`}>
        {(!collapsed || mobile) ? (
          <>
            <Hexagon className="w-7 h-7 text-amber-400 fill-amber-400/20 shrink-0" />
            <div>
              <p className="font-bold text-sm leading-none" style={{ fontFamily: "var(--font-display)" }}>RentHive</p>
              <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">Admin</p>
            </div>
          </>
        ) : (
          <Hexagon className="w-7 h-7 text-amber-400 fill-amber-400/20" />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {navSections.map(section => (
          <div key={section.label} className="mb-1">
            {(!collapsed || mobile) && (
              <p className="text-[10px] uppercase tracking-widest text-white/30 px-5 py-2">{section.label}</p>
            )}
            {section.items.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 py-2.5 text-sm font-medium transition-colors ${collapsed && !mobile ? "justify-center px-2" : "px-5"} ${isActive(item.path) ? "bg-amber-500/20 text-amber-400" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                title={collapsed && !mobile ? item.label : undefined}>
                {item.icon}
                {(!collapsed || mobile) && item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button onClick={handleSignOut} className={`w-full flex items-center gap-3 px-2 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ${collapsed && !mobile ? "justify-center" : ""}`}>
          <LogOut className="w-4.5 h-4.5" />
          {(!collapsed || mobile) && "Sign out"}
        </button>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2 px-2 mt-2 pt-2 border-t border-white/10">
            <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-white/40">Administrator</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex relative">
        <SidebarContent />
        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 w-6 h-6 bg-white border border-[var(--border)] rounded-full flex items-center justify-center shadow-sm z-10">
          <ChevronLeft className={`w-3 h-3 text-[var(--muted-foreground)] transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden"><SidebarContent mobile /></div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 bg-white border-b border-[var(--border)] h-14 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-1"><Menu className="w-5 h-5" /></button>
          <div className="flex-1 hidden md:flex items-center gap-2 max-w-md bg-[var(--muted)] rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
            <input placeholder="Search users, listings, rentals..." className="flex-1 bg-transparent text-sm outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]" />
          </div>
          <div className="flex-1 md:hidden" />
          <button className="relative p-2 hover:bg-[var(--muted)] rounded-xl">
            <Bell className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
          <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
