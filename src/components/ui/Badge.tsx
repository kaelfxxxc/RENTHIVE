import { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted" | "amber" | "teal";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  muted: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  amber: "bg-amber-100 text-amber-800",
  teal: "bg-teal-50 text-teal-700",
};

export function Badge({ children, variant = "default", className = "", dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${variantClasses[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    published: { label: "Published", variant: "success" },
    active: { label: "Active", variant: "success" },
    completed: { label: "Completed", variant: "teal" },
    verified: { label: "Verified", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    pending_review: { label: "Pending Review", variant: "warning" },
    payment_pending: { label: "Payment Pending", variant: "warning" },
    under_review: { label: "Under Review", variant: "info" },
    confirmed: { label: "Confirmed", variant: "info" },
    accepted: { label: "Accepted", variant: "info" },
    draft: { label: "Draft", variant: "muted" },
    unpublished: { label: "Unpublished", variant: "muted" },
    not_started: { label: "Not Started", variant: "muted" },
    declined: { label: "Declined", variant: "danger" },
    rejected: { label: "Rejected", variant: "danger" },
    suspended: { label: "Suspended", variant: "danger" },
    cancelled: { label: "Cancelled", variant: "danger" },
    disputed: { label: "Disputed", variant: "danger" },
    returned: { label: "Returned", variant: "amber" },
    resubmission_required: { label: "Resubmit Required", variant: "warning" },
    held: { label: "Held", variant: "info" },
    paid: { label: "Paid", variant: "success" },
    released: { label: "Released", variant: "success" },
    refunded: { label: "Refunded", variant: "teal" },
    open: { label: "Open", variant: "danger" },
    resolved: { label: "Resolved", variant: "success" },
    closed: { label: "Closed", variant: "muted" },
  };
  const config = map[status] || { label: status, variant: "default" as BadgeVariant };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
}
