import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";

interface PublicLayoutProps { children: ReactNode; }

/**
 * Chrome for pages that must render without a session — `/listing/:id` and
 * anything else a signed-out visitor can reach.
 *
 * Deliberately not RenterLayout: that one's nav is entirely protected renter
 * routes and it renders a profile dropdown, so it has nothing sensible to show
 * an anonymous visitor. When someone *is* signed in, the header swaps the
 * sign-in actions for a link back to wherever their role belongs.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  const { profile } = useAuth();

  const homeFor = profile?.role === "admin" ? "/admin/dashboard"
    : profile?.role === "lessor" ? "/lessor/dashboard"
    : "/renter/home";

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo className="h-10" />
          </Link>
          {profile ? (
            <Link to={homeFor}>
              <Button size="sm">Go to dashboard</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/register"><Button size="sm">Create account</Button></Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>

      <footer className="bg-[#0A0F1A] text-white/40 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo className="h-9" />
          <p>© {new Date().getFullYear()} RentHive. All rights reserved.</p>
          <Link to="/" className="hover:text-white/60 transition-colors">Back to home</Link>
        </div>
      </footer>
    </div>
  );
}
