import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { RenterLayout } from "../../components/layout/RenterLayout";
import { ProductCard } from "../../components/shared/ProductCard";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import type { Listing, ProductCondition } from "../../types";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const conditionOptions: { value: ProductCondition | ""; label: string }[] = [
  { value: "", label: "Any Condition" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState("newest");
  const [condition, setCondition] = useState<ProductCondition | "">("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const search = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("listings")
      .select("*, lessor:profiles!listings_lessor_id_fkey(id,full_name,avatar_url,verification_status), category:categories(id,name,slug)")
      .eq("status", "published");

    if (query) q = q.ilike("title", `%${query}%`);
    if (condition) q = q.eq("condition", condition);
    if (maxPrice) q = q.lte("price_per_day", parseFloat(maxPrice));
    if (searchParams.get("category")) q = q.eq("category.slug", searchParams.get("category")!);

    if (sort === "price_asc") q = q.order("price_per_day", { ascending: true });
    else if (sort === "price_desc") q = q.order("price_per_day", { ascending: false });
    else if (sort === "rating") q = q.order("average_rating", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    const { data } = await q.limit(24);
    setListings((data as unknown as Listing[]) || []);
    setLoading(false);
  }, [query, sort, condition, maxPrice, searchParams]);

  useEffect(() => { search(); }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

  return (
    <RenterLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 bg-white border border-[var(--border)] rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search listings…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {query && <button type="button" onClick={() => setQuery("")}><X className="w-4 h-4 text-[var(--muted-foreground)]" /></button>}
          </form>

          <div className="flex gap-2">
            <select value={sort} onChange={e => setSort(e.target.value)} className="border border-[var(--border)] bg-white rounded-xl px-3 py-2.5 text-sm outline-none cursor-pointer">
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Button variant="outline" icon={<SlidersHorizontal className="w-4 h-4" />} onClick={() => setShowFilters(!showFilters)}>
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white border border-[var(--border)] rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1.5 block">Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value as ProductCondition | "")} className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none">
                {conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1.5 block">Max Price/Day</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="₱ any" className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {loading ? "Searching…" : `${listings.length} listing${listings.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            title="No listings found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={<Button variant="outline" onClick={() => { setQuery(""); setCondition(""); setMaxPrice(""); }}>Clear filters</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(l => (
              <ProductCard key={l.id} listing={l} onFavorite={id => setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} isFavorited={favorites.has(l.id)} />
            ))}
          </div>
        )}
      </div>
    </RenterLayout>
  );
}
