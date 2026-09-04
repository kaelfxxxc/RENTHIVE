import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListPlus, FileText, Package, Calendar, DollarSign, MessageSquare, Star, Bell, User, Settings, LogOut, Hexagon, Menu, X, ChevronLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../ui/Avatar";

interface LessorLayoutProps { children: ReactNode; }

export function LessorLayout({ children }: LessorLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "/lessor/dashboard" },
    { label: "Listings", icon: <ListPlus className="w-5 h-5" />, path: "/lessor/listings" },
    { label: "Requests", icon: <FileText className="w-5 h-5" />, path: "/lessor/requests" },
    { label: "Rentals", icon: <Package className="w-5 h-5" />, path: "/lessor/rentals" },
    { label: "Calendar", icon: <Calendar className="w-5 h-5" />, path: "/lessor/calendar" },
    { label: "Earnings", icon: <DollarSign className="w-5 h-5" />, path: "/lessor/earnings" },
    { label: "Messages", icon: <MessageSquare className="w-5 h-5" />, path: "/lessor/messages" },
    { label: "Reviews", icon: <Star className="w-5 h-5" />, path: "/lessor/reviews" },
    { label: "Notifications", icon: <Bell className="w-5 h-5" />, path: "/lessor/notifications" },
  ];

  const bottomItems = [
    { label: "Profile", icon: <User className="w-5 h-5" />, path: "/lessor/profile" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, path: "/lessor/settings" },
  ];

  const handleSignOut = async () => { await signOut(); navigate("/login"); };
  const isActive = (path: string) => location.pathname.startsWith(path);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? "w-64" : collapsed ? "w-16" : "w-60"} flex flex-col bg-[#0F172A] text-white transition-all duration-200 shrink-0`}>
      <div className={`h-16 flex items-center ${collapsed && !mobile ? "justify-center px-2" : "px-4"} border-b border-white/10`}>
        {(!collapsed || mobile) ? (
          <Link to="/lessor/dashboard" className="flex items-center gap-2">
            <Hexagon className="w-7 h-7 text-amber-400 fill-amber-400/20" />
            <span className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>RentHive</span>
          </Link>
        ) : (
          <Hexagon className="w-7 h-7 text-amber-400 fill-amber-400/20" />
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isActive(item.path) ? "bg-amber-500/20 text-amber-400 border-r-2 border-amber-400" : "text-white/60 hover:bg-white/5 hover:text-white"} ${collapsed && !mobile ? "justify-center px-2" : ""}`}
            title={collapsed && !mobile ? item.label : undefined}>
            {item.icon}
            {(!collapsed || mobile) && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 py-2">
        {bottomItems.map(item => (
          <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isActive(item.path) ? "bg-amber-500/20 text-amber-400" : "text-white/60 hover:bg-white/5 hover:text-white"} ${collapsed && !mobile ? "justify-center px-2" : ""}`}>
            {item.icon}
            {(!collapsed || mobile) && <span>{item.label}</span>}
          </Link>
        ))}
        <button onClick={handleSignOut} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors ${collapsed && !mobile ? "justify-center px-2" : ""}`}>
          <LogOut className="w-5 h-5" />
          {(!collapsed || mobile) && <span>Sign out</span>}
        </button>
      </div>

      {(!collapsed || mobile) && (
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-white/40">Lessor</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--muted)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex relative">
        <Sidebar />
        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 w-6 h-6 bg-white border border-[var(--border)] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10">
          <ChevronLeft className={`w-3 h-3 text-[var(--muted-foreground)] transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar mobile />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-[var(--border)] h-14 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-1"><Menu className="w-5 h-5" /></button>
          <Hexagon className="w-6 h-6 text-[var(--primary)] fill-amber-100" />
          <span className="font-bold" style={{ fontFamily: "var(--font-display)" }}>RentHive</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
