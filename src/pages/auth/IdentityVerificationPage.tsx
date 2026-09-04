import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ShieldCheck, CheckCircle2, X } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";

const ID_TYPES = [
  { value: "", label: "Select ID type" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID (PhilSys)" },
  { value: "postal_id", label: "Postal ID" },
  { value: "voter_id", label: "Voter's ID" },
  { value: "sss", label: "SSS ID" },
  { value: "umid", label: "UMID" },
];

interface FileUploadProps {
  label: string;
  hint?: string;
  file: File | null;
  onChange: (f: File | null) => void;
}

function FileUpload({ label, hint, file, onChange }: FileUploadProps) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--foreground)] block mb-1.5">{label}</label>
      {file ? (
        <div className="flex items-center gap-3 border border-emerald-300 bg-emerald-50 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-sm text-emerald-800 flex-1 truncate">{file.name}</span>
          <button type="button" onClick={() => onChange(null)} className="text-emerald-600 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 border-2 border-dashed border-[var(--border)] rounded-xl p-5 cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-all">
          <Upload className="w-5 h-5 text-[var(--muted-foreground)]" />
          <span className="text-sm text-[var(--muted-foreground)]">Click to upload</span>
          {hint && <span className="text-xs text-[var(--muted-foreground)]">{hint}</span>}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => onChange(e.target.files?.[0] || null)} />
        </label>
      )}
    </div>
  );
}

export default function IdentityVerificationPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const filePath = `${path}/${user!.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("identity-documents").upload(filePath, file);
    if (error) return null;
    const { data } = supabase.storage.from("identity-documents").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!idType || !frontFile || !selfieFile) {
      toastError("Missing documents", "Please provide ID type, front of ID, and a selfie.");
      return;
    }
    setSubmitting(true);

    const [frontUrl, backUrl, selfieUrl] = await Promise.all([
      uploadFile(frontFile, "front"),
      backFile ? uploadFile(backFile, "back") : Promise.resolve(null),
      uploadFile(selfieFile, "selfie"),
    ]);

    if (!frontUrl || !selfieUrl) {
      toastError("Upload failed", "Could not upload your documents. Please try again.");
      setSubmitting(false);
      return;
    }

    const { error } = await db.from("identity_verifications").insert({
      user_id: user!.id,
      id_type: idType,
      id_number: idNumber || null,
      front_image_url: frontUrl,
      back_image_url: backUrl || null,
      selfie_url: selfieUrl,
      status: "pending",
      submitted_at: new Date().toISOString(),
    });

    if (!error) {
      await db.from("profiles").update({ verification_status: "pending" }).eq("id", user!.id);
      await refreshProfile();
      success("Documents submitted!", "Your identity verification is under review.");
      navigate(profile?.role === "lessor" ? "/lessor/dashboard" : "/renter/home");
    } else {
      toastError("Submission failed", error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[var(--muted)] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Identity Verification</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Your documents are stored securely and never shared publicly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white border border-[var(--border)] rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold">Government ID</h2>
            <Select label="ID Type *" options={ID_TYPES} value={idType} onChange={e => setIdType(e.target.value)} />
            <Input label="ID Number" placeholder="Optional" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
            <FileUpload label="Front of ID *" hint="JPG, PNG, or PDF — max 5MB" file={frontFile} onChange={setFrontFile} />
            <FileUpload label="Back of ID" hint="If applicable" file={backFile} onChange={setBackFile} />
          </div>

          <div className="bg-white border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Selfie with ID</h2>
            <FileUpload label="Photo holding your ID *" hint="Hold your ID next to your face — must be clearly visible" file={selfieFile} onChange={setSelfieFile} />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
            <strong>Privacy notice:</strong> Your documents are stored in a private, access-controlled storage bucket.
            They are only visible to authorized platform administrators for verification purposes. They will not be shared with third parties.
          </div>

          <Button type="submit" loading={submitting} className="w-full" size="lg" icon={<ShieldCheck className="w-5 h-5" />}>
            Submit for Verification
          </Button>
        </form>
      </div>
    </div>
  );
}
