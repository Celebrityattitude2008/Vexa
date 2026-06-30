import { Link } from "react-router";
import { useState, useEffect } from "react";
import {
  Shield, Zap, Eye, Globe, Lock, Activity, ChevronRight,
  CheckCircle2, AlertTriangle, Server, Cloud, Database,
  ArrowRight, Users, BarChart3, Search, Bell,
  Cpu, Network, FileText, Menu, X,
} from "lucide-react";

const STATS = [
  { value: "50K+", label: "Assets Scanned", icon: Server },
  { value: "2.4M", label: "Vulnerabilities Found", icon: AlertTriangle },
  { value: "99.9%", label: "Platform Uptime", icon: Activity },
  { value: "340ms", label: "Avg Scan Response", icon: Zap },
];

const FEATURES = [
  {
    icon: Search,
    color: "cyan",
    title: "Continuous Asset Discovery",
    desc: "Automatically enumerate subdomains, APIs, cloud assets, and services across your entire attack surface. Real-time DNS resolution via HackerTarget and Google DoH.",
  },
  {
    icon: AlertTriangle,
    color: "orange",
    title: "CVE & Vulnerability Detection",
    desc: "Detect 20+ vulnerability classes including RCE, SQLi, XSS, SSRF, and authentication bypasses. Mapped to CVSS scoring and NVD CVE database in real time.",
  },
  {
    icon: Eye,
    color: "purple",
    title: "Attack Graph Visualization",
    desc: "Visualize lateral movement paths, trust relationships, and exploit chains across your infrastructure with interactive SVG attack graphs.",
  },
  {
    icon: Cloud,
    color: "blue",
    title: "Multi-Cloud Coverage",
    desc: "Scan AWS, GCP, and Azure assets. Detect misconfigured S3 buckets, exposed IAM roles, open security groups, and unauthenticated cloud services.",
  },
  {
    icon: Shield,
    color: "green",
    title: "AI Risk Intelligence",
    desc: "ML-powered risk scoring aggregates findings across ports, CVEs, technologies, and certificates into a single prioritized risk score per asset.",
  },
  {
    icon: FileText,
    color: "pink",
    title: "Compliance Reporting",
    desc: "Generate executive summaries, technical audit reports, and compliance documentation. Export findings in structured formats for SOC2, ISO 27001, and PCI-DSS.",
  },
  {
    icon: Bell,
    color: "yellow",
    title: "Real-Time Alerting",
    desc: "Instant notifications for critical findings, new asset discovery, and scan completion. Configurable alert thresholds per severity and asset type.",
  },
  {
    icon: Network,
    color: "teal",
    title: "Exposure Map",
    desc: "Infrastructure heat-map clusters assets by type and risk, showing the blast radius of compromised components across your environment.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect Your Target",
    desc: "Enter a domain, IP range, or cloud environment. Vexa's scan engine immediately begins DNS resolution and asset enumeration.",
    icon: Globe,
  },
  {
    step: "02",
    title: "Deep Scan & Enumerate",
    desc: "Port discovery, service detection, TLS inspection, and technology fingerprinting run in parallel across all discovered assets.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Vulnerability Assessment",
    desc: "Each asset is analyzed against 20+ vulnerability categories using CVE databases, threat intelligence feeds, and VirusTotal integration.",
    icon: Shield,
  },
  {
    step: "04",
    title: "Prioritize & Remediate",
    desc: "AI-ranked findings with CVSS scores, CVE links, and step-by-step remediation guidance. Generate reports for your security team.",
    icon: BarChart3,
  },
];

const SCAN_TYPES = [
  { name: "Full Infrastructure", time: "~10 min", badge: "Most Popular" },
  { name: "Port Scan", time: "~2 min", badge: null },
  { name: "Subdomain Enumeration", time: "~3 min", badge: null },
  { name: "Cloud Asset Discovery", time: "~5 min", badge: null },
  { name: "Certificate Validation", time: "~1 min", badge: null },
  { name: "Vulnerability Scan", time: "~8 min", badge: "Deep" },
  { name: "API Discovery", time: "~4 min", badge: null },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-300 bg-red-500/15 border-red-500/30",
  high: "text-orange-300 bg-orange-500/15 border-orange-500/30",
  medium: "text-yellow-300 bg-yellow-500/15 border-yellow-500/30",
  low: "text-green-300 bg-green-500/15 border-green-500/30",
};

const SAMPLE_FINDINGS = [
  { title: "Log4Shell RCE — Apache Log4j2", severity: "critical", cvss: "10.0", cve: "CVE-2021-44228", asset: "api.example.com" },
  { title: "HTTP/2 Rapid Reset (DoS)", severity: "high", cvss: "7.5", cve: "CVE-2023-44487", asset: "cdn.example.com" },
  { title: "TLS 1.0/1.1 Deprecated Protocol", severity: "medium", cvss: "5.9", cve: null, asset: "mail.example.com" },
  { title: "Missing HTTP Security Headers", severity: "low", cvss: "3.1", cve: null, asset: "www.example.com" },
];

const colorMap: Record<string, string> = {
  cyan:   "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
  orange: "text-orange-300 bg-orange-500/15 border-orange-500/30",
  purple: "text-purple-300 bg-purple-500/15 border-purple-500/30",
  blue:   "text-blue-300 bg-blue-500/15 border-blue-500/30",
  green:  "text-green-300 bg-green-500/15 border-green-500/30",
  pink:   "text-pink-300 bg-pink-500/15 border-pink-500/30",
  yellow: "text-yellow-300 bg-yellow-500/15 border-yellow-500/30",
  teal:   "text-teal-300 bg-teal-500/15 border-teal-500/30",
};

function AnimatedOrb({ cx, cy, r, color, dur }: { cx: string; cy: string; r: string; color: string; dur: string }) {
  return (
    <circle cx={cx} cy={cy} r={r} fill={color} opacity="0.06">
      <animate attributeName="r" values={`${r};${parseInt(r) * 1.3};${r}`} dur={dur} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.06;0.12;0.06" dur={dur} repeatCount="indefinite" />
    </circle>
  );
}

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveFeature(f => (f + 1) % FEATURES.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#07070d] text-gray-100 overflow-x-hidden">
      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#07070d]/95 backdrop-blur-xl border-b border-[#1a1a2e] shadow-xl" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">VEXA</span>
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-medium">Security</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["Privacy", "/privacy"]].map(([label, href]) => (
                href.startsWith("/") ? (
                  <Link key={label} to={href} className="text-sm text-gray-300 hover:text-white transition-colors font-medium">{label}</Link>
                ) : (
                  <a key={label} href={href} className="text-sm text-gray-300 hover:text-white transition-colors font-medium">{label}</a>
                )
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex text-sm text-gray-200 hover:text-white transition-colors px-4 py-2 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                className="md:hidden p-2 text-gray-300 hover:text-white"
                onClick={() => setMenuOpen(v => !v)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0d0d18] border-b border-[#1a1a2e] px-4 py-4 space-y-3">
            {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Privacy", "/privacy"]].map(([label, href]) => (
              href.startsWith("/") ? (
                <Link key={label} to={href} onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2 font-medium">{label}</Link>
              ) : (
                <a key={label} href={href} onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2 font-medium">{label}</a>
              )
            ))}
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-300 hover:text-white py-2 font-medium">Sign In</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="g1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="g2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
            </defs>
            <AnimatedOrb cx="720" cy="350" r="400" color="url(#g1)" dur="8s" />
            <AnimatedOrb cx="200" cy="200" r="250" color="url(#g2)" dur="12s" />
            <AnimatedOrb cx="1200" cy="600" r="300" color="url(#g1)" dur="10s" />
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 76} y1="0" x2={i * 76} y2="900" stroke="white" strokeOpacity="0.025" strokeWidth="1" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 75} x2="1440" y2={i * 75} stroke="white" strokeOpacity="0.025" strokeWidth="1" />
            ))}
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Enterprise Attack Surface Management
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-white">
            Discover Every
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Vulnerability
            </span>
            <br />
            Before Attackers Do
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Vexa is a continuous attack surface management platform that automatically
            discovers, maps, and assesses vulnerabilities across your entire infrastructure —
            subdomains, APIs, cloud assets, ports, CVEs, and certificates.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:opacity-90 transition-all shadow-2xl shadow-cyan-500/25 w-full sm:w-auto justify-center"
            >
              Start Free Scan
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#111118] border border-[#2a2a3e] text-gray-200 font-semibold text-lg hover:bg-[#16161f] hover:border-[#363650] transition-all w-full sm:w-auto justify-center"
            >
              See Features
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl bg-[#111118] border border-[#1e1e2e] p-4 text-center">
                <s.icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO PREVIEW ────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl bg-[#0d0d18] border border-[#1e1e2e] overflow-hidden shadow-2xl shadow-black/50">
            {/* Fake browser bar */}
            <div className="bg-[#0a0a12] border-b border-[#1a1a28] px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 bg-[#111118] rounded-md px-3 py-1 text-xs text-gray-400 font-mono text-center border border-[#1e1e2e]">
                app.vexa.security — Attack Surface Dashboard
              </div>
            </div>
            {/* Mock dashboard content */}
            <div className="p-6 space-y-4">
              {/* Top metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Findings", val: "47", color: "text-orange-300" },
                  { label: "Completed Scans", val: "8", color: "text-green-300" },
                  { label: "Active Scans", val: "2", color: "text-cyan-300" },
                  { label: "Assets Found", val: "63", color: "text-purple-300" },
                ].map(m => (
                  <div key={m.label} className="bg-[#111118] rounded-lg border border-[#1e1e2e] p-3">
                    <div className={`text-2xl font-bold ${m.color}`}>{m.val}</div>
                    <div className="text-xs text-gray-400 mt-0.5 font-medium">{m.label}</div>
                  </div>
                ))}
              </div>
              {/* Sample findings table */}
              <div className="rounded-lg bg-[#0a0a12] border border-[#1a1a28] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#1a1a28] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold text-gray-100">Latest Findings</span>
                </div>
                <div className="divide-y divide-[#1a1a28]">
                  {SAMPLE_FINDINGS.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${SEVERITY_COLORS[f.severity]}`}>
                          {f.severity}
                        </span>
                        <span className="text-gray-200 truncate font-medium">{f.title}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        {f.cve && <span className="text-xs text-gray-400 font-mono hidden sm:inline">{f.cve}</span>}
                        <span className="text-xs text-gray-400 hidden md:inline">{f.asset}</span>
                        <span className="text-xs font-bold text-white bg-[#1a1a28] px-1.5 py-0.5 rounded">{f.cvss}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Platform Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-white">Everything You Need to Secure<br className="hidden sm:inline" /> Your Attack Surface</h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-base">
              From continuous asset discovery to AI-powered risk scoring, Vexa covers the
              entire vulnerability lifecycle in a single platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => {
              const colors = colorMap[f.color] || colorMap["cyan"];
              const isActive = activeFeature === i;
              return (
                <div
                  key={f.title}
                  onMouseEnter={() => setActiveFeature(i)}
                  className={`rounded-xl border p-5 cursor-pointer transition-all duration-300 ${
                    isActive
                      ? `${colors} shadow-lg`
                      : "bg-[#0f0f1a] border-[#1e1e2e] hover:bg-[#13131f] hover:border-[#2a2a3e]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${isActive ? "bg-white/10" : "bg-[#1a1a28]"}`}>
                    <f.icon className={`w-5 h-5 ${isActive ? colors.split(" ")[0] : "text-gray-300"}`} />
                  </div>
                  <h3 className="font-semibold mb-2 text-sm text-white">{f.title}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Process</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-white">How Vexa Works</h2>
            <p className="text-gray-300 max-w-xl mx-auto text-base">
              From target entry to prioritized remediation in minutes — fully automated.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%_-_12px)] w-full h-px bg-gradient-to-r from-cyan-500/40 to-transparent z-10" />
                )}
                <div className="rounded-2xl bg-[#0f0f1a] border border-[#1e1e2e] p-6 h-full">
                  <div className="text-5xl font-black text-[#1e1e2e] mb-4 leading-none select-none">{step.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-4">
                    <step.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold mb-2 text-white">{step.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCAN TYPES ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Scan Modes</span>
              <h2 className="text-3xl font-bold mt-3 mb-4 text-white">7 Specialized Scan Types</h2>
              <p className="text-gray-300 mb-8 leading-relaxed text-base">
                Each scan mode is optimized for a specific attack surface. Run a 10-minute full
                infrastructure scan for a complete picture, or focus on specific vectors.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                Run Your First Scan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {SCAN_TYPES.map(s => (
                <div key={s.name} className="flex items-center justify-between rounded-xl bg-[#0f0f1a] border border-[#1e1e2e] px-4 py-3 hover:bg-[#13131f] hover:border-[#2a2a3e] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-100">{s.name}</span>
                    {s.badge && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">{s.badge}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 font-medium">{s.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK / INTEGRATIONS ────────────────────────────────────────── */}
      <section className="py-16 px-4 border-y border-[#1a1a28]">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-8 font-semibold">Intelligence Powered By</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
            {[
              { name: "HackerTarget", icon: Search },
              { name: "VirusTotal", icon: Shield },
              { name: "NVD / CVE", icon: Database },
              { name: "Google DoH", icon: Globe },
              { name: "Firebase", icon: Cloud },
              { name: "Let's Encrypt", icon: Lock },
            ].map(t => (
              <div key={t.name} className="flex items-center gap-2 text-gray-300">
                <t.icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-cyan-400 tracking-widest uppercase">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4 text-white">Simple, Transparent Pricing</h2>
            <p className="text-gray-300 max-w-xl mx-auto text-base">Start free. Scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Starter",
                price: "Free",
                sub: "Forever",
                highlight: false,
                features: ["5 scans/month", "3 concurrent assets", "Basic vulnerability detection", "7-day scan history", "Email alerts"],
              },
              {
                name: "Professional",
                price: "$49",
                sub: "per month",
                highlight: true,
                features: ["Unlimited scans", "50 concurrent assets", "Full CVE database access", "AI risk scoring", "VirusTotal integration", "Compliance reports", "API access", "Priority support"],
              },
              {
                name: "Enterprise",
                price: "Custom",
                sub: "Contact us",
                highlight: false,
                features: ["Unlimited everything", "Custom scan policies", "SSO / SAML", "Dedicated infrastructure", "SLA guarantee", "Security team onboarding", "Custom integrations"],
              },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl border p-6 flex flex-col ${plan.highlight ? "bg-gradient-to-b from-cyan-500/10 to-blue-500/5 border-cyan-500/40 shadow-xl shadow-cyan-500/10" : "bg-[#0f0f1a] border-[#1e1e2e]"}`}>
                {plan.highlight && (
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">Most Popular</span>
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1 text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-400 font-medium">{plan.sub}</span>
                </div>
                <div className="border-t border-[#1e1e2e] my-5" />
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-200">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20"
                      : "bg-[#1a1a28] border border-[#2a2a3e] text-gray-200 hover:bg-[#1e1e2f] hover:text-white"
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-[#2a2a3e] p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                Ready to Secure Your Infrastructure?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of security teams using Vexa to stay ahead of attackers.
                Start your first scan in under 60 seconds.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-2xl shadow-cyan-500/25"
              >
                Start Free — No Credit Card Required
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1a1a28] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">VEXA</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                Enterprise attack surface management platform for continuous vulnerability
                discovery and remediation.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-gray-200 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-gray-200 transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-gray-200 transition-colors">Pricing</a></li>
                <li><Link to="/login" className="hover:text-gray-200 transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Security</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>CVE Database</li>
                <li>Attack Surface</li>
                <li>Compliance</li>
                <li>Vulnerability Mgmt</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/privacy" className="hover:text-gray-200 transition-colors">Privacy Policy</Link></li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1a1a28] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Vexa Security Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <Link to="/privacy" className="hover:text-gray-200 transition-colors">Privacy Policy</Link>
              <span className="text-gray-600">·</span>
              <span>SOC2 Ready</span>
              <span className="text-gray-600">·</span>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
