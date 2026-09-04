import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { LessorLayout } from "../../components/layout/LessorLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { ImageUploader } from "../../components/ui/ImageUploader";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import type { Category } from "../../types";

const conditionOpts = [
  { value: "new", label: "New" }, { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" }, { value: "fair", label: "Fair" }, { value: "poor", label: "Poor" },
];

export default function CreateListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", category_id: "", description: "", condition: "good",
    price_per_day: "", price_per_week: "", security_deposit: "", incidental_fee: "",
    location: "", city: "", rental_rules: "", cancellation_policy: "",
    pickup_available: true, delivery_available: false, delivery_fee: "",
  });

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCategories(data || []));
  }, []);

  const set = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: FormEvent, status: "draft" | "pending_review") => {
    e.preventDefault();
    if (!form.title || !form.price_per_day || !form.security_deposit) {
      toastError("Missing fields", "Title, daily price, and security deposit are required.");
      return;
    }
    setSaving(true);
    const { data, error } = await db.from("listings").insert({
      lessor_id: user!.id,
      primary_image_url: primaryImage || null,
      category_id: form.category_id || null,
      title: form.title,
      description: form.description || null,
      condition: form.condition as "new" | "like_new" | "good" | "fair" | "poor",
      price_per_day: parseFloat(form.price_per_day),
      price_per_week: form.price_per_week ? parseFloat(form.price_per_week) : null,
      security_deposit: parseFloat(form.security_deposit),
      incidental_fee: form.incidental_fee ? parseFloat(form.incidental_fee) : null,
      location: form.location || null,
      city: form.city || null,
      status,
      pickup_available: form.pickup_available,
      delivery_available: form.delivery_available,
      delivery_fee: form.delivery_fee ? parseFloat(form.delivery_fee) : null,
      rental_rules: form.rental_rules || null,
      cancellation_policy: form.cancellation_policy || null,
    }).select().single();

    if (error) {
      toastError("Failed to save", error.message);
    } else {
      success(status === "draft" ? "Saved as draft" : "Listing submitted for review");
      navigate("/lessor/listings");
    }
    setSaving(false);
  };

  return (
    <LessorLayout>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-5">
          <ChevronLeft className="w-4 h-4" /> Back to Listings
        </button>
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>Create New Listing</h1>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-4">
            <h2 className="font-semibold">Basic Information</h2>
            <Input label="Product Title *" placeholder="e.g. Canon EOS R5 Camera" value={form.title} onChange={e => set("title", e.target.value)} />
            <Select
              label="Category"
              options={[{ value: "", label: "Select category" }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
              value={form.category_id}
              onChange={e => set("category_id", e.target.value)}
            />
            <div>
              <label className="text-sm font-medium text-[var(--foreground)] block mb-1.5">Description</label>
              <textarea
                placeholder="Describe your product, its features, and usage notes…"
                value={form.description}
                onChange={e => set("description", e.target.value)}
                rows={4}
                className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)]"
              />
            </div>
            <Select label="Condition" options={conditionOpts} value={form.condition} onChange={e => set("condition", e.target.value)} />
          </div>

          {/* Photo */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-4">
            <h2 className="font-semibold">Product Photo</h2>
            <ImageUploader
              label="Primary Image"
              value={primaryImage}
              onChange={setPrimaryImage}
              bucket="listings"
              folder="images"
            />
          </div>

          {/* Pricing */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-4">
            <h2 className="font-semibold">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price Per Day (₱) *" type="number" min="0" placeholder="500" value={form.price_per_day} onChange={e => set("price_per_day", e.target.value)} />
              <Input label="Price Per Week (₱)" type="number" min="0" placeholder="3000" value={form.price_per_week} onChange={e => set("price_per_week", e.target.value)} />
              <Input label="Security Deposit (₱) *" type="number" min="0" placeholder="2000" value={form.security_deposit} onChange={e => set("security_deposit", e.target.value)} />
              <Input label="Incidental Fee (₱)" type="number" min="0" placeholder="Optional" value={form.incidental_fee} onChange={e => set("incidental_fee", e.target.value)} />
            </div>
          </div>

          {/* Location */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-4">
            <h2 className="font-semibold">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" placeholder="Quezon City" value={form.city} onChange={e => set("city", e.target.value)} />
              <Input label="Full Address" placeholder="Barangay / Street" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
          </div>

          {/* Pickup & Delivery */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-4">
            <h2 className="font-semibold">Pickup & Delivery</h2>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.pickup_available} onChange={e => set("pickup_available", e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
                <span className="text-sm">Self-pickup available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.delivery_available} onChange={e => set("delivery_available", e.target.checked)} className="w-4 h-4 accent-[var(--primary)]" />
                <span className="text-sm">Delivery available</span>
              </label>
            </div>
            {form.delivery_available && (
              <Input label="Delivery Fee (₱)" type="number" min="0" placeholder="0 for free delivery" value={form.delivery_fee} onChange={e => set("delivery_fee", e.target.value)} />
            )}
          </div>

          {/* Rules */}
          <div className="bg-white border border-[var(--border)] rounded-xl p-5 space-y-4">
            <h2 className="font-semibold">Rules & Policies</h2>
            <div>
              <label className="text-sm font-medium block mb-1.5">Rental Rules</label>
              <textarea value={form.rental_rules} onChange={e => set("rental_rules", e.target.value)} rows={3}
                placeholder="Any rules renters must follow…" className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)]" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Cancellation Policy</label>
              <textarea value={form.cancellation_policy} onChange={e => set("cancellation_policy", e.target.value)} rows={2}
                placeholder="Your cancellation terms…" className="w-full border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none focus:border-[var(--primary)]" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={e => handleSubmit(e as FormEvent, "draft")} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save as Draft"}
            </Button>
            <Button className="flex-1" onClick={e => handleSubmit(e as FormEvent, "pending_review")} loading={saving}>
              Submit for Review
            </Button>
          </div>
        </div>
      </div>
    </LessorLayout>
  );
}
