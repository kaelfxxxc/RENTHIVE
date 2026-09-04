import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Package, Bell, MessageSquare, User, LogOut, Hexagon, Menu, X, ChevronDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../ui/Avatar";

interface NavItem { label: string; icon: ReactNode; path: string; badge?: number; }

interface RenterLayoutProps { children: ReactNode; }

export function RenterLayout({ children }: RenterLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Home", icon: <Home className="w-5 h-5" />, path: "/renter/home" },
    { label: "Search", icon: <Search className="w-5 h-5" />, path: "/renter/search" },
    { label: "My Rentals", icon: <Package className="w-5 h-5" />, path: "/renter/rentals" },
    { label: "Messages", icon: <MessageSquare className="w-5 h-5" />, path: "/renter/messages" },
    { label: "Notifications", icon: <Bell className="w-5 h-5" />, path: "/renter/notifications" },
  ];

  const handleSignOut = async () => { await signOut(); navigate("/login"); };
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      {/* Desktop Nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-[var(--border)] hidden md:block">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/renter/home" className="flex items-center gap-2">
            <Hexagon className="w-7 h-7 text-[var(--primary)] fill-amber-100" />
            <span className="font-bold text-lg text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>RentHive</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive(item.path) ? "bg-amber-50 text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--muted)] transition-colors">
              <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
              <span className="text-sm font-medium">{profile?.full_name?.split(" ")[0]}</span>
              <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-xl border border-[var(--border)] shadow-lg py-1 overflow-hidden">
                  <Link to="/renter/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--muted)]"><User className="w-4 h-4" />Profile</Link>
                  <hr className="border-[var(--border)] my-1" />
                  <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"><LogOut className="w-4 h-4" />Sign out</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[var(--border)] md:hidden">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/renter/home" className="flex items-center gap-1.5">
            <Hexagon className="w-6 h-6 text-[var(--primary)] fill-amber-100" />
            <span className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>RentHive</span>
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="bg-white border-t border-[var(--border)] px-4 py-2 space-y-1">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive(item.path) ? "bg-amber-50 text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
                {item.icon}{item.label}
              </Link>
            ))}
            <hr className="border-[var(--border)]" />
            <Link to="/renter/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm"><User className="w-5 h-5" />Profile</Link>
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500"><LogOut className="w-5 h-5" />Sign out</button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-[var(--border)] z-40">
        <div className="grid grid-cols-5 h-16">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${isActive(item.path) ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  );
}
