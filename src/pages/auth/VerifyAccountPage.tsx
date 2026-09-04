import { Link } from "react-router-dom";
import { Hexagon, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/Button";

export default function VerifyAccountPage() {
  return (
    <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <Hexagon className="w-8 h-8 text-[var(--primary)] fill-amber-100" />
          <span className="font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>RentHive</span>
        </Link>
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Check your email</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
            We sent a verification link to your email address. Click the link to verify your account and continue.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-2">Next steps after verification:</p>
            <ul className="space-y-1.5 text-xs text-amber-700">
              {["Verify your email address", "Complete identity verification", "Wait for account approval", "Start renting or listing"].map((step, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <Link to="/login"><Button variant="outline" className="w-full">Back to Sign In</Button></Link>
        </div>
      </div>
    </div>
  );
}
