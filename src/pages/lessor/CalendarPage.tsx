import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { statusBadge } from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  listing: { title: string } | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-400",
  active: "bg-teal-400",
  pending: "bg-amber-400",
  payment_pending: "bg-yellow-400",
  default: "bg-gray-300",
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [today] = useState(new Date());
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const { data } = await supabase
      .from("rental_requests")
      .select("id,start_date,end_date,status,listing:listings(title)")
      .eq("lessor_id", user!.id)
      .in("status", ["pending", "payment_pending", "confirmed", "active", "returned"]);
    setBookings((data as unknown as Booking[]) || []);
  };

  const prevMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const firstDay = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const bookingsOnDay = (day: number) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    return bookings.filter(b => {
      const s = new Date(b.start_date);
      const e = new Date(b.end_date);
      return date >= s && date <= e;
    });
  };

  const upcomingBookings = bookings
    .filter(b => new Date(b.start_date) >= today)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 6);

  return (
    <LessorLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Calendar</h1>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">
                {month.toLocaleString("default", { month: "long", year: "numeric" })}
              </h2>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => <p key={d} className="text-center text-xs text-[var(--muted-foreground)] font-medium py-1">{d}</p>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const dayBookings = bookingsOnDay(day);
                const isToday = day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
                return (
                  <div key={day} className={`min-h-[52px] rounded-lg p-1 text-xs ${isToday ? "bg-amber-50 ring-1 ring-amber-400" : "hover:bg-[var(--muted)]"}`}>
                    <span className={`text-xs font-medium ${isToday ? "text-amber-700" : "text-[var(--foreground)]"}`}>{day}</span>
                    <div className="space-y-0.5 mt-0.5">
                      {dayBookings.slice(0, 2).map(b => (
                        <div key={b.id} className={`w-full rounded px-1 py-0.5 text-white text-[9px] truncate ${STATUS_COLORS[b.status] || STATUS_COLORS.default}`}>
                          {b.listing?.title || "Rental"}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <span className="text-[9px] text-[var(--muted-foreground)]">+{dayBookings.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--primary)]" />Upcoming Bookings
            </h3>
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No upcoming bookings.</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(b => (
                  <div key={b.id} className="border-l-2 border-amber-400 pl-3">
                    <p className="text-sm font-medium truncate">{b.listing?.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {new Date(b.start_date).toLocaleDateString()} – {new Date(b.end_date).toLocaleDateString()}
                    </p>
                    <div className="mt-1">{statusBadge(b.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </LessorLayout>
  );
}
