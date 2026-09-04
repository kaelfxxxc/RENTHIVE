import { useState, FormEvent } from "react";
import { ShieldCheck, Hexagon, Loader2 } from "lucide-react";
import { supabase, db } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";

const SETUP_KEY = import.meta.env.VITE_ADMIN_SETUP_KEY || "renthive-admin-2024";

export default function AdminSetupPage() {
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState<"key" | "promote" | "done">("key");
  const [setupKey, setSetupKey] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyKey = (e: FormEvent) => {
    e.preventDefault();
    if (setupKey === SETUP_KEY) setStep("promote");
    else toastError("Invalid key", "The setup key you entered is incorrect.");
  };

  const promoteUser = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Find the user profile by email
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("email", email.trim().toLowerCase())
      .limit(1);

    if (error || !profiles || profiles.length === 0) {
      toastError("User not found", "No account with that email address exists. Make sure they have registered first.");
      setLoading(false);
      return;
    }

    const profile = profiles[0] as { id: string; full_name: string | null; email: string; role: string };

    if (profile.role === "admin") {
      toastError("Already admin", `${profile.email} is already an admin.`);
      setLoading(false);
      return;
    }

    const { error: updateError } = await db.from("profiles").update({ role: "admin" }).eq("id", profile.id);
    if (updateError) {
      toastError("Failed", updateError.message);
    } else {
      success("Admin promoted!", `${profile.full_name || profile.email} is now an admin.`);
      setStep("done");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hexagon className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Admin Setup
          </h1>
          <p className="text-sm text-white/50 mt-1">RentHive platform configuration</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {step === "key" && (
            <form onSubmit={verifyKey} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/80 block mb-1.5">Setup Key</label>
                <input
                  type="password"
                  value={setupKey}
                  onChange={e => setSetupKey(e.target.value)}
                  placeholder="Enter the admin setup key"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400 transition-colors"
                />
                <p className="text-xs text-white/40 mt-1.5">Set via <code className="text-amber-400">VITE_ADMIN_SETUP_KEY</code> env var. Default: <code className="text-amber-400">renthive-admin-2024</code></p>
              </div>
              <Button type="submit" className="w-full">Continue</Button>
            </form>
          )}

          {step === "promote" && (
            <form onSubmit={promoteUser} className="space-y-4">
              <p className="text-sm text-white/70 leading-relaxed">
                Enter the email address of the account you want to promote to <strong className="text-white">Admin</strong>. The user must have already registered.
              </p>
              <div>
                <label className="text-sm font-medium text-white/80 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <Button type="submit" loading={loading} icon={<ShieldCheck className="w-4 h-4" />} className="w-full">
                Promote to Admin
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-teal-400" />
              </div>
              <p className="text-white font-semibold">Admin account ready!</p>
              <p className="text-sm text-white/60">Sign in with the promoted account to access the admin dashboard at <code className="text-amber-400">/admin/dashboard</code>.</p>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => window.location.href = "/login"}>
                Go to Login
              </Button>
              <button onClick={() => { setStep("promote"); setEmail(""); }} className="text-xs text-white/40 hover:text-white/60 transition-colors">
                Promote another account
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          This page is only accessible at <code className="text-white/50">/admin-setup</code>. Remove it after setup.
        </p>
      </div>
    </div>
  );
}
