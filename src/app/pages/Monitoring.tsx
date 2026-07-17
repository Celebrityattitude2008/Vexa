import { useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Activity,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  X,
  Plus,
  Pause,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { type ScanJob } from "../../firebase";
import { useAuth } from "../components/AuthProvider";
import { useScanContext } from "../contexts/ScanContext";
import { formatDistanceToNow } from "date-fns";

function statusColor(status: string) {
  switch (status) {
    case "running":   return "text-cyan-400 bg-cyan-500/20";
    case "completed": return "text-green-400 bg-green-500/20";
    case "failed":    return "text-red-400 bg-red-500/20";
    case "paused":    return "text-yellow-400 bg-yellow-500/20";
    default:          return "text-gray-400 bg-white/10";
  }
}

function scanTypeLabel(type: string) {
  const map: Record<string, string> = {
    full: "Full Infrastructure",
    port: "Port Scan",
    subdomain: "Subdomain Enumeration",
    cloud: "Cloud Asset Discovery",
    cert: "Certificate Validation",
    vulnerability: "Vulnerability Scan",
    api: "API Discovery",
  };
  return map[type] || type;
}

function scanAge(scan: ScanJob): string {
  if (!scan.createdAt) return "just now";
  try {
    return formatDistanceToNow(scan.createdAt.toDate(), { addSuffix: true });
  } catch {
    return "just now";
  }
}

export function Monitoring() {
  const { user, emailVerified } = useAuth();
  const { scans, createScan, deleteScan, pauseScan } = useScanContext();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [scanForm, setScanForm] = useState({ name: "", target: "", scanType: "full", scheduleInterval: "none" });
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; target?: string }>({});

  function isValidTarget(raw: string): boolean {
    const t = raw.trim();
    // URL
    try { new URL(t); return true; } catch {}
    // CIDR
    if (/^(\d{1,3}\.){3}\d{1,3}\/(\d|[1-2]\d|3[0-2])$/.test(t)) return true;
    // IPv4
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(t)) return true;
    // Domain / hostname
    if (/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(t)) return true;
    return false;
  }

  const filtered = scans.filter(s => statusFilter === "all" || s.status === statusFilter);
  const activeScans   = filtered.filter(s => s.status === "running");
  const queuedScans   = filtered.filter(s => s.status === "queued");
  const completedScans = filtered.filter(s => s.status === "completed" || s.status === "failed");

  const handleStartScan = async () => {
    const errors: { name?: string; target?: string } = {};
    if (!scanForm.name.trim()) errors.name = "Scan name is required.";
    if (!scanForm.target.trim()) {
      errors.target = "Enter a valid URL, domain, IP address, or CIDR range.";
    } else if (!isValidTarget(scanForm.target)) {
      errors.target = "Enter a valid URL, domain, IP address, or CIDR range.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    if (!user) { toast.error("You must be signed in."); return; }
    if (!emailVerified) {
      toast.error("Verify your email before starting a scan. Check your inbox for the verification link.");
      return;
    }
    setSubmitting(true);
    try {
      await createScan(user.uid, scanForm);
      setShowNewScanModal(false);
      setScanForm({ name: "", target: "", scanType: "full", scheduleInterval: "none" });
      setFieldErrors({});
      toast.success("Scan queued", { description: `"${scanForm.name}" has been added to the queue.` });
    } catch (err: any) {
      toast.error("Failed to create scan: " + (err?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async (scan: ScanJob) => {
    try {
      await pauseScan(scan);
      toast.success(scan.status === "paused" ? "Scan resumed" : "Scan paused");
    } catch (err: any) {
      toast.error("Failed to update scan: " + (err?.message || ""));
    }
  };

  const handleDelete = async (scan: ScanJob) => {
    try {
      await deleteScan(scan.id);
      toast.success("Scan removed");
    } catch (err: any) {
      toast.error("Failed to delete scan: " + (err?.message || ""));
    }
  };

  const statCounts = {
    running:   scans.filter(s => s.status === "running").length,
    completed: scans.filter(s => s.status === "completed").length,
    queued:    scans.filter(s => s.status === "queued").length,
    findings:  scans.reduce((sum, s) => sum + (s.findings || 0), 0),
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Monitoring</h1>
          <p className="text-gray-400">Real-time scanning and discovery system</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`px-3 md:px-4 py-2 rounded-lg border flex items-center gap-2 transition-all text-sm ${
              filtersOpen
                ? "bg-[color:var(--accent-muted)] border-[color:var(--accent-border)] text-[color:var(--accent-text)]"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
            }`}
          >
            {filtersOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={() => setShowNewScanModal(true)}
            style={{ backgroundColor: "var(--accent-muted)", borderColor: "var(--accent-border)", color: "var(--accent-text)" }}
            className="px-3 md:px-4 py-2 rounded-lg border flex items-center gap-2 transition-all text-sm hover:opacity-90"
            aria-label="New Scan — open form"
            title={!emailVerified ? "Verify your email to start scans" : undefined}
          >
            <Plus className="w-4 h-4" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Inline Filters */}
      {filtersOpen && (
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)]"
              >
                <option value="all">All Statuses</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="queued">Queued</option>
                <option value="paused">Paused</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Scan Type</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)]">
                <option>All Types</option>
                <option>Full Infrastructure</option>
                <option>Port Scan</option>
                <option>Subdomain</option>
                <option>Cloud</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => setStatusFilter("all")} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Clear filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Active Scans",     value: statCounts.running,   color: "text-green-400",  icon: Activity,       dot: true },
          { label: "Completed Today",  value: statCounts.completed, color: "text-green-400",  icon: CheckCircle2,   dot: false },
          { label: "Queued",           value: statCounts.queued,    color: "text-yellow-400", icon: Clock,          dot: false },
          { label: "Total Findings",   value: statCounts.findings,  color: "text-orange-400", icon: AlertTriangle,  dot: false },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{stat.label}</span>
              {stat.dot ? (
                <div className={`w-2 h-2 rounded-full ${stat.value > 0 ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              ) : (
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              )}
            </div>
            <div className={`text-2xl font-bold ${stat.value === 0 ? "text-gray-500" : ""}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Active / Queued Scans */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[color:var(--accent-text)]" />
          Active & Queued
        </h2>
        {activeScans.length === 0 && queuedScans.length === 0 ? (
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 text-center">
            <PlayCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-300 mb-2">No active scans</h3>
            <p className="text-gray-500 text-sm mb-4">Click "New Scan" to start discovering your infrastructure.</p>
            <button
              onClick={() => setShowNewScanModal(true)}
              style={{ backgroundColor: "var(--accent-muted)", borderColor: "var(--accent-border)", color: "var(--accent-text)" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:opacity-90"
              aria-label="New Scan — start from empty state"
            >
              <Plus className="w-4 h-4" />
              New Scan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[...activeScans, ...queuedScans].map(scan => (
              <div key={scan.id} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold mb-0.5 truncate">{scan.name}</div>
                    <div className="text-xs text-gray-400 font-mono truncate">{scan.target}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(scan.status)}`}>
                      {scan.status}
                    </span>
                    {(scan as any).scheduleInterval && (scan as any).scheduleInterval !== "none" && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        {(scan as any).scheduleInterval}
                      </span>
                    )}
                    <button
                      onClick={() => handlePause(scan)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-all"
                      title={scan.status === "paused" ? "Resume" : "Pause"}
                    >
                      {scan.status === "paused" ? <RotateCcw className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(scan)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span>{scanTypeLabel(scan.scanType)}</span>
                  <span>Progress: {scan.progress}%</span>
                  {scan.phase && <span className="text-cyan-500/70">{scan.phase}</span>}
                  <span>{scanAge(scan)}</span>
                </div>
                {scan.progress > 0 && (
                  <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${scan.progress}%`, backgroundColor: "var(--accent-primary)" }}
                      className="h-full rounded-full transition-all duration-700"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Scans */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Completed Scans
        </h2>
        {completedScans.length === 0 ? (
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No completed scans yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedScans.map(scan => (
              <div key={scan.id} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold mb-0.5 truncate">{scan.name}</div>
                    <div className="text-xs text-gray-400 font-mono truncate">{scan.target}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(scan.status)}`}>
                      {scan.status}
                    </span>
                    {scan.findings > 0 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                        {scan.findings} findings
                      </span>
                    )}
                    {scan._assets && scan._assets.length > 0 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400">
                        {scan._assets.length} assets
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(scan)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-4">
                  <span>{scanTypeLabel(scan.scanType)}</span>
                  <span>{scanAge(scan)}</span>
                  {scan.duration && <span>Duration: {scan.duration}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Scan Modal */}
      {showNewScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0d0d18] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" id="new-scan-title">New Scan</h3>
              <button
                onClick={() => { setShowNewScanModal(false); setFieldErrors({}); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="scan-name" className="block text-sm font-medium mb-1.5 text-gray-300">
                  Scan Name <span className="text-red-400" aria-hidden="true">*</span>
                </label>
                <input
                  id="scan-name"
                  type="text"
                  placeholder="e.g. Full Infrastructure Scan"
                  value={scanForm.name}
                  onChange={e => { setScanForm(f => ({ ...f, name: e.target.value })); setFieldErrors(fe => ({ ...fe, name: undefined })); }}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? "scan-name-error" : undefined}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100 ${fieldErrors.name ? "border-red-500/60" : "border-white/10"}`}
                />
                {fieldErrors.name && (
                  <p id="scan-name-error" role="alert" className="mt-1.5 text-xs text-red-400">{fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="scan-target" className="block text-sm font-medium mb-1.5 text-gray-300">
                  Target <span className="text-red-400" aria-hidden="true">*</span>
                </label>
                <input
                  id="scan-target"
                  type="text"
                  placeholder="e.g. example.com or 192.168.1.0/24"
                  value={scanForm.target}
                  onChange={e => { setScanForm(f => ({ ...f, target: e.target.value })); setFieldErrors(fe => ({ ...fe, target: undefined })); }}
                  required
                  aria-required="true"
                  aria-invalid={!!fieldErrors.target}
                  aria-describedby={fieldErrors.target ? "scan-target-error" : "scan-target-hint"}
                  className={`w-full bg-black/40 border rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100 ${fieldErrors.target ? "border-red-500/60" : "border-white/10"}`}
                />
                {fieldErrors.target ? (
                  <p id="scan-target-error" role="alert" className="mt-1.5 text-xs text-red-400">{fieldErrors.target}</p>
                ) : (
                  <p id="scan-target-hint" className="mt-1.5 text-xs text-gray-500">URL, domain, IP address, or CIDR range</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Scan Type</label>
                <select
                  value={scanForm.scanType}
                  onChange={e => setScanForm(f => ({ ...f, scanType: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100"
                >
                  <option value="full">Full Infrastructure Scan</option>
                  <option value="port">Port Scan</option>
                  <option value="subdomain">Subdomain Enumeration</option>
                  <option value="cloud">Cloud Asset Discovery</option>
                  <option value="cert">Certificate Validation</option>
                  <option value="vulnerability">Vulnerability Scan</option>
                  <option value="api">API Discovery</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">
                  Recurring Schedule
                </label>
                <select
                  value={scanForm.scheduleInterval}
                  onChange={e => setScanForm(f => ({ ...f, scheduleInterval: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100"
                >
                  <option value="none">One-time (no repeat)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {scanForm.scheduleInterval !== "none" && (
                  <p className="mt-1.5 text-xs text-cyan-400/80">
                    This scan will automatically re-run {scanForm.scheduleInterval} after completion.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewScanModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleStartScan}
                disabled={submitting}
                style={{ backgroundColor: "var(--accent-muted)", borderColor: "var(--accent-border)", color: "var(--accent-text)" }}
                className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-90"
              >
                {submitting ? (
                  <div style={{ borderColor: "var(--accent-border)", borderTopColor: "var(--accent-primary)" }} className="w-4 h-4 border-2 rounded-full animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                {submitting ? "Queuing..." : "Start Scan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
