import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Hexagon, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase sends the recovery token in the URL hash; it auto-sets the session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toastError("Mismatch", "Passwords do not match."); return; }
    if (password.length < 6) { toastError("Too short", "Password must be at least 6 characters."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toastError("Failed", error.message);
    else setDone(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hexagon className="w-7 h-7 text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            {done ? "Password Updated" : "Set New Password"}
          </h1>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-6">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto" />
              <p className="text-sm text-[var(--muted-foreground)]">Your password has been updated successfully. You can now sign in with your new password.</p>
              <Button className="w-full" onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          ) : !hasSession ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">This link is invalid or has expired. Please request a new password reset.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate("/forgot-password")}>Request New Link</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                prefix={<Lock className="w-4 h-4" />}
                required
                minLength={6}
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                prefix={<Lock className="w-4 h-4" />}
                required
              />
              <Button type="submit" loading={loading} className="w-full">Update Password</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
