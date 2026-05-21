import { useState } from "react";
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
import {
  createScanJob,
  updateScanStatus,
  db,
  type ScanJob,
  type ScanStatus,
} from "../../firebase";
import { useAuth } from "../components/AuthProvider";
import { useScanContext } from "../contexts/ScanContext";
import { formatDistanceToNow } from "date-fns";
import { doc, deleteDoc } from "firebase/firestore";

function statusColor(status: ScanStatus) {
  switch (status) {
    case "running": return "text-cyan-400 bg-cyan-500/20";
    case "completed": return "text-green-400 bg-green-500/20";
    case "failed": return "text-red-400 bg-red-500/20";
    case "paused": return "text-yellow-400 bg-yellow-500/20";
    default: return "text-gray-400 bg-white/10";
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
  const { user } = useAuth();
  const { scans, firestoreOk } = useScanContext();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [scanForm, setScanForm] = useState({ name: "", target: "", scanType: "full" });
  const [submitting, setSubmitting] = useState(false);

  const filtered = scans.filter(
    (s) => statusFilter === "all" || s.status === statusFilter
  );

  const activeScans = filtered.filter((s) => s.status === "running");
  const queuedScans = filtered.filter((s) => s.status === "queued");
  const completedScans = filtered.filter(
    (s) => s.status === "completed" || s.status === "failed"
  );

  const handleStartScan = async () => {
    if (!scanForm.name.trim() || !scanForm.target.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!user) { toast.error("You must be signed in."); return; }
    setSubmitting(true);
    try {
      await createScanJob(user.uid, scanForm);
      setShowNewScanModal(false);
      setScanForm({ name: "", target: "", scanType: "full" });
      toast.success("Scan queued", { description: `"${scanForm.name}" has been added to the queue.` });
    } catch (err: any) {
      toast.error("Failed to create scan: " + (err?.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async (scan: ScanJob) => {
    try {
      await updateScanStatus(scan.id, scan.status === "paused" ? "running" : "paused");
      toast.success(scan.status === "paused" ? "Scan resumed" : "Scan paused");
    } catch (err: any) {
      toast.error("Failed to update scan: " + (err?.message || ""));
    }
  };

  const handleDelete = async (scan: ScanJob) => {
    try {
      await deleteDoc(doc(db, "scans", scan.id));
      toast.success("Scan removed");
    } catch (err: any) {
      toast.error("Failed to delete scan: " + (err?.message || ""));
    }
  };

  const statCounts = {
    running: scans.filter((s) => s.status === "running").length,
    completed: scans.filter((s) => s.status === "completed").length,
    queued: scans.filter((s) => s.status === "queued").length,
    findings: scans.reduce((sum, s) => sum + (s.findings || 0), 0),
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
            onClick={() => setFiltersOpen((v) => !v)}
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
          >
            <Plus className="w-4 h-4" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Firestore error banner */}
      {!firestoreOk && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            Could not connect to Firestore. Make sure your rules allow authenticated reads/writes to the{" "}
            <code className="font-mono">scans</code> collection.
          </span>
        </div>
      )}

      {/* Inline Filters */}
      {filtersOpen && (
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Active Scans", value: statCounts.running, color: "text-green-400", icon: Activity, dot: statCounts.running > 0 },
          { label: "Completed Today", value: statCounts.completed, color: "text-green-400", icon: CheckCircle2 },
          { label: "Queued", value: statCounts.queued, color: "text-yellow-400", icon: Clock },
          { label: "Total Findings", value: statCounts.findings, color: "text-orange-400", icon: AlertTriangle },
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
            >
              <Plus className="w-4 h-4" />
              New Scan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[...activeScans, ...queuedScans].map((scan) => (
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
                  <span>{scanAge(scan)}</span>
                </div>
                {scan.progress > 0 && (
                  <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${scan.progress}%`, backgroundColor: "var(--accent-primary)" }}
                      className="h-full rounded-full transition-all"
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
            {completedScans.map((scan) => (
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
              <h3 className="text-lg font-semibold">New Scan</h3>
              <button
                onClick={() => setShowNewScanModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">
                  Scan Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Infrastructure Scan"
                  value={scanForm.name}
                  onChange={(e) => setScanForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">
                  Target <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. example.com or 192.168.1.0/24"
                  value={scanForm.target}
                  onChange={(e) => setScanForm((f) => ({ ...f, target: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)] text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Scan Type</label>
                <select
                  value={scanForm.scanType}
                  onChange={(e) => setScanForm((f) => ({ ...f, scanType: e.target.value }))}
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
