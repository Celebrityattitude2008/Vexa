import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  Globe, Filter, RefreshCw, Shield, Database,
  Cloud, Server, Wifi, Activity, AlertTriangle, ExternalLink,
} from "lucide-react";
import { useScanContext } from "../contexts/ScanContext";

const TYPE_ICONS: Record<string, any> = {
  Web: Globe,
  API: Wifi,
  Database: Database,
  Cloud: Cloud,
  Service: Server,
  Subdomain: Globe,
};

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Web:      { bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   text: "text-cyan-400",   dot: "bg-cyan-400" },
  API:      { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400",   dot: "bg-blue-400" },
  Database: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-400" },
  Cloud:    { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-400" },
  Service:  { bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400",  dot: "bg-green-400" },
  Subdomain:{ bg: "bg-pink-500/10",   border: "border-pink-500/30",   text: "text-pink-400",   dot: "bg-pink-400" },
};

function riskText(score: number) {
  if (score >= 75) return "text-red-400";
  if (score >= 50) return "text-orange-400";
  if (score >= 30) return "text-yellow-400";
  return "text-green-400";
}

function riskBg(score: number) {
  if (score >= 75) return "border-red-500/40 bg-red-500/5";
  if (score >= 50) return "border-orange-500/40 bg-orange-500/5";
  if (score >= 30) return "border-yellow-500/40 bg-yellow-500/5";
  return "border-green-500/40 bg-green-500/5";
}

function riskLabel(score: number) {
  if (score >= 75) return "Critical";
  if (score >= 50) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

export function ExposureMap() {
  const { assets, findingsList, isRunning, scans } = useScanContext();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const completedScans = scans.filter(s => s.status === "completed");

  const filteredAssets = useMemo(() => {
    let result = assets;
    if (selectedScan) result = result.filter(a => a.scanId === selectedScan);
    if (selectedType) result = result.filter(a => a.type === selectedType);
    return result;
  }, [assets, selectedScan, selectedType]);

  const clusters = useMemo(() => {
    const map: Record<string, typeof assets> = {};
    filteredAssets.forEach(a => {
      if (!map[a.type]) map[a.type] = [];
      map[a.type].push(a);
    });
    return Object.entries(map).map(([type, list]) => ({
      type,
      assets: list.sort((a, b) => b.riskScore - a.riskScore),
      maxRisk: Math.max(...list.map(a => a.riskScore), 0),
      criticalCount: list.filter(a => a.riskScore >= 75).length,
      highCount: list.filter(a => a.riskScore >= 50 && a.riskScore < 75).length,
    })).sort((a, b) => b.maxRisk - a.maxRisk);
  }, [filteredAssets]);

  const totalCritical = filteredAssets.filter(a => a.riskScore >= 75).length;
  const totalHigh = filteredAssets.filter(a => a.riskScore >= 50 && a.riskScore < 75).length;
  const avgRisk = filteredAssets.length > 0
    ? Math.round(filteredAssets.reduce((s, a) => s + a.riskScore, 0) / filteredAssets.length)
    : 0;
  const assetFindings = (id: string) => findingsList.filter(f => f.assetId === id).length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Exposure Map</h1>
          <p className="text-gray-400">Infrastructure cluster visualization and risk coverage</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {completedScans.length > 0 && (
            <select
              value={selectedScan || ""}
              onChange={e => setSelectedScan(e.target.value || null)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">All Scans</option>
              {completedScans.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button
            onClick={() => { setSelectedType(null); setSelectedScan(null); setSelectedAsset(null); }}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all text-sm text-gray-300"
          >
            <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Assets",   value: filteredAssets.length, icon: Shield,        color: "text-cyan-400" },
          { label: "Critical Risk",  value: totalCritical,         icon: AlertTriangle, color: "text-red-400" },
          { label: "High Risk",      value: totalHigh,             icon: Activity,      color: "text-orange-400" },
          { label: "Avg Risk Score", value: avgRisk || "—",        icon: Activity,
            color: avgRisk >= 60 ? "text-red-400" : avgRisk >= 40 ? "text-yellow-400" : "text-green-400" },
        ].map((item, i) => (
          <div key={i} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{item.label}</span>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className={`text-2xl font-bold ${typeof item.value === "number" && item.value === 0 ? "text-gray-500" : item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      {assets.length === 0 ? (
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-12 text-center">
          <Globe className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-400 mb-2">
            {isRunning ? "Discovering infrastructure…" : "No exposure data yet"}
          </h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
            {isRunning
              ? "Assets are being discovered. The map will populate once the scan completes."
              : "Run a scan from Monitoring to discover your infrastructure exposure."}
          </p>
          {!isRunning && (
            <Link to="/monitoring" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium transition-all border border-cyan-500/30">
              Start Scanning
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Clusters sidebar */}
          <div className="xl:col-span-1 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              Infrastructure Clusters
            </h2>
            {clusters.length === 0 ? (
              <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center text-sm text-gray-500">
                No clusters match the current filter
              </div>
            ) : (
              <div className="space-y-2">
                {clusters.map(cluster => {
                  const Icon = TYPE_ICONS[cluster.type] || Globe;
                  const colors = TYPE_COLORS[cluster.type] || TYPE_COLORS["Web"];
                  const isSelected = selectedType === cluster.type;
                  return (
                    <button
                      key={cluster.type}
                      onClick={() => setSelectedType(isSelected ? null : cluster.type)}
                      className={`w-full rounded-xl border p-4 transition-all text-left ${isSelected ? `${colors.bg} ${colors.border}` : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.bg} ${colors.border} border`}>
                            <Icon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-200">{cluster.type}</div>
                            <div className="text-xs text-gray-400">{cluster.assets.length} asset{cluster.assets.length !== 1 ? "s" : ""}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-bold ${riskText(cluster.maxRisk)}`}>{cluster.maxRisk}</div>
                          <div className="text-xs text-gray-500">max risk</div>
                        </div>
                      </div>
                      {(cluster.criticalCount > 0 || cluster.highCount > 0) && (
                        <div className="flex gap-2 mt-2">
                          {cluster.criticalCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{cluster.criticalCount} critical</span>}
                          {cluster.highCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">{cluster.highCount} high</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Asset grid */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedType ? `${selectedType} Assets` : "All Assets"}
                <span className="text-sm text-gray-400 ml-2 font-normal">({filteredAssets.length})</span>
              </h2>
              {selectedType && (
                <button onClick={() => setSelectedType(null)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Show all</button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAssets.map(asset => {
                const Icon = TYPE_ICONS[asset.type] || Globe;
                const colors = TYPE_COLORS[asset.type] || TYPE_COLORS["Web"];
                const findings = assetFindings(asset.id);
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${isSelected ? "bg-white/10 border-white/20" : `${riskBg(asset.riskScore)} hover:bg-white/5`}`}
                    onClick={() => setSelectedAsset(isSelected ? null : asset)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg} ${colors.border} border flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-gray-200 truncate">{asset.name}</div>
                          <div className="text-xs text-gray-500 truncate font-mono">{asset.host}</div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${riskText(asset.riskScore)} flex-shrink-0`}>{asset.riskScore}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />{asset.type}</span>
                      {asset.ipAddress && <span className="font-mono">{asset.ipAddress}</span>}
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${asset.riskScore >= 75 ? "bg-red-500" : asset.riskScore >= 50 ? "bg-orange-500" : asset.riskScore >= 30 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${asset.riskScore}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${riskText(asset.riskScore)}`}>{riskLabel(asset.riskScore)} Risk</span>
                      {findings > 0 && <span className="text-orange-400">{findings} finding{findings !== 1 ? "s" : ""}</span>}
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {asset.technologies?.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Technologies</div>
                            <div className="flex flex-wrap gap-1">
                              {asset.technologies.slice(0, 3).map((t: string, i: number) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-300">{t.split(" ")[0]}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {asset.ports?.filter((p: any) => p.state === "open").length > 0 && (
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Open Ports</div>
                            <div className="flex flex-wrap gap-1">
                              {asset.ports.filter((p: any) => p.state === "open").map((p: any, i: number) => (
                                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">{p.port}/{p.service}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <Link
                          to={`/assets/${asset.id}`}
                          className="flex items-center justify-center gap-2 w-full mt-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-medium transition-all border border-cyan-500/30"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" /> Full Details
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
