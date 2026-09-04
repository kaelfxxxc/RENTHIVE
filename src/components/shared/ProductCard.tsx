import { Heart, MapPin, Star, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Listing } from "../../types";

interface ProductCardProps {
  listing: Listing;
  onFavorite?: (id: string) => void;
  isFavorited?: boolean;
}

const conditionLabel: Record<string, string> = {
  new: "New", like_new: "Like New", good: "Good", fair: "Fair", poor: "Poor",
};
const conditionColor: Record<string, string> = {
  new: "text-emerald-600 bg-emerald-50", like_new: "text-teal-600 bg-teal-50",
  good: "text-blue-600 bg-blue-50", fair: "text-amber-600 bg-amber-50", poor: "text-red-600 bg-red-50",
};

export function ProductCard({ listing, onFavorite, isFavorited }: ProductCardProps) {
  const imageUrl = listing.primary_image_url ||
    `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=280&fit=crop&auto=format`;

  return (
    <div className="group bg-white rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <Link to={`/renter/listing/${listing.id}`} className="block">
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${conditionColor[listing.condition]}`}>
              {conditionLabel[listing.condition]}
            </span>
          </div>
          {onFavorite && (
            <button
              onClick={e => { e.preventDefault(); onFavorite(listing.id); }}
              className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
            </button>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link to={`/renter/listing/${listing.id}`}>
            <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-1 hover:text-[var(--primary)] transition-colors">
              {listing.title}
            </h3>
          </Link>
          <p className="text-sm font-bold text-[var(--primary)] shrink-0">
            ₱{listing.price_per_day.toLocaleString()}<span className="text-xs font-normal text-[var(--muted-foreground)]">/day</span>
          </p>
        </div>

        {listing.city && (
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] mb-2">
            <MapPin className="w-3 h-3" />
            <span>{listing.city}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
              {listing.lessor?.full_name?.[0] || "?"}
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">{listing.lessor?.full_name || "Unknown"}</span>
            {listing.lessor?.verification_status === "verified" && (
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            )}
          </div>
          {listing.average_rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium">{listing.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
