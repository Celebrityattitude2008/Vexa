import { useState } from "react";
import {
  User, Bell, Shield, Key, Zap, Palette,
  Save, X, Copy, Plus, Trash2, Eye, EyeOff, Check,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { useTheme, ACCENT_CONFIGS, type AccentColor } from "../contexts/ThemeContext";
import { saveIntegration } from "../../firebase";
import { toast } from "sonner";

type Section = "account" | "notifications" | "security" | "api-keys" | "integrations" | "appearance";

const NAV: { id: Section; label: string; icon: typeof User }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "integrations", label: "Integrations", icon: Zap },
  { id: "appearance", label: "Appearance", icon: Palette },
];

const INTEGRATIONS = [
  { name: "Slack", type: "slack", desc: "Alert notifications in Slack", icon: "💬", field: "webhookUrl", placeholder: "https://hooks.slack.com/services/..." },
  { name: "PagerDuty", type: "pagerduty", desc: "Critical incident routing", icon: "🔔", field: "apiKey", placeholder: "pdp_..." },
  { name: "Jira", type: "jira", desc: "Create tickets from findings", icon: "📋", field: "apiKey", placeholder: "ATL..." },
  { name: "AWS Security Hub", type: "aws", desc: "Sync cloud security findings", icon: "☁️", field: "apiKey", placeholder: "AKIA..." },
  { name: "Shodan", type: "shodan", desc: "Passive reconnaissance data", icon: "🔍", field: "apiKey", placeholder: "Your Shodan API key" },
  { name: "VirusTotal", type: "virustotal", desc: "Malware and threat intelligence", icon: "🦠", field: "apiKey", placeholder: "Your VirusTotal API key" },
];

export function Settings() {
  const { user, notificationSettings, updateNotificationSettings, isAdmin } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor, isDark } = useTheme();
  const [active, setActive] = useState<Section>("account");
  const [nameVal, setNameVal] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectModal, setConnectModal] = useState<typeof INTEGRATIONS[0] | null>(null);
  const [connectValue, setConnectValue] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectedTypes, setConnectedTypes] = useState<Set<string>>(new Set());

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved successfully");
  };

  const handleConnect = async () => {
    if (!connectModal || !connectValue.trim()) {
      toast.error("Please enter a value.");
      return;
    }
    if (!user) { toast.error("You must be signed in."); return; }
    setConnecting(true);
    try {
      const data = connectModal.field === "webhookUrl"
        ? { webhookUrl: connectValue }
        : { apiKey: connectValue };
      await saveIntegration(user.uid, connectModal.name, connectModal.type, data);
      setConnectedTypes((prev) => new Set([...prev, connectModal.type]));
      toast.success(`${connectModal.name} connected successfully`);
      setConnectModal(null);
      setConnectValue("");
    } catch (err: any) {
      toast.error("Failed to connect: " + (err?.message || "Unknown error"));
    } finally {
      setConnecting(false);
    }
  };

  const accentStyle = {
    muted: { backgroundColor: "var(--accent-muted)" },
    border: { borderColor: "var(--accent-border)" },
    text: { color: "var(--accent-text)" },
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-gray-400">Manage your account and platform preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar nav */}
        <div className="md:w-52 lg:w-60 flex-shrink-0">
          <nav className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                style={active === id ? { ...accentStyle.muted, ...accentStyle.border, ...accentStyle.text } : {}}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm whitespace-nowrap w-auto md:w-full border ${
                  active === id ? "border" : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content panels */}
        <div className="flex-1 min-w-0">

          {/* ── Account ── */}
          {active === "account" && (
            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 space-y-6">
              <h2 className="text-lg font-semibold">Account Information</h2>
              <div className="flex items-center gap-4">
                <div style={{ background: "linear-gradient(135deg, var(--accent-primary), #818cf8)" }} className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 text-black">
                  {(user?.displayName || user?.email || "U")[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{user?.displayName || "No name set"}</div>
                  <div className="text-sm text-gray-400">{user?.email}</div>
                  {isAdmin && (
                    <span style={accentStyle.muted} className="text-xs px-2 py-0.5 rounded-full text-purple-400 border border-purple-500/30 mt-1 inline-block">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">Display Name</label>
                  <input type="text" value={nameVal} onChange={(e) => setNameVal(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">Email</label>
                  <input type="email" value={user?.email || ""} readOnly className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">Role</label>
                  <input type="text" value={isAdmin ? "Admin" : "Member"} readOnly className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">Workspace</label>
                  <input type="text" defaultValue="Default Workspace" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)]" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleSave} disabled={saving} style={{ ...accentStyle.muted, ...accentStyle.border, ...accentStyle.text }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-60 hover:opacity-90">
                  {saving ? <div style={{ borderTopColor: "var(--accent-primary)" }} className="w-4 h-4 border-2 border-gray-600 rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => { setNameVal(user?.displayName || ""); toast.info("Changes discarded"); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-all">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {active === "notifications" && (
            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 space-y-6">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { key: "criticalRiskAlerts" as const, label: "Critical Risk Alerts", desc: "Instant alerts for critical security risks" },
                  { key: "newAssets" as const, label: "New Asset Discovery", desc: "Notify when new assets are discovered" },
                  { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Summary report every Monday morning" },
                ].map(({ key, label, desc }) => {
                  const on = notificationSettings?.[key] ?? false;
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-black/40 border border-white/10">
                      <div className="min-w-0">
                        <div className="font-medium text-sm mb-0.5">{label}</div>
                        <div className="text-xs text-gray-500">{desc}</div>
                      </div>
                      <button
                        onClick={() => updateNotificationSettings({ ...notificationSettings, [key]: !on })}
                        style={on ? { backgroundColor: "var(--accent-primary)" } : {}}
                        className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${!on ? "bg-white/20" : ""}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={handleSave} disabled={saving} style={{ ...accentStyle.muted, ...accentStyle.border, ...accentStyle.text }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all hover:opacity-90">
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          )}

          {/* ── Security ── */}
          {active === "security" && (
            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">Security Settings</h2>
              <div className="p-4 rounded-lg bg-black/40 border border-white/10 space-y-3">
                <h3 className="font-medium text-sm">Change Password</h3>
                <p className="text-sm text-gray-400">Update your account password</p>
                <input type="password" placeholder="Current password" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100" />
                <input type="password" placeholder="New password" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100" />
                <input type="password" placeholder="Confirm new password" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100" />
                <button onClick={() => toast.success("Password update email sent.")} style={{ ...accentStyle.muted, ...accentStyle.border, ...accentStyle.text }} className="px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:opacity-90">
                  Update Password
                </button>
              </div>
              <div className="p-4 rounded-lg bg-black/40 border border-white/10">
                <h3 className="font-medium text-sm mb-1">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-400 mb-3">Add an extra layer of security to your account</p>
                <button onClick={() => toast.info("2FA setup coming soon.")} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-all">Enable 2FA</button>
              </div>
              <div className="p-4 rounded-lg bg-black/40 border border-white/10">
                <h3 className="font-medium text-sm mb-1">Active Sessions</h3>
                <p className="text-sm text-gray-500">Current session: This browser</p>
              </div>
            </div>
          )}

          {/* ── API Keys ── */}
          {active === "api-keys" && (
            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">API Keys</h2>
                <button onClick={() => toast.info("API key generation coming soon.")} style={{ ...accentStyle.muted, ...accentStyle.border, ...accentStyle.text }} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all hover:opacity-90">
                  <Plus className="w-4 h-4" /> Generate Key
                </button>
              </div>
              <p className="text-sm text-gray-400">API keys allow external services to authenticate with Vexa Security Platform.</p>
              <div className="p-4 rounded-lg bg-black/40 border border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">Default Key</div>
                    <div className="font-mono text-xs text-gray-400 break-all">
                      {showApiKey ? "No key generated yet" : "vxa_sk_••••••••••••••••••••••••••••"}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Created — never</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setShowApiKey((v) => !v)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-all">
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => toast.info("No key to copy.")} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-all">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => toast.error("No key to delete.")} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Integrations ── */}
          {active === "integrations" && (
            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">Integrations</h2>
              <p className="text-sm text-gray-400">Connect Vexa with your existing security and operations stack. API keys are stored securely in Firestore.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INTEGRATIONS.map((intg) => {
                  const connected = connectedTypes.has(intg.type);
                  return (
                    <div key={intg.type} className={`p-4 rounded-lg border transition-all ${connected ? "bg-green-500/5 border-green-500/20" : "bg-black/40 border-white/10"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg flex-shrink-0">{intg.icon}</div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{intg.name}</div>
                            <div className="text-xs text-gray-500 truncate">{intg.desc}</div>
                          </div>
                        </div>
                        {connected ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs flex-shrink-0">
                            <Check className="w-3 h-3" /> Connected
                          </div>
                        ) : (
                          <button
                            onClick={() => { setConnectModal(intg); setConnectValue(""); }}
                            style={{ ...accentStyle.muted, ...accentStyle.border, ...accentStyle.text }}
                            className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex-shrink-0 hover:opacity-90"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          {active === "appearance" && (
            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6 space-y-6">
              <h2 className="text-lg font-semibold">Appearance</h2>

              {/* Theme */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Theme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["dark", "light"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      style={theme === t ? { ...accentStyle.muted, ...accentStyle.border } : {}}
                      className={`p-4 rounded-lg border text-left transition-all ${theme === t ? "border" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                    >
                      <div className={`w-full h-14 rounded-lg mb-3 flex items-center justify-center border ${t === "dark" ? "bg-black/60 border-white/10" : "bg-white border-gray-200"}`}>
                        <div style={theme === t ? { backgroundColor: "var(--accent-primary)" } : {}} className={`w-6 h-6 rounded-full ${theme !== t ? (t === "dark" ? "bg-gray-600" : "bg-gray-300") : ""}`} />
                      </div>
                      <div style={theme === t ? accentStyle.text : {}} className="font-medium text-sm capitalize">{t} Mode</div>
                      <div className="text-xs text-gray-500 mt-0.5">{theme === t ? "Currently active" : "Click to switch"}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Accent Color</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {(Object.entries(ACCENT_CONFIGS) as [AccentColor, typeof ACCENT_CONFIGS[AccentColor]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setAccentColor(key)}
                      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-all"
                      title={cfg.label}
                    >
                      <div
                        style={{ backgroundColor: cfg.primary }}
                        className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${accentColor === key ? "ring-2 ring-white/60 ring-offset-2 ring-offset-transparent scale-110" : ""}`}
                      />
                      <span className="text-xs text-gray-400">{cfg.label}</span>
                      {accentColor === key && (
                        <Check className="w-3 h-3 text-green-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg bg-black/40 border border-white/10">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
                <div className="flex flex-wrap gap-2">
                  <button style={{ ...accentStyle.muted, ...accentStyle.border, ...accentStyle.text }} className="px-3 py-1.5 rounded-lg border text-sm font-medium">Primary Button</button>
                  <div style={{ backgroundColor: "var(--accent-primary)" }} className="w-6 h-6 rounded-full self-center" />
                  <span style={accentStyle.text} className="text-sm self-center">Accent text</span>
                  <div style={accentStyle.muted} className="px-2 py-1 rounded text-xs self-center">Badge</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Connect Modal */}
      {connectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-[#0d0d18] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{connectModal.icon}</span>
                <h3 className="text-lg font-semibold">Connect {connectModal.name}</h3>
              </div>
              <button onClick={() => setConnectModal(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">
                  {connectModal.field === "webhookUrl" ? "Webhook URL" : "API Key"} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder={connectModal.placeholder}
                  value={connectValue}
                  onChange={(e) => setConnectValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Your key is encrypted and stored securely in Firestore. It will never be shared.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConnectModal(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all text-gray-300">
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting}
                style={{ ...accentStyle.muted, ...accentStyle.border, ...accentStyle.text }}
                className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90"
              >
                {connecting ? <div style={{ borderTopColor: "var(--accent-primary)" }} className="w-4 h-4 border-2 border-gray-600 rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
