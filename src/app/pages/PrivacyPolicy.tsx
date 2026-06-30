import { Link } from "react-router";
import { Shield, ArrowLeft, Mail, Lock, Eye, Database, Globe, Users, FileText, RefreshCw } from "lucide-react";

const LAST_UPDATED = "June 30, 2026";
const EFFECTIVE_DATE = "June 30, 2026";

function Section({ id, icon: Icon, title, children }: { id: string; icon: any; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="text-gray-400 space-y-3 text-sm leading-relaxed pl-11">{children}</div>
    </section>
  );
}

function TOCLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="block text-sm text-gray-500 hover:text-cyan-400 transition-colors py-0.5 border-l-2 border-white/5 hover:border-cyan-500/50 pl-3">
      {label}
    </a>
  );
}

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#07070d] text-gray-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#07070d]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">VEXA</span>
          </div>
          <Link to="/login" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="border-b border-white/5 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <FileText className="w-3.5 h-3.5" />
            Legal Document
          </div>
          <h1 className="text-4xl font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-gray-400 text-lg mb-6">
            Vexa Security Platform is committed to protecting your privacy and the security of your data.
            This policy explains what we collect, how we use it, and your rights.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span><span className="text-gray-400">Effective:</span> {EFFECTIVE_DATE}</span>
            <span>·</span>
            <span><span className="text-gray-400">Last Updated:</span> {LAST_UPDATED}</span>
            <span>·</span>
            <span><span className="text-gray-400">Version:</span> 2.0</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Table of Contents — sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl bg-white/5 border border-white/10 p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Contents</p>
              <TOCLink href="#overview" label="1. Overview" />
              <TOCLink href="#information-we-collect" label="2. Information We Collect" />
              <TOCLink href="#how-we-use" label="3. How We Use Information" />
              <TOCLink href="#data-storage" label="4. Data Storage & Security" />
              <TOCLink href="#third-parties" label="5. Third-Party Services" />
              <TOCLink href="#scan-data" label="6. Scan Data & Privacy" />
              <TOCLink href="#user-rights" label="7. Your Rights" />
              <TOCLink href="#data-retention" label="8. Data Retention" />
              <TOCLink href="#cookies" label="9. Cookies & Local Storage" />
              <TOCLink href="#children" label="10. Children's Privacy" />
              <TOCLink href="#international" label="11. International Transfers" />
              <TOCLink href="#changes" label="12. Policy Changes" />
              <TOCLink href="#contact" label="13. Contact Us" />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">
            {/* 1. Overview */}
            <Section id="overview" icon={Shield} title="1. Overview">
              <p>
                This Privacy Policy describes how Vexa Security Platform ("Vexa," "we," "us," or "our") collects,
                uses, and protects information that you ("user," "you," or "your") provide when using our
                attack surface management platform, accessible at our website and web application.
              </p>
              <p>
                By accessing or using Vexa, you agree to the terms of this Privacy Policy. If you do not agree
                with these terms, please do not use our platform.
              </p>
              <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/15 p-4 mt-4">
                <p className="text-cyan-400 font-semibold text-xs mb-1">Key Principle</p>
                <p className="text-gray-300">
                  Your scan data is yours. Each user's security scan results, discovered assets, and vulnerability
                  findings are stored exclusively under your account and are never shared with, visible to, or
                  accessible by other users of the platform.
                </p>
              </div>
            </Section>

            {/* 2. Information We Collect */}
            <Section id="information-we-collect" icon={Database} title="2. Information We Collect">
              <p className="font-medium text-gray-300">2.1 Account Information</p>
              <p>When you create an account, we collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-gray-300">Email address</strong> — used for authentication and account management</li>
                <li><strong className="text-gray-300">Display name</strong> — shown in the dashboard interface</li>
                <li><strong className="text-gray-300">Authentication method</strong> — email/password, Google OAuth, or GitHub OAuth</li>
                <li><strong className="text-gray-300">Account creation timestamp</strong></li>
              </ul>
              <p className="font-medium text-gray-300 pt-2">2.2 Scan & Security Data</p>
              <p>When you run security scans, we process and store:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Target domains, IP ranges, and infrastructure you choose to scan</li>
                <li>Discovered assets (subdomains, IPs, services, technologies)</li>
                <li>Vulnerability findings, CVE identifiers, CVSS scores</li>
                <li>Port information, TLS certificate data, HTTP headers</li>
                <li>Scan configuration, timestamps, and duration metadata</li>
              </ul>
              <p className="font-medium text-gray-300 pt-2">2.3 Usage Data</p>
              <p>We automatically collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Browser type and version, operating system</li>
                <li>IP address (for security and abuse prevention)</li>
                <li>Pages visited within the application and timestamps</li>
                <li>Error logs and performance data for service improvement</li>
              </ul>
              <p className="font-medium text-gray-300 pt-2">2.4 Integration Data</p>
              <p>
                If you configure optional third-party integrations (e.g., VirusTotal API key), we store your
                API credentials securely in Firestore, encrypted at rest, accessible only to your account.
                We never share or use your integration credentials for any purpose other than executing scans
                on your behalf.
              </p>
            </Section>

            {/* 3. How We Use Information */}
            <Section id="how-we-use" icon={Eye} title="3. How We Use Information">
              <p>We use collected information for the following purposes:</p>
              <div className="space-y-4 mt-2">
                {[
                  { title: "Service Delivery", desc: "Authenticating your identity, running security scans, displaying results in your private dashboard, and sending scan completion notifications." },
                  { title: "Account Management", desc: "Managing your user profile, notification preferences, and account settings. Sending transactional emails related to your account (password reset, security alerts)." },
                  { title: "Platform Improvement", desc: "Analyzing aggregated, anonymized usage patterns to improve scan performance, add features, and fix bugs. We never analyze your specific scan results for this purpose." },
                  { title: "Security & Fraud Prevention", desc: "Detecting unauthorized access, preventing abuse of our scanning infrastructure, and ensuring fair use of our services." },
                  { title: "Legal Compliance", desc: "Complying with applicable laws, regulations, and legal processes, including responding to lawful requests from public authorities." },
                ].map(item => (
                  <div key={item.title} className="rounded-lg bg-white/3 border border-white/5 p-3">
                    <p className="font-medium text-gray-300 text-xs mb-1">{item.title}</p>
                    <p className="text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs">
                <strong className="text-gray-300">We do not:</strong> sell your personal data, share scan results with third parties,
                use your security data for advertising, or transfer your data to data brokers.
              </p>
            </Section>

            {/* 4. Data Storage & Security */}
            <Section id="data-storage" icon={Lock} title="4. Data Storage & Security">
              <p>
                Vexa uses Google Firebase (Firestore) for cloud data storage and Firebase Authentication
                for identity management. All data is stored on Google Cloud Platform infrastructure with
                the following security measures:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Data encrypted at rest using AES-256 encryption</li>
                <li>Data encrypted in transit using TLS 1.3</li>
                <li>Firestore Security Rules enforce strict per-user data isolation — your data can only be read or written by your authenticated account</li>
                <li>Firebase Authentication with secure token management (JWT)</li>
                <li>API keys and integration credentials stored with additional access controls</li>
              </ul>
              <p className="mt-3">
                Scan data is additionally cached in your browser's <code className="bg-white/5 px-1 rounded text-xs">localStorage</code> for
                performance. This local cache is keyed to your user ID, ensuring data is not shared
                between different users who may access the same browser.
              </p>
              <div className="rounded-lg bg-orange-500/5 border border-orange-500/15 p-4 mt-4">
                <p className="text-orange-400 font-semibold text-xs mb-1">Important Notice</p>
                <p>
                  While we implement industry-standard security measures, no system is 100% secure.
                  We recommend using strong, unique passwords and enabling multi-factor authentication
                  where available.
                </p>
              </div>
            </Section>

            {/* 5. Third-Party Services */}
            <Section id="third-parties" icon={Globe} title="5. Third-Party Services">
              <p>Vexa integrates with the following third-party services. Each has its own privacy policy:</p>
              <div className="space-y-3 mt-3">
                {[
                  {
                    name: "Google Firebase / Firestore",
                    purpose: "Authentication, cloud database storage, and hosting",
                    privacy: "https://firebase.google.com/support/privacy",
                    data: "Account info, scan results, user preferences",
                  },
                  {
                    name: "HackerTarget API",
                    purpose: "Subdomain enumeration during scans",
                    privacy: "https://hackertarget.com/privacy-policy/",
                    data: "Target domain names you submit for scanning",
                  },
                  {
                    name: "Google DNS over HTTPS (DoH)",
                    purpose: "DNS resolution for discovered subdomains",
                    privacy: "https://policies.google.com/privacy",
                    data: "Domain queries (anonymized per Google's DoH policy)",
                  },
                  {
                    name: "VirusTotal API (Optional)",
                    purpose: "Threat intelligence lookup for scanned domains",
                    privacy: "https://www.virustotal.com/gui/privacy",
                    data: "Domain names when you configure your VirusTotal API key",
                  },
                ].map(svc => (
                  <div key={svc.name} className="rounded-lg bg-white/3 border border-white/5 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-medium text-gray-300 text-sm">{svc.name}</p>
                      <a
                        href={svc.privacy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 flex-shrink-0"
                      >
                        Privacy Policy
                      </a>
                    </div>
                    <p className="text-xs mb-1"><span className="text-gray-500">Purpose:</span> {svc.purpose}</p>
                    <p className="text-xs"><span className="text-gray-500">Data shared:</span> {svc.data}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* 6. Scan Data & Privacy */}
            <Section id="scan-data" icon={Shield} title="6. Scan Data & Privacy">
              <p>
                Vexa operates as a security tool that scans infrastructure you own or have explicit
                written permission to test. This is a core requirement of our Terms of Service.
              </p>
              <p className="font-medium text-gray-300 pt-2">User Data Isolation</p>
              <p>
                All scan results — including discovered assets, vulnerability findings, IP addresses,
                port data, and certificate information — are stored exclusively under your user account.
                This isolation is enforced at multiple levels:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-gray-300">Database level:</strong> Firestore security rules require authentication and match the requesting user's UID to the document owner</li>
                <li><strong className="text-gray-300">Browser level:</strong> localStorage data is keyed by user ID (<code className="bg-white/5 px-1 rounded text-xs">vexa_scans_v4_{"{userId}"}</code>) so different users of the same browser never see each other's data</li>
                <li><strong className="text-gray-300">Application level:</strong> All data queries include user ID filters preventing cross-user data access</li>
              </ul>
              <p className="pt-2">
                <strong className="text-gray-300">No employee access:</strong> Vexa employees and administrators do not routinely access
                your specific scan results. Access to user scan data would only occur in response to a
                lawful legal request, with notification to you where legally permissible.
              </p>
            </Section>

            {/* 7. Your Rights */}
            <Section id="user-rights" icon={Users} title="7. Your Rights">
              <p>
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {[
                  { right: "Right to Access", desc: "Request a copy of all personal data we hold about you, including your account information and scan history." },
                  { right: "Right to Rectification", desc: "Correct inaccurate personal data we hold about you through your account settings or by contacting us." },
                  { right: "Right to Erasure", desc: "Request deletion of your account and all associated data. You can initiate this from your account settings." },
                  { right: "Right to Data Portability", desc: "Export your scan data in structured, machine-readable formats (JSON, CSV) from the Reports section." },
                  { right: "Right to Restrict Processing", desc: "Request that we limit how we use your data in certain circumstances." },
                  { right: "Right to Object", desc: "Object to processing of your personal data for certain purposes, including direct marketing (which we do not engage in)." },
                ].map(r => (
                  <div key={r.right} className="rounded-lg bg-white/3 border border-white/5 p-3">
                    <p className="font-medium text-gray-300 text-xs mb-1">{r.right}</p>
                    <p className="text-xs">{r.desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3">
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@vexa.security" className="text-cyan-400 hover:text-cyan-300">privacy@vexa.security</a>.
                We will respond within 30 days.
              </p>
            </Section>

            {/* 8. Data Retention */}
            <Section id="data-retention" icon={RefreshCw} title="8. Data Retention">
              <p>We retain your data according to the following schedule:</p>
              <div className="rounded-lg border border-white/10 overflow-hidden mt-3">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-4 py-2 text-gray-400 font-medium text-xs">Data Type</th>
                      <th className="text-left px-4 py-2 text-gray-400 font-medium text-xs">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      ["Account information", "Until account deletion"],
                      ["Scan results & findings", "Until account deletion or manual deletion"],
                      ["Browser localStorage cache", "Until you clear browser data or log out"],
                      ["Authentication logs", "90 days for security purposes"],
                      ["Error & usage logs", "30 days, aggregated and anonymized"],
                      ["Deleted account data", "30 days (for recovery), then permanently deleted"],
                    ].map(([type, period]) => (
                      <tr key={type} className="hover:bg-white/3">
                        <td className="px-4 py-2.5 text-gray-300 text-xs">{type}</td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* 9. Cookies & Local Storage */}
            <Section id="cookies" icon={Database} title="9. Cookies & Local Storage">
              <p>Vexa uses the following browser storage mechanisms:</p>
              <div className="space-y-3 mt-3">
                {[
                  {
                    name: "Authentication Session Cookie",
                    type: "Cookie (Session)",
                    purpose: "Maintains your login state across browser sessions. Set by Firebase Authentication.",
                    required: true,
                  },
                  {
                    name: "Scan Data Cache",
                    type: "localStorage",
                    purpose: "Stores your personal scan results locally for performance. Key is user-ID-scoped: vexa_scans_v4_{userId}. Only your own data is stored.",
                    required: true,
                  },
                  {
                    name: "Theme Preference",
                    type: "localStorage",
                    purpose: "Remembers your light/dark mode preference. No personal data.",
                    required: false,
                  },
                  {
                    name: "UI State",
                    type: "localStorage",
                    purpose: "Remembers sidebar open/closed state and similar UI preferences.",
                    required: false,
                  },
                ].map(c => (
                  <div key={c.name} className="rounded-lg bg-white/3 border border-white/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-300 text-sm">{c.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded">{c.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${c.required ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-gray-500"}`}>
                          {c.required ? "Required" : "Optional"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{c.purpose}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3">
                We do not use tracking cookies, advertising cookies, or third-party analytics cookies.
              </p>
            </Section>

            {/* 10. Children's Privacy */}
            <Section id="children" icon={Users} title="10. Children's Privacy">
              <p>
                Vexa is not intended for use by individuals under the age of 16 (or 13 in the United States).
                We do not knowingly collect personal information from children. If you believe we have
                inadvertently collected such information, please contact us immediately at{" "}
                <a href="mailto:privacy@vexa.security" className="text-cyan-400">privacy@vexa.security</a> and
                we will delete it promptly.
              </p>
            </Section>

            {/* 11. International Transfers */}
            <Section id="international" icon={Globe} title="11. International Data Transfers">
              <p>
                Vexa is operated from and data is primarily stored in the United States via Google Cloud
                Platform. If you access Vexa from outside the United States, your data may be transferred to
                and processed in the United States or other countries where Google operates data centers.
              </p>
              <p>
                For users in the European Economic Area (EEA), United Kingdom, or Switzerland, such transfers
                are made under Google's Standard Contractual Clauses (SCCs) approved by the European Commission.
                Google Firebase is certified under the EU-U.S. Data Privacy Framework.
              </p>
            </Section>

            {/* 12. Changes */}
            <Section id="changes" icon={RefreshCw} title="12. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                technology, legal requirements, or other factors. When we make material changes, we will:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Update the "Last Updated" date at the top of this page</li>
                <li>Display a notice in the application dashboard</li>
                <li>Send an email notification to your registered email address for significant changes</li>
              </ul>
              <p>
                Your continued use of Vexa after we post changes to this policy will constitute your
                acknowledgment of the changes and your consent to abide by the updated policy.
              </p>
            </Section>

            {/* 13. Contact */}
            <Section id="contact" icon={Mail} title="13. Contact Us">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our data
                practices, please contact us:
              </p>
              <div className="rounded-xl bg-white/5 border border-white/10 p-6 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Privacy Inquiries</p>
                      <a href="mailto:privacy@vexa.security" className="text-sm text-cyan-400 hover:text-cyan-300">privacy@vexa.security</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Security Issues</p>
                      <a href="mailto:security@vexa.security" className="text-sm text-cyan-400 hover:text-cyan-300">security@vexa.security</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Data Protection Officer</p>
                      <a href="mailto:dpo@vexa.security" className="text-sm text-cyan-400 hover:text-cyan-300">dpo@vexa.security</a>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4 pt-4 border-t border-white/5">
                  We aim to respond to all privacy-related inquiries within 5 business days and
                  will resolve data requests within 30 days as required by applicable law.
                </p>
              </div>
            </Section>

            <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-xs text-gray-600">
                © {new Date().getFullYear()} Vexa Security Platform. All rights reserved.
              </p>
              <Link to="/landing" className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
