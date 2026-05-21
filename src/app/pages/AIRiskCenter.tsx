import { useState } from "react";
import { Link } from "react-router";
import {
  Sparkles, Shield, Target, Brain, Zap, TrendingUp, AlertTriangle,
  ChevronRight, BarChart3, Clock, CheckCircle2,
} from "lucide-react";
import { useScanContext } from "../contexts/ScanContext";
import { formatDistanceToNow } from "date-fns";

function severityColor(sev: string) {
  if (sev === "critical") return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", bar: "bg-red-500" };
  if (sev === "high") return { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", bar: "bg-orange-500" };
  if (sev === "medium") return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", bar: "bg-yellow-500" };
  return { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", bar: "bg-green-500" };
}

function RiskGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90;
  const r = 60;
  const cx = 80, cy = 80;
  const needleX = cx + r * Math.cos((angle * Math.PI) / 180);
  const needleY = cy + r * Math.sin((angle * Math.PI) / 180);
  const arcColor = score >= 75 ? "#ef4444" : score >= 50 ? "#f97316" : score >= 30 ? "#eab308" : "#22c55e";
  return (
    <svg viewBox="0 0 160 100" className="w-36 h-24">
      <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
      <path
        d={`M 20 80 A 60 60 0 0 1 ${cx + r * Math.cos(((score / 100 * 180 - 180) * Math.PI) / 180)} ${cy + r * Math.sin(((score / 100 * 180 - 180) * Math.PI) / 180)}`}
        fill="none" stroke={arcColor} strokeWidth="12" strokeLinecap="round"
      />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="white" />
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">{score}</text>
    </svg>
  );
}

export function AIRiskCenter() {
  const { findings, findingsList, completedCount, isRunning, hasScans, scans, assets } = useScanContext();
  const [activeTab, setActiveTab] = useState<"predictions" | "trends" | "categories">("predictions");

  const riskScore = hasScans
    ? Math.max(15, 100 - Math.min(findings, 12) * 4 - completedCount * 3)
    : null;

  const statusText = isRunning ? "Scanning in progress" : hasScans ? "Analysis ready" : "Waiting for data";
  const statusDot = isRunning ? "bg-cyan-400 animate-pulse" : hasScans ? "bg-green-400" : "bg-gray-500";

  const criticalFindings = findingsList.filter(f => f.severity === "critical");
  const highFindings = findingsList.filter(f => f.severity === "high");
  const mediumFindings = findingsList.filter(f => f.severity === "medium");
  const lowFindings = findingsList.filter(f => f.severity === "low");

  // Priority queue: deduplicated high+critical findings sorted by cvss
  const priorityQueue = [...findingsList]
    .filter(f => f.severity === "critical" || f.severity === "high")
    .sort((a, b) => (b.cvss || 0) - (a.cvss || 0))
    .slice(0, 8);

  // Predictions: per-category aggregation
  const categoryMap: Record<string, { count: number; maxSeverity: string; cvss: number[] }> = {};
  findingsList.forEach(f => {
    const cat = f.category || "Other";
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, maxSeverity: "low", cvss: [] };
    categoryMap[cat].count++;
    categoryMap[cat].cvss.push(f.cvss || 0);
    const order = { critical: 4, high: 3, medium: 2, low: 1 };
    if ((order[f.severity as keyof typeof order] || 0) > (order[categoryMap[cat].maxSeverity as keyof typeof order] || 0)) {
      categoryMap[cat].maxSeverity = f.severity;
    }
  });
  const predictions = Object.entries(categoryMap)
    .map(([cat, d]) => ({
      category: cat,
      count: d.count,
      severity: d.maxSeverity,
      avgCvss: d.cvss.length > 0 ? Math.round(d.cvss.reduce((a, b) => a + b, 0) / d.cvss.length * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Asset risk breakdown
  const criticalAssets = assets.filter(a => a.riskScore >= 75);
  const highAssets = assets.filter(a => a.riskScore >= 50 && a.riskScore < 75);

  // CVE count
  const cveCount = findingsList.filter(f => f.cve).length;
  const uniqueCves = new Set(findingsList.filter(f => f.cve).map(f => f.cve)).size;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-400" />
            AI Risk Center
          </h1>
          <p className="text-gray-400">AI-powered security intelligence and risk prediction</p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusDot}`} />
          <span className="text-gray-300 text-sm font-medium">{statusText}</span>
        </div>
      </div>

      {/* Global Risk Score */}
      <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/30 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1">Global Risk Score</h3>
            <p className="text-sm text-gray-400 mb-3">Real-time AI assessment based on {findingsList.length} findings across {assets.length} assets</p>
            {riskScore !== null ? (
              <>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all rounded-full ${riskScore >= 75 ? "bg-red-500" : riskScore >= 50 ? "bg-orange-500" : riskScore >= 30 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Critical Findings</div>
                    <div className="text-red-400 font-bold text-lg">{criticalFindings.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">High Risk Assets</div>
                    <div className="text-orange-400 font-bold text-lg">{criticalAssets.length + highAssets.length}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Unique CVEs</div>
                    <div className="text-purple-400 font-bold text-lg">{uniqueCves}</div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Scan your infrastructure to get an AI-powered global risk assessment.</p>
            )}
          </div>
          <div className="flex flex-col items-center">
            {riskScore !== null ? (
              <>
                <RiskGauge score={riskScore} />
                <div className={`text-xs font-semibold mt-1 ${riskScore >= 75 ? "text-red-400" : riskScore >= 50 ? "text-orange-400" : riskScore >= 30 ? "text-yellow-400" : "text-green-400"}`}>
                  {riskScore >= 75 ? "Critical Risk" : riskScore >= 50 ? "High Risk" : riskScore >= 30 ? "Medium Risk" : "Low Risk"}
                </div>
              </>
            ) : (
              <div className="w-32 h-32 rounded-full border-8 border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <Shield className="w-10 h-10 text-gray-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">No data</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {hasScans && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Critical Findings", value: criticalFindings.length, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
            { label: "High Severity", value: highFindings.length, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
            { label: "Medium Severity", value: mediumFindings.length, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
            { label: "CVEs Detected", value: cveCount, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
          ].map((stat, i) => (
            <div key={i} className={`rounded-xl ${stat.bg} border p-4`}>
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10 w-fit mb-4">
          {(["predictions", "trends", "categories"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm transition-all capitalize ${activeTab === tab ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:text-gray-200"}`}
            >
              {tab === "predictions" ? "Attack Predictions" : tab === "trends" ? "Risk Trends" : "Categories"}
            </button>
          ))}
        </div>

        {activeTab === "predictions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Attack Path Prediction */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-red-400" />
                Attack Path Prediction
              </h2>
              <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
                {findingsList.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No attack paths predicted yet</p>
                    <Link to="/monitoring" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm border border-purple-500/30">
                      Start a Scan
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {findingsList
                      .filter(f => f.severity === "critical" || f.severity === "high")
                      .slice(0, 5)
                      .map((f, i) => {
                        const c = severityColor(f.severity);
                        return (
                          <div key={i} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border} font-medium`}>
                                    {f.severity.toUpperCase()}
                                  </span>
                                  {f.cve && <span className="text-xs text-purple-400 font-mono">{f.cve}</span>}
                                  {f.cvss && <span className="text-xs text-gray-400">CVSS {f.cvss}</span>}
                                </div>
                                <div className="text-sm font-medium text-gray-200">{f.title}</div>
                                <div className="text-xs text-gray-400 mt-0.5 truncate">{f.assetName || f.assetId}</div>
                              </div>
                              {f.port && (
                                <span className="text-xs text-gray-500 font-mono flex-shrink-0">:{f.port}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Priority Risk Queue */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Priority Risk Queue
              </h2>
              <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
                {priorityQueue.length === 0 ? (
                  <div className="p-8 text-center">
                    <Zap className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No items in the priority queue</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {priorityQueue.map((f, i) => {
                      const c = severityColor(f.severity);
                      return (
                        <div key={i} className="p-3 flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c.bg} ${c.text}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-200 truncate">{f.title}</div>
                            <div className="text-xs text-gray-500">{f.category || "Security"} {f.cvss ? `· CVSS ${f.cvss}` : ""}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${c.bg} ${c.text} flex-shrink-0`}>{f.severity}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Severity Distribution
              </h3>
              {findingsList.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No findings data yet. Run a scan to see trends.</div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Critical", count: criticalFindings.length, color: "bg-red-500" },
                    { label: "High", count: highFindings.length, color: "bg-orange-500" },
                    { label: "Medium", count: mediumFindings.length, color: "bg-yellow-500" },
                    { label: "Low", count: lowFindings.length, color: "bg-green-500" },
                  ].map(row => {
                    const pct = findingsList.length > 0 ? (row.count / findingsList.length) * 100 : 0;
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-gray-300">{row.label}</span>
                          <span className="text-gray-400">{row.count} findings ({Math.round(pct)}%)</span>
                        </div>
                        <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                          <div className={`h-full ${row.color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Recent Scan Summary
              </h3>
              {scans.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No scan history available yet.</div>
              ) : (
                <div className="space-y-3">
                  {scans.filter(s => s.status === "completed").slice(0, 4).map(scan => (
                    <div key={scan.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/30 border border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-200 truncate">{scan.name}</div>
                          <div className="text-xs text-gray-500">{scan.target}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-semibold text-orange-400">{scan.findings} findings</div>
                        <div className="text-xs text-gray-500">
                          {scan.completedAt?.toDate ? formatDistanceToNow(scan.completedAt.toDate(), { addSuffix: true }) : "recently"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
            {predictions.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No category data yet</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-white/10 grid grid-cols-4 text-xs text-gray-400 font-medium">
                  <span>Category</span>
                  <span className="text-center">Findings</span>
                  <span className="text-center">Max Severity</span>
                  <span className="text-center">Avg CVSS</span>
                </div>
                <div className="divide-y divide-white/5">
                  {predictions.map((p, i) => {
                    const c = severityColor(p.severity);
                    return (
                      <div key={i} className="px-5 py-3 grid grid-cols-4 items-center">
                        <span className="text-sm font-medium text-gray-200">{p.category}</span>
                        <span className="text-center text-sm text-gray-300">{p.count}</span>
                        <span className={`text-center text-xs ${c.text} font-semibold`}>{p.severity.toUpperCase()}</span>
                        <span className="text-center text-sm text-gray-400">{p.avgCvss || "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
