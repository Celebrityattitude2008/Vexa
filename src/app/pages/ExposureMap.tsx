import { useState } from "react";
import { Filter, Layers, Globe, X } from "lucide-react";
import { useScanContext } from "../contexts/ScanContext";

function formatPercent(value: number, total: number) {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function ExposureMap() {
  const [viewMode, setViewMode] = useState<"map" | "graph" | "timeline">("map");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { scans, assets, findings, completedCount, hasScans, isRunning, findingsList } = useScanContext();

  const criticalFindings = findingsList.filter((f) => f.severity === "critical").length;
  const highFindings = findingsList.filter((f) => f.severity === "high").length;
  const mediumFindings = findingsList.filter((f) => f.severity === "medium").length;
  const lowFindings = findingsList.filter((f) => f.severity === "low").length;
  const totalFindings = findingsList.length;
  const coveragePercent = hasScans ? Math.min(100, completedCount * 20) : 0;
  const clusterCount = assets.length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Exposure Map</h1>
          <p className="text-gray-400">Visual representation of your attack surface</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg bg-white/5 border border-white/10 p-1">
            {(["map", "graph", "timeline"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md transition-all text-sm capitalize ${
                  viewMode === mode
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {mode === "map" ? "Map View" : mode === "graph" ? "Graph View" : "Timeline"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`px-3 md:px-4 py-2 rounded-lg border flex items-center gap-2 transition-all text-sm ${
              filtersOpen
                ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
            }`}
          >
            {filtersOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Inline Filters */}
      {filtersOpen && (
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Risk Level</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                <option>All Levels</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Cluster Type</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                <option>All Clusters</option>
                <option>Web Infrastructure</option>
                <option>API Layer</option>
                <option>Cloud Storage</option>
                <option>Databases</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Clusters", value: clusterCount.toString() },
          { label: "Total Assets", value: findings.toString() },
          { label: "Critical Zones", value: criticalFindings.toString(), highlight: true },
          { label: "Coverage %", value: `${coveragePercent}%` },
        ].map((item, i) => (
          <div key={i} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <div className={`text-2xl font-bold mb-1 ${item.highlight ? "text-red-400" : "text-gray-500"}`}>
              {item.value}
            </div>
            <div className="text-sm text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Main view + Side panel */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Map/Graph/Timeline canvas */}
        <div className="flex-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden relative min-h-[350px] md:min-h-[450px]">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="expo-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#expo-grid)" />
            </svg>
          </div>

          {assets.length === 0 && findingsList.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <Globe className="w-16 h-16 text-gray-700 mb-4" />
              <h3 className="text-base font-semibold text-gray-400 mb-2">
                {viewMode === "map"
                  ? "No exposure data"
                  : viewMode === "graph"
                  ? "No graph data"
                  : "No timeline events"}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {isRunning
                  ? "A scan is currently populating exposure data."
                  : viewMode === "timeline"
                  ? "Asset discovery events will appear here as scans run."
                  : "Discover assets by running a scan to populate the exposure map."}
              </p>
            </div>
          ) : (
            <div className="absolute inset-0 p-6 overflow-y-auto">
              {viewMode === "map" && (
                <div className="h-full rounded-xl border border-white/10 bg-black/30 p-6 text-white">
                  <div className="font-semibold mb-4">Exposure Map</div>
                  <div className="grid grid-cols-2 gap-4">
                    {assets.map((asset, index) => (
                      <div key={asset.id || index} className="rounded-2xl bg-white/5 p-4 border border-white/10">
                        <div className="font-medium text-sm text-gray-100">{asset.name}</div>
                        <div className="text-xs text-gray-400">{asset.type}</div>
                        <div className="mt-2 text-xs text-gray-300">Risk score: {asset.riskScore}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewMode === "graph" && (
                <div className="h-full rounded-xl border border-white/10 bg-black/30 p-6 text-white">
                  <div className="font-semibold mb-4">Risk Trend Graph</div>
                  <div className="space-y-3">
                    {[
                      { label: "Critical", value: criticalFindings },
                      { label: "High", value: highFindings },
                      { label: "Medium", value: mediumFindings },
                      { label: "Low", value: lowFindings },
                    ].map((row) => (
                      <div key={row.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-gray-200">
                          <span>{row.label}</span>
                          <span>{row.value}</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${row.label === "Critical" ? "bg-red-500" : row.label === "High" ? "bg-orange-500" : row.label === "Medium" ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${formatPercent(row.value, totalFindings)}` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewMode === "timeline" && (
                <div className="h-full rounded-xl border border-white/10 bg-black/30 p-6 text-white">
                  <div className="font-semibold mb-4">Discovery Timeline</div>
                  <div className="space-y-3">
                    {scans.slice(-5).reverse().map((scan) => (
                      <div key={scan.id} className="rounded-2xl bg-white/5 p-4 border border-white/10">
                        <div className="font-medium text-sm text-gray-100">{scan.name}</div>
                        <div className="text-xs text-gray-400">{scan.target} · {scan.status}</div>
                        <div className="text-xs text-gray-300 mt-2">
                          {scan.createdAt?.toDate ? formatDistanceToNow(scan.createdAt.toDate(), { addSuffix: true }) : "Just now"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View mode label */}
          <div className="absolute top-4 left-4 px-2 py-1 rounded bg-black/60 backdrop-blur-xl border border-white/10 text-xs text-gray-400 capitalize">
            {viewMode === "map" ? "Map View" : viewMode === "graph" ? "Graph View" : "Timeline"}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-72 xl:w-80 space-y-4">
          {/* Coverage Summary */}
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Coverage Summary
            </h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "Total Clusters", value: clusterCount.toString() },
                { label: "Total Assets", value: findings.toString() },
                { label: "Risk Coverage", value: `${coveragePercent}%`, red: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={`font-semibold ${item.red ? "text-red-400" : "text-gray-100"}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold mb-4">Risk Distribution</h3>
            <div className="space-y-3">
              {[
                { label: "Critical", color: "bg-red-500", text: "text-red-400", pct: parseInt(formatPercent(criticalFindings, totalFindings), 10) },
                { label: "High", color: "bg-orange-500", text: "text-orange-400", pct: parseInt(formatPercent(highFindings, totalFindings), 10) },
                { label: "Medium", color: "bg-yellow-500", text: "text-yellow-400", pct: parseInt(formatPercent(mediumFindings, totalFindings), 10) },
                { label: "Low", color: "bg-green-500", text: "text-green-400", pct: parseInt(formatPercent(lowFindings, totalFindings), 10) },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">{item.label}</span>
                    <span className={`${item.text} font-medium`}>{item.pct}%</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} transition-all`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Clusters */}
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold mb-4">Infrastructure Clusters</h3>
            <div className="flex flex-col items-center justify-center py-6">
              <Layers className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-xs text-gray-500">No clusters discovered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
