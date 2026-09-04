import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hexagon, Eye, EyeOff, Users, Briefcase, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toastError("Sign in failed", error.message || "Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      navigate("/dashboard");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
    const role = profile?.role;

    if (role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (role === "lessor") navigate("/lessor/dashboard", { replace: true });
    else navigate("/renter/home", { replace: true });

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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Welcome back</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              suffix={
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-[var(--primary)] hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">Sign in</Button>
          </form>

          <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={() => setShowRolePicker(true)} className="text-[var(--primary)] font-medium hover:underline">Create one</button>
          </p>
        </div>
      </div>

      {/* Role picker overlay */}
      {showRolePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowRolePicker(false)}>
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Join RentHive</h2>
              <button onClick={() => setShowRolePicker(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">How would you like to use RentHive?</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/register?role=renter")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border)] hover:border-amber-400 hover:bg-amber-50 transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">I want to rent items</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Browse listings and rent from owners</p>
                </div>
              </button>
              <button
                onClick={() => navigate("/register?role=lessor")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border)] hover:border-teal-400 hover:bg-teal-50 transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-200 transition-colors">
                  <Briefcase className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">I want to list items</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Earn money by renting out your things</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
