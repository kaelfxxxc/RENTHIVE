import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Hexagon, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toastError("Error", error.message);
    } else {
      success("Email sent", "Check your inbox for the password reset link.");
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Hexagon className="w-8 h-8 text-[var(--primary)] fill-amber-100" />
            <span className="font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>RentHive</span>
          </Link>
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Enter your email and we&apos;ll send a reset link</p>
        </div>
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" loading={loading} className="w-full" size="lg">Send Reset Link</Button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm text-[var(--muted-foreground)]">Check your inbox at <strong>{email}</strong> for the reset link.</p>
            </div>
          )}
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
