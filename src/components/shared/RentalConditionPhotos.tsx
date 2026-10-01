import { useEffect, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import type { RentalRequest } from "../../types";

const BUCKET = "rental-condition-photos";
const stages = [
  { key: "before-shipping", title: "Before shipping", description: "The rentor uploads photos showing the item's condition before sending it to the renter." },
  { key: "after-receiving", title: "After receiving", description: "The renter uploads photos showing the item's condition as soon as it arrives." },
] as const;
type Stage = typeof stages[number]["key"];
type Photo = { url: string; name: string; date: string };

export default function RentalConditionPhotos({ rental }: { rental: RentalRequest }) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [photos, setPhotos] = useState<Record<Stage, Photo[]>>({ "before-shipping": [], "after-receiving": [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [uploading, setUploading] = useState<Stage | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    const load = async () => {
      try {
        const entries = await Promise.all(stages.map(async stage => {
          const owner = stage.key === "before-shipping" ? rental.lessor_id : rental.renter_id;
          const prefix = `${rental.id}/${stage.key}/${owner}`;
          const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
          if (error) throw error;
          const files = (data || []).filter(file => file.id);
          const items = await Promise.all(files.map(async file => {
            const { data: signed, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(`${prefix}/${file.name}`, 3600);
            if (signError) throw signError;
            return { url: signed!.signedUrl, name: file.name, date: file.created_at };
          }));
          return [stage.key, items] as const;
        }));
        if (!cancelled) setPhotos(Object.fromEntries(entries) as Record<Stage, Photo[]>);
      } catch {
        if (!cancelled) setLoadError("Condition photos could not be loaded. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [rental.id, rental.lessor_id, rental.renter_id, revision]);

  const canUpload = (stage: Stage) => !!user && (stage === "before-shipping"
    ? user.id === rental.lessor_id && rental.status === "confirmed"
    : user.id === rental.renter_id && ["confirmed", "active"].includes(rental.status));

  const upload = async (stage: Stage, files: File[]) => {
    if (!canUpload(stage) || uploading || !files.length) return;
    if (files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      toastError("Invalid photo", "Choose JPG, PNG, or WebP images, each 10MB or smaller.");
      return;
    }
    setUploading(stage);
    let uploaded = 0;
    try {
      for (const file of files) {
        const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
        const path = `${rental.id}/${stage}/${user!.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        uploaded++;
      }
      success("Photos uploaded", "Your condition photos have been saved to this rental.");
    } catch {
      toastError("Upload failed", uploaded ? `${uploaded} photo(s) saved. Please retry the remaining photos.` : "Could not save your photos. Please try again.");
    } finally {
      setUploading(null);
      setRevision(value => value + 1);
    }
  };

  return (
    <section className="bg-white border border-[var(--border)] rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold flex items-center gap-2"><Camera className="w-5 h-5 text-[var(--primary)]" />Item Condition Photos</h3>
      <p className="text-sm text-[var(--muted-foreground)]">Document the item from multiple angles, including any existing marks or damage. Both parties can view these photos.</p>
      {loadError && <div role="alert" className="text-sm text-red-600">{loadError} <button type="button" className="underline" onClick={() => setRevision(value => value + 1)}>Retry</button></div>}
      {stages.map(stage => (
        <div key={stage.key} className="border border-[var(--border)] rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold">{stage.title}</h4>
          <p className="text-xs text-[var(--muted-foreground)]">{stage.description}</p>
          {loading ? <Loader2 aria-label="Loading photos" className="w-4 h-4 animate-spin" /> : !loadError && (photos[stage.key].length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos[stage.key].map((photo, index) => <a key={photo.name} href={photo.url} target="_blank" rel="noreferrer" className="block">
                <img src={photo.url} alt={`${stage.title}: item condition photo ${index + 1}`} className="w-full h-28 object-cover rounded-lg" />
                <span className="block text-xs text-[var(--muted-foreground)] mt-1">{new Date(photo.date).toLocaleString()}</span>
              </a>)}
            </div>
          ) : <p className="text-xs text-[var(--muted-foreground)]">No photos uploaded yet.</p>)}
          {canUpload(stage.key) && <label className="block text-sm font-medium">
            {uploading === stage.key ? "Uploading photos…" : "Upload condition photos"}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={!!uploading} className="block w-full mt-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-amber-50 file:px-3 file:py-2 file:text-amber-800 disabled:opacity-50" onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; void upload(stage.key, files); }} />
            <span className="block mt-1 text-xs font-normal text-[var(--muted-foreground)]">JPG, PNG, WebP · max 10MB per photo</span>
          </label>}
        </div>
      ))}
    </section>
  );
}
