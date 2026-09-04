import { useState, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Hexagon, Eye, EyeOff, Users, Briefcase } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import type { UserRole } from "../../types";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { success, error: toastError } = useToast();

  const presetRole = params.get("role") as UserRole | null;
  const [role, setRole] = useState<UserRole>(presetRole || "renter");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (password !== confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(email, password, { full_name: fullName, phone, role });
    if (error) {
      toastError("Registration failed", error.message);
      setLoading(false);
      return;
    }
    success("Account created!", "Please check your email to verify your account.");
    navigate("/verify-account");
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Join the rental marketplace</p>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8">
          {/* Role badge (when pre-selected from login) */}
          {presetRole ? (
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 ${presetRole === "renter" ? "bg-amber-50 border border-amber-200" : "bg-teal-50 border border-teal-200"}`}>
              {presetRole === "renter"
                ? <Users className="w-5 h-5 text-amber-600 shrink-0" />
                : <Briefcase className="w-5 h-5 text-teal-600 shrink-0" />}
              <div>
                <p className="text-sm font-semibold">{presetRole === "renter" ? "Renter Account" : "Lessor Account"}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{presetRole === "renter" ? "Browse & rent items" : "List & earn from items"}</p>
              </div>
            </div>
          ) : (
            /* Role select (when navigating to /register directly) */
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button type="button" onClick={() => setRole("renter")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "renter" ? "border-[var(--primary)] bg-amber-50" : "border-[var(--border)] hover:border-amber-200"}`}>
                <Users className={`w-6 h-6 ${role === "renter" ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
                <div className="text-center">
                  <p className="text-sm font-semibold">Renter</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Browse & rent items</p>
                </div>
              </button>
              <button type="button" onClick={() => setRole("lessor")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "lessor" ? "border-[var(--primary)] bg-amber-50" : "border-[var(--border)] hover:border-amber-200"}`}>
                <Briefcase className={`w-6 h-6 ${role === "lessor" ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
                <div className="text-center">
                  <p className="text-sm font-semibold">Lessor</p>
                  <p className="text-xs text-[var(--muted-foreground)]">List & earn from items</p>
                </div>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" type="text" placeholder="Maria Santos" value={fullName} onChange={e => setFullName(e.target.value)} error={errors.fullName} required />
            <Input label="Email address" type="email" placeholder="maria@example.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} required />
            <Input label="Phone Number" type="tel" placeholder="+63 9XX XXX XXXX" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} required />
            <Input label="Password" type={showPass ? "text" : "password"} placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} error={errors.password} required
              suffix={<button type="button" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff className="w-4 h-4 text-[var(--muted-foreground)]" /> : <Eye className="w-4 h-4 text-[var(--muted-foreground)]" />}</button>} />
            <Input label="Confirm Password" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} error={errors.confirm} required />

            <p className="text-xs text-[var(--muted-foreground)]">
              By registering, you agree to our{" "}
              <a href="#" className="text-[var(--primary)] hover:underline">Terms of Service</a> and{" "}
              <a href="#" className="text-[var(--primary)] hover:underline">Privacy Policy</a>.
            </p>

            <Button type="submit" loading={loading} className="w-full" size="lg">Create Account</Button>
          </form>

          <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[var(--primary)] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
