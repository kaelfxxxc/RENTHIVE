interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base", xl: "w-16 h-16 text-xl" };

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden bg-amber-100 flex items-center justify-center shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name || "User"} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-amber-700">{initials(name)}</span>
      )}
    </div>
  );
}
