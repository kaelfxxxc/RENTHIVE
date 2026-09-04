import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { supabase, db } from "../lib/supabase";
import { EmptyState } from "../components/ui/EmptyState";
import { TableSkeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import type { Notification } from "../types";

const typeIcons: Record<string, string> = {
  rental_request: "📋", request_accepted: "✅", request_declined: "❌",
  payment: "💳", handover: "📦", return: "↩️", dispute: "⚠️",
  review: "⭐", message: "💬", verification: "🔐", default: "🔔",
};

interface NotificationsPageProps {
  layout: React.ComponentType<{ children: React.ReactNode }>;
}

export default function NotificationsPage({ layout: Layout }: NotificationsPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const sub = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        payload => setNotifications(n => [payload.new as Notification, ...n]))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  const markAllRead = async () => {
    await db.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  const markRead = async (id: string) => {
    await db.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  };

  // Triggers store an in-app route on every notification; follow it so the
  // list is a way into the app rather than a dead end.
  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-[var(--muted-foreground)]">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" icon={<CheckCheck className="w-4 h-4" />} onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        {loading ? <TableSkeleton rows={6} /> : notifications.length === 0 ? (
          <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="space-y-1">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl text-left transition-colors ${n.is_read ? "bg-white hover:bg-[var(--muted)]" : "bg-amber-50 border border-amber-100 hover:bg-amber-100"}`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{typeIcons[n.type] || typeIcons.default}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.is_read ? "text-[var(--foreground)]" : "text-amber-900"}`}>{n.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />}
                {n.link && <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
