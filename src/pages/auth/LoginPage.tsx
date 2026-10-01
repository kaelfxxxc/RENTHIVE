import { useState, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Users, Briefcase, X, UserRound, Building2, ShieldCheck, MessagesSquare, CalendarDays, Mail, LockKeyhole, ArrowRight, Package, Heart } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { Logo } from "../../components/ui/Logo";
import { supabase } from "../../lib/supabase";
import campingImage from "../../assets/login-camping.jpg";

/**
 * Only same-origin absolute paths are accepted. The value is handed straight
 * to navigate(), so without this a crafted `/login?redirect=https://evil.test`
 * (or the protocol-relative `//evil.test`) would bounce a freshly
 * authenticated user off-site.
 */
function safeRedirect(raw: string | null): string | null {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"renter" | "lessor">(searchParams.get("role") === "lessor" ? "lessor" : "renter");
  const roleLabel = selectedRole === "renter" ? "Renter" : "Rentor";
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const target = safeRedirect(searchParams.get("redirect")) || "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${target}` },
    });
    if (error) toastError("Google sign in unavailable", error.message);
    setGoogleLoading(false);
  };

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

    // Honour where the visitor was headed (e.g. the listing they clicked
    // "Request Rental" on) before falling back to their role's home.
    const target = safeRedirect(searchParams.get("redirect"));
    if (target) navigate(target, { replace: true });
    else if (role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (role === "lessor") navigate("/lessor/dashboard", { replace: true });
    else navigate("/renter/home", { replace: true });

    setLoading(false);
  };

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Welcome to RentHive">
        <Link to="/" className="login-brand"><Logo variant="mark" className="h-16" /><span><span className="login-wordmark">Rent<span>Hive</span></span><span className="login-tagline">PRODUCTS THAT FIT YOUR LIFE</span></span></Link>
        <div className="login-story-copy">
          <h1>Rent what<br />you <span>need.</span></h1>
          <p className="login-intro">Simple renting, made human.</p>
          <div className="login-benefits">
            {[
              { icon: ShieldCheck, title: "Verified products", text: "Quality items from trusted rentors." },
              { icon: MessagesSquare, title: "Secure communication", text: "Chat safely, rent confidently." },
              { icon: CalendarDays, title: "Flexible rental choices", text: "From pickup to return, all in one place." },
            ].map(({ icon: Icon, title, text }) => <div className="login-benefit" key={title}><span className="login-benefit-icon"><Icon size={23} strokeWidth={1.8} /></span><div><h2>{title}</h2><p>{text}</p></div></div>)}
          </div>
        </div>
        <div className="login-collage login-product-collage">
          {[
            { category: "camera", photo: "1516035069371-29a1b244cc32", label: "Camera gear" },
            { category: "tools", photo: "1504148455328-c376907d081c", label: "Power tools" },
            { category: "bike", photo: "1485965120184-e220f721d03e", label: "Bicycles" },
            { category: "tech", photo: "1496181133206-80ce9b88a853", label: "Electronics" },
            { category: "camping", photo: "1478131143081-fd1d858f23f0", label: "Camping gear" },
            { category: "travel", photo: "1553062407-98eeb64c6a62", label: "Travel essentials" },
          ].map(item => <figure key={item.category} className={`login-product login-product-${item.category}`}><img src={item.category === "camping" ? campingImage : `https://images.unsplash.com/photo-${item.photo}?auto=format&fit=crop&w=450&q=85`} alt={item.label} /><figcaption>{item.label}</figcaption></figure>)}
          <div className="login-photo-note"><span><Package size={24} /></span><div><strong>Products for every plan</strong><small>Rent more. Spend less.</small></div></div>
          <div className="login-home-note"><Heart size={21} fill="currentColor" /><div><strong>Access more. Buy less.</strong><small>Find the right item for your next idea.</small></div></div>
        </div>
        <p className="login-story-footer">DISCOVER. CONNECT. RENT.</p>
      </section>

      <section className="login-form-panel" aria-label="Sign in">
        <div className="login-card">
          <header className="login-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue</p>
          </header>
          <form onSubmit={handleSubmit} className="login-form">
            <fieldset className="login-role-fieldset">
              <legend>I'm signing in as</legend>
              <div className="login-role-switch">
                {(["renter", "lessor"] as const).map(role => <button key={role} type="button" aria-pressed={selectedRole === role} disabled={loading || googleLoading} onClick={() => setSelectedRole(role)} className={selectedRole === role ? "is-selected" : ""}>{role === "renter" ? <UserRound size={22} /> : <Building2 size={22} />}{role === "renter" ? "Renter" : "Rentor"}</button>)}
              </div>
            </fieldset>
            <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" prefix={<Mail size={21} />} />
            <div>
              <Input label="Password" type={showPass ? "text" : "password"} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" prefix={<LockKeyhole size={21} />} suffix={<button type="button" aria-label={showPass ? "Hide password" : "Show password"} aria-pressed={showPass} onClick={() => setShowPass(!showPass)} className="login-password-toggle">{showPass ? <EyeOff size={21} /> : <Eye size={21} />}</button>} />
              <div className="login-forgot"><Link to="/forgot-password">Forgot your password?</Link></div>
            </div>
            <Button type="submit" loading={loading} disabled={googleLoading} className="login-submit" size="lg" iconRight={<ArrowRight size={23} />}>Sign in as {roleLabel}</Button>
          </form>
          <div className="login-divider"><span>or continue with</span></div>
          <button type="button" onClick={handleGoogleSignIn} disabled={loading || googleLoading} className="login-google"><svg width="23" height="23" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20H24v8h11.3A12 12 0 1 1 32.8 14l5.7-5.7A20 20 0 1 0 44 24c0-1.4-.1-2.7-.4-4Z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 32.8 14l5.7-5.7A20 20 0 0 0 6.3 14.7Z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44Z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3a12 12 0 0 1-4 5.5l6.2 5.2A20 20 0 0 0 44 24c0-1.4-.1-2.7-.4-4Z"/></svg>{googleLoading ? "Connecting to Google…" : "Continue with Google"}</button>
          <p className="login-register">New to RentHive? <button type="button" onClick={() => setShowRolePicker(true)}>Create an account</button></p>
        </div>
      </section>

      {/* Role picker overlay */}
      {showRolePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowRolePicker(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="login-register-title" className="login-role-modal bg-white rounded-2xl border border-[var(--border)] shadow-xl p-8 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 id="login-register-title" className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>Join RentHive</h2>
              <button aria-label="Close registration options" onClick={() => setShowRolePicker(false)} className="flex items-center justify-center w-11 h-11 shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
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
                onClick={() => navigate("/register?role=rentor")}
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
    </main>
  );
}
