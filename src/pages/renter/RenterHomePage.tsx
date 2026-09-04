import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { RenterLayout } from "../../components/layout/RenterLayout";
import { ProductCard } from "../../components/shared/ProductCard";
import { Button } from "../../components/ui/Button";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAuth } from "../../contexts/AuthContext";
import type { Listing } from "../../types";

const categories = [
  { name: "Electronics", emoji: "💻", slug: "electronics" },
  { name: "Tools", emoji: "🔧", slug: "tools" },
  { name: "Outdoors", emoji: "🏕️", slug: "outdoors" },
  { name: "Cameras", emoji: "📷", slug: "cameras" },
  { name: "Audio", emoji: "🎸", slug: "audio" },
  { name: "Vehicles", emoji: "🚗", slug: "vehicles" },
  { name: "Furniture", emoji: "🪑", slug: "furniture" },
  { name: "Party", emoji: "🎉", slug: "party" },
];

export default function RenterHomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*, lessor:profiles!listings_lessor_id_fkey(id,full_name,avatar_url,verification_status), category:categories(id,name,slug)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12);
    setListings((data as unknown as Listing[]) || []);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/renter/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <RenterLayout>
      <div className="space-y-8">
        {/* Welcome + search */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-6 md:p-8 text-white">
          <p className="text-amber-400 text-sm font-medium mb-1">Good day 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
            {profile?.full_name ? `Hello, ${profile.full_name.split(" ")[0]}!` : "What are you looking to rent?"}
          </h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
              <Search className="w-4 h-4 text-white/50 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for cameras, tools, tents…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
              {searchQuery && (
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <MapPin className="w-3 h-3" />
                  <span>Manila</span>
                </div>
              )}
            </div>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">Search</Button>
          </form>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Browse Categories</h2>
            <Link to="/renter/search" className="text-sm text-[var(--primary)] flex items-center gap-1 hover:underline">View all <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {categories.map(cat => (
              <Link key={cat.slug} to={`/renter/search?category=${cat.slug}`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border)] bg-white hover:border-amber-300 hover:bg-amber-50 transition-all text-center">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-[var(--foreground)]">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Featured Rentals</h2>
            <Link to="/renter/search" className="text-sm text-[var(--primary)] flex items-center gap-1 hover:underline">See all <ChevronRight className="w-4 h-4" /></Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              title="No listings yet"
              description="Be the first to discover rentals when they become available."
              action={<Button variant="outline" onClick={loadListings} icon={<Loader2 className="w-4 h-4" />}>Refresh</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map(l => (
                <ProductCard key={l.id} listing={l} onFavorite={toggleFavorite} isFavorited={favorites.has(l.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </RenterLayout>
  );
}
