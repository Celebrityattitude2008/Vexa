import { Link } from "react-router";
import { formatDistanceToNow } from "date-fns";
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Database,
  Sparkles,
} from "lucide-react";
import { useScanContext } from "../contexts/ScanContext";

function statusColor(status: string) {
  switch (status) {
    case "running":
      return "text-cyan-400 bg-cyan-500/20";
    case "completed":
      return "text-green-400 bg-green-500/20";
    case "failed":
      return "text-red-400 bg-red-500/20";
    case "paused":
      return "text-yellow-400 bg-yellow-500/20";
    default:
      return "text-gray-400 bg-white/10";
  }
}

export function Overview() {
  const { scans, findings, findingsList, completedCount, activeCount, queuedCount, hasScans, isRunning, assets } = useScanContext();

  const metricCards = [
    { label: "Total Findings", icon: Activity, highlight: false, value: hasScans ? findings.toString() : "--" },
    { label: "Completed Scans", icon: CheckCircle2, highlight: true, value: hasScans ? completedCount.toString() : "--" },
    { label: "Active Scans", icon: TrendingUp, highlight: false, value: hasScans ? activeCount.toString() : "--" },
    { label: "Queued Scans", icon: AlertTriangle, highlight: false, value: hasScans ? queuedCount.toString() : "--" },
  ];

  const recentActivity = [...scans]
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 4);

  const assetCount = assets.length;
  const activityStatus = isRunning ? "Active" : "Idle";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {metricCards.map((metric, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl backdrop-blur-xl border p-4 md:p-6 ${
              metric.highlight
                ? "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${
                  metric.highlight
                    ? "bg-red-500/20 text-red-400"
                    : "bg-cyan-500/20 text-cyan-400"
                }`}
              >
                <metric.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold mb-1 text-gray-500">{metric.value}</div>
            <div className="text-xs md:text-sm text-gray-400">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Risk Trends */}
        <div className="lg:col-span-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">Risk Trends</h3>
            <p className="text-sm text-gray-400">Last 7 days</p>
          </div>
          <div className="h-[200px] md:h-[250px] flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/2">
                {findingsList && findingsList.length > 0 ? (
                  <div className="w-full">
                    <SimpleBarChart data={buildLast7Days(findingsList)} />
                    <div className="mt-3 text-xs text-gray-400 text-center">Findings over last 7 days</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Activity className="w-10 h-10 text-gray-600 mb-3" />
                    <p className="text-gray-500 text-sm text-center px-4">
                      {isRunning
                        ? "A scan is currently running. See live results in Monitoring."
                        : "Run a scan to see risk trends."
                      }
                    </p>
                    <Link
                      to="/monitoring"
                      className="mt-4 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium transition-all border border-cyan-500/30"
                    >
                      {isRunning ? "View Scan" : "Start Scan"}
                    </Link>
                  </div>
                )}
          </div>
        </div>

        {/* Live Activity */}
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Live Activity</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-400" : "bg-gray-600"}`}></div>
              <span className="text-xs text-gray-500">{activityStatus}</span>
            </div>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((scan) => (
                <div key={scan.id} className="rounded-xl bg-black/40 border border-white/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{scan.name}</div>
                      <div className="text-xs text-gray-500 truncate">{scan.target}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${statusColor(scan.status)}`}>
                      {scan.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {scan.createdAt?.toDate ? formatDistanceToNow(scan.createdAt.toDate(), { addSuffix: true }) : "Just now"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] md:h-[250px] flex flex-col items-center justify-center">
              <Bell className="w-10 h-10 text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm text-center">No recent activity yet. Run a scan to populate the activity feed.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Insight + Asset Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* AI Insight */}
        <div className="lg:col-span-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/30 p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold">Vigil AI Insight</h3>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${hasScans ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"}`}>
                  {isRunning ? "Scanning…" : hasScans ? "Analysis Ready" : "Waiting for data"}
                </div>
              </div>
              {hasScans && findingsList.length > 0 ? (
                <>
                  <p className="text-gray-300 mb-3 text-sm md:text-base">
                    {(() => {
                      const critical = findingsList.filter(f => f.severity === "critical").length;
                      const high = findingsList.filter(f => f.severity === "high").length;
                      const cveCount = findingsList.filter(f => f.cve).length;
                      const criticalAssets = assets.filter(a => a.riskScore >= 75).length;
                      if (critical > 0)
                        return `⚠️ ${critical} critical vulnerability${critical > 1 ? "ies" : "y"} detected across ${assetCount} assets — immediate remediation required. ${high > 0 ? `${high} high-severity findings also need attention.` : ""}`;
                      if (high > 0)
                        return `${high} high-severity finding${high > 1 ? "s" : ""} identified across your infrastructure. ${cveCount > 0 ? `${cveCount} CVEs tracked — review and patch affected services.` : ""}`;
                      return `${findingsList.length} security finding${findingsList.length > 1 ? "s" : ""} across ${assetCount} assets. ${cveCount > 0 ? `${cveCount} CVEs identified.` : "No critical issues detected."} Risk posture is ${criticalAssets > 0 ? "elevated" : "moderate"}.`;
                    })()}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {findingsList.filter(f => f.severity === "critical").length > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs border border-red-500/30">{findingsList.filter(f => f.severity === "critical").length} Critical</span>
                    )}
                    {findingsList.filter(f => f.severity === "high").length > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs border border-orange-500/30">{findingsList.filter(f => f.severity === "high").length} High</span>
                    )}
                    {findingsList.filter(f => f.cve).length > 0 && (
                      <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30">{new Set(findingsList.filter(f => f.cve).map(f => f.cve)).size} CVEs</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/ai-risk" className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium transition-all border border-purple-500/30">View AI Risk Center</Link>
                    <Link to="/attack-graph" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-all">Attack Graph</Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-400 mb-4 text-sm md:text-base">
                    {isRunning ? "Scan in progress — AI insights will be ready once findings are collected." : "Run your first security scan to unlock AI-powered insights, risk predictions, and attack path analysis."}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/monitoring" className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium transition-all border border-purple-500/30">
                      {isRunning ? "View Scan Progress" : "Start First Scan"}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Asset Distribution */}
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Asset Distribution</h3>
          {assetCount > 0 ? (
            <div className="space-y-4">
              <div className="text-4xl font-bold text-gray-100">{assetCount}</div>
              <div className="text-sm text-gray-400">Assets discovered from recent scans.</div>
              <Link
                to="/assets"
                className="mt-2 inline-flex text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View discovered assets →
              </Link>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center">
              <Database className="w-10 h-10 text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm text-center">No assets discovered yet</p>
              <Link
                to="/assets"
                className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Add your first asset →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildLast7Days(findingsList: any[]) {
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    days.push({ label, count: 0 });
  }

  findingsList.forEach((f) => {
    let ts = (f.createdAt && f.createdAt.toDate) ? f.createdAt.toDate() : f.createdAt ? new Date(f.createdAt) : null;
    if (!ts) return;
    const idx = days.findIndex((day) => {
      const dayDate = new Date();
      const parts = day.label.split(" ");
      // best-effort: compare day of month
      return ts.getDate() === new Date(dayDate.setDate(new Date().getDate() - (6 - days.indexOf(day)))).getDate();
    });
    if (idx >= 0) days[idx].count += 1;
  });
  return days;
}

function SimpleBarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 100; // percent width container
  const barGap = 6;
  const barWidth = (w - (data.length - 1) * (barGap / data.length)) / data.length;
  return (
    <div className="w-full h-36 px-3 relative">
      <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" className="w-full h-full">
        {/* horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1={0} x2={w} y1={10 + (1 - t) * 80} y2={10 + (1 - t) * 80} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
        ))}
        {data.map((d, i) => {
          const x = i * (w / data.length);
          const h = (d.count / max) * 80;
          return (
            <g key={i}>
              <rect x={x + 2} y={90 - h} width={(w / data.length) - 4} height={h} rx="3" fill="url(#barGradient)" />
              <title>{`${d.label}: ${d.count}`}</title>
              <text x={x + (w / data.length) / 2} y={96} fontSize="5" fill="rgba(255,255,255,0.7)" textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
