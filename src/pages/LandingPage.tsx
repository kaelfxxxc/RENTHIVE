import { Link } from "react-router-dom";
import { Hexagon, ShieldCheck, Star, ArrowRight, CheckCircle2, Camera, Package, Clock, Wallet, MessageSquare, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";

const categories = [
  { name: "Electronics", icon: "💻", count: 245, slug: "electronics" },
  { name: "Tools & Equipment", icon: "🔧", count: 182, slug: "tools" },
  { name: "Sports & Outdoors", icon: "🏕️", count: 134, slug: "outdoors" },
  { name: "Cameras & Photo", icon: "📷", count: 98, slug: "cameras" },
  { name: "Audio & Music", icon: "🎸", count: 76, slug: "audio" },
  { name: "Vehicles", icon: "🚗", count: 65, slug: "vehicles" },
  { name: "Furniture", icon: "🪑", count: 112, slug: "furniture" },
  { name: "Party Supplies", icon: "🎉", count: 89, slug: "party" },
];

const howItWorks = [
  { step: "01", title: "Register & Verify", desc: "Create your account and verify your identity for a secure marketplace experience." },
  { step: "02", title: "Find or List", desc: "Browse thousands of items to rent, or list your own products to earn extra income." },
  { step: "03", title: "Request & Pay", desc: "Send a rental request, agree on terms, and pay securely through the platform." },
  { step: "04", title: "Handover & Rent", desc: "Coordinate pickup or delivery, document the product condition, and enjoy your rental." },
  { step: "05", title: "Return & Review", desc: "Return the item, complete the condition check, get your deposit back, and leave a review." },
];

const features = [
  { icon: <ShieldCheck className="w-6 h-6 text-teal-600" />, title: "Verified Users", desc: "Every user goes through identity verification before participating in transactions." },
  { icon: <Wallet className="w-6 h-6 text-amber-600" />, title: "Protected Deposits", desc: "Security deposits are tracked and held until the rental is successfully completed." },
  { icon: <Camera className="w-6 h-6 text-blue-600" />, title: "Condition Documentation", desc: "Photo and video documentation at handover and return protects both parties." },
  { icon: <MessageSquare className="w-6 h-6 text-purple-600" />, title: "In-App Messaging", desc: "Communicate directly with lessors or renters within the platform." },
  { icon: <Star className="w-6 h-6 text-amber-500" />, title: "Ratings & Reviews", desc: "Build trust through verified ratings from real completed rentals." },
  { icon: <Clock className="w-6 h-6 text-red-500" />, title: "Dispute Resolution", desc: "Dedicated support for resolving disputes fairly when issues arise." },
];

const faqs = [
  { q: "How does RentHive protect my security deposit?", a: "Your deposit is tracked in our system from the moment you pay it. It's only released after the lessor confirms the product was returned in acceptable condition. If there's a dispute, our team reviews the documentation before any funds are released." },
  { q: "What if the product I rented gets damaged?", a: "Both parties document the product's condition at handover and return with photos and notes. If damage occurred during the rental, the lessor can file a dispute and our team will review the evidence fairly." },
  { q: "How do I become a lessor?", a: "Select 'Lessor' as your account type during registration. After verifying your identity, you can create listings, set your own prices and terms, and start earning from your idle assets." },
  { q: "Is there a fee to use RentHive?", a: "RentHive charges a small platform fee on completed transactions. Listing your products is free. The exact fee structure is shown during the rental request process before you commit." },
  { q: "What happens if a lessor cancels?", a: "If a lessor cancels a confirmed rental, our cancellation policy ensures renters are protected. Refunds are processed according to the agreed cancellation policy shown on the listing." },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAuthChoice, setShowAuthChoice] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hexagon className="w-7 h-7 text-[var(--primary)] fill-amber-100" />
            <span className="font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>RentHive</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--muted-foreground)]">
            <a href="#how-it-works" className="hover:text-[var(--foreground)] transition-colors">How It Works</a>
            <a href="#for-lessors" className="hover:text-[var(--foreground)] transition-colors">For Lessors</a>
            <a href="#security" className="hover:text-[var(--foreground)] transition-colors">Security</a>
            <a href="#faq" className="hover:text-[var(--foreground)] transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Button size="sm" onClick={() => setShowAuthChoice(true)}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[#0F172A] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <div className="w-full h-full" style={{ background: "radial-gradient(ellipse at 80% 50%, #D97706 0%, transparent 70%)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-36 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5 text-sm text-amber-400 mb-6">
              <ShieldCheck className="w-4 h-4" /> Verified peer-to-peer marketplace
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Rent What You Need.<br />
              <span className="text-amber-400">Share What You Own.</span>
            </h1>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              An accessible and secure peer-to-peer rental marketplace connecting people who need products with people who have products to rent.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/renter/home"><Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">Browse Rentals <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              <Link to="/register?role=lessor"><Button size="lg" variant="primary" className="bg-amber-500! hover:bg-amber-600! text-white!">List Your Product</Button></Link>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-white/50">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Identity verified</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Protected deposits</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Dispute resolution</span>
            </div>
          </div>
          <div className="hidden md:block relative">
            <div className="grid grid-cols-2 gap-3">
              {[
                { img: "1553062407-98eeb64c6a62", title: "Power Tools", price: "₱450/day" },
                { img: "1608507719220-2b1e679cee0d", title: "Camera Gear", price: "₱1,200/day" },
                { img: "1558618666-fcd25c85cd64", title: "Camping Equipment", price: "₱600/day" },
                { img: "1484788984921-03950022c38b", title: "Laptop & Accessories", price: "₱800/day" },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-2xl overflow-hidden border border-white/10">
                  <img src={`https://images.unsplash.com/photo-${item.img}?w=300&h=180&fit=crop&auto=format`} alt={item.title} className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <p className="text-xs font-medium text-white">{item.title}</p>
                    <p className="text-xs text-amber-400 font-bold">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section className="bg-white border-b border-[var(--border)] py-6">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 bg-[var(--muted)] rounded-2xl px-5 py-3.5 border border-[var(--border)]">
            <Search className="w-5 h-5 text-[var(--muted-foreground)]" />
            <input placeholder="Search for cameras, tools, tents, vehicles…" className="flex-1 bg-transparent text-sm outline-none" />
            <Link to="/renter/search"><Button size="sm">Search</Button></Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "var(--font-display)" }}>Popular Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map(cat => (
              <Link key={cat.name} to={`/renter/search?category=${cat.slug}`}
                className="flex flex-col items-center p-4 rounded-2xl border border-[var(--border)] hover:border-amber-300 hover:bg-amber-50 transition-all group cursor-pointer text-center">
                <span className="text-3xl mb-2">{cat.icon}</span>
                <p className="text-xs font-semibold text-[var(--foreground)] group-hover:text-amber-700">{cat.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{cat.count} items</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>How RentHive Works</h2>
            <p className="text-[var(--muted-foreground)]">From discovery to return — a secure, documented rental experience.</p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {howItWorks.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-2xl p-5 border border-[var(--border)] h-full">
                  <p className="text-3xl font-bold text-amber-200 mb-3" style={{ fontFamily: "var(--font-display)" }}>{step.step}</p>
                  <h3 className="font-semibold text-sm mb-1.5">{step.title}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{step.desc}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 z-10 w-6 h-6 bg-amber-100 rounded-full items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-amber-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Renters / Lessors */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100">
            <Package className="w-10 h-10 text-amber-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>For Renters</h3>
            <p className="text-[var(--muted-foreground)] mb-5 text-sm leading-relaxed">Access thousands of items without the cost of ownership. From tools you need once to cameras for your next trip.</p>
            <ul className="space-y-2 text-sm mb-6">
              {["Search by location, category, and dates", "View verified lessor profiles and ratings", "Secure payment with deposit protection", "Photo-documented condition verification"].map(item => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{item}</li>
              ))}
            </ul>
            <Link to="/register?role=renter"><Button>Start Renting</Button></Link>
          </div>
          <div id="for-lessors" className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
            <Wallet className="w-10 h-10 text-amber-400 mb-4" />
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>For Lessors</h3>
            <p className="text-white/70 mb-5 text-sm leading-relaxed">Turn your idle assets into income. List anything from power tools to camera equipment and earn while your items aren't in use.</p>
            <ul className="space-y-2 text-sm mb-6">
              {["Set your own prices and availability", "Verified renter profiles before acceptance", "Dashboard analytics and earnings tracking", "Protected deposit system and dispute support"].map(item => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />{item}</li>
              ))}
            </ul>
            <Link to="/register?role=lessor"><Button className="bg-amber-500 hover:bg-amber-600 text-white">Start Listing</Button></Link>
          </div>
        </div>
      </section>

      {/* Security features */}
      <section id="security" className="py-20 bg-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Designed for Secure Transactions</h2>
            <p className="text-[var(--muted-foreground)]">RentHive builds trust through verification, documentation, and fair dispute resolution.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-[var(--border)]">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4">{f.icon}</div>
                <h3 className="font-semibold mb-1.5 text-sm">{f.title}</h3>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-[var(--border)] rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="w-4 h-4 shrink-0 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-4 h-4 shrink-0 text-[var(--muted-foreground)]" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)] pt-3">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#0F172A] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Hexagon className="w-12 h-12 text-amber-400 fill-amber-400/20 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Ready to join RentHive?</h2>
          <p className="text-white/60 mb-8">Register today, verify your identity, and start renting or earning in minutes.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/register"><Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">Create an Account</Button></Link>
            <Link to="/renter/home"><Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">Browse Listings</Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0F1A] text-white/40 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-amber-400/50" />
            <span className="font-semibold text-white/60">RentHive</span>
          </div>
          <p>© {new Date().getFullYear()} RentHive. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/60 transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {showAuthChoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAuthChoice(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0F172A] p-6 text-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-5 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-400/80">Get Started</p>
              <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Choose your account type</h2>
              <p className="mt-2 text-sm text-white/60">Pick the sign-in path that matches how you use RentHive.</p>
            </div>

            <div className="space-y-3">
              <Link to="/login?role=renter" onClick={() => setShowAuthChoice(false)}>
                <Button size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-white">Renter Sign In</Button>
              </Link>
              <Link to="/login?role=lessor" onClick={() => setShowAuthChoice(false)}>
                <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 text-white">Lessor Sign In</Button>
              </Link>
            </div>

            <button
              type="button"
              className="mt-5 w-full text-sm text-white/50 hover:text-white transition-colors"
              onClick={() => setShowAuthChoice(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
