/**
 * Unread pill for sidebar / header nav items, capped at 99+ so a large count
 * can't blow out a collapsed sidebar or a bottom-nav cell.
 */
export function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Collapsed-sidebar variant: a dot, since there's no room for a number. */
export function NavDot({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />;
}
