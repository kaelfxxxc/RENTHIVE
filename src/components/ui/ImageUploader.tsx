import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  bucket?: string;
  folder?: string;
}

export function ImageUploader({ value, onChange, label = "Image", bucket = "listings", folder = "images" }: ImageUploaderProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${user!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  if (value) {
    return (
      <div>
        {label && <p className="text-sm font-medium text-[var(--foreground)] mb-1.5">{label}</p>}
        <div className="relative group rounded-xl overflow-hidden border border-[var(--border)]">
          <img src={value} alt="Uploaded" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
              Replace
            </button>
            <button type="button" onClick={() => onChange(null)}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1">
              <X className="w-3 h-3" />Remove
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-sm font-medium text-[var(--foreground)] mb-1.5">{label}</p>}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all ${
          dragOver ? "border-amber-400 bg-amber-50" : "border-[var(--border)] hover:border-amber-300 hover:bg-amber-50/50"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
            <p className="text-sm text-[var(--muted-foreground)]">Uploading…</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              {dragOver ? <Upload className="w-5 h-5 text-amber-500" /> : <ImageIcon className="w-5 h-5 text-[var(--muted-foreground)]" />}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {dragOver ? "Drop to upload" : "Click or drag & drop an image"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">JPG, PNG, WebP — max 10MB</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
