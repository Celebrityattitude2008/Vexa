import { useState } from "react";
import { Link } from "react-router";
import { Search, Filter, Download, Database, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useScanContext } from "../contexts/ScanContext";

export function Assets() {
  const { findings, completedCount, hasScans, assets } = useScanContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleExport = () => {
    toast.info("Export prepared", {
      description: "No assets to export yet. Add assets to enable export.",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Assets Explorer</h1>
          <p className="text-gray-400">
            {hasScans ? `${findings} total findings from ${completedCount} completed scans` : "0 total assets discovered"}
          </p>
        </div>
        <div className="flex gap-2">
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
          <button
            onClick={handleExport}
            className="px-3 md:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-2 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, domain, IP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
        />
      </div>

      {/* Inline Filters */}
      {filtersOpen && (
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Asset Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="all">All Types</option>
                <option value="API">API</option>
                <option value="Subdomain">Subdomain</option>
                <option value="Cloud">Cloud</option>
                <option value="Database">Database</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Risk Level</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical (80+)</option>
                <option value="high">High (60–79)</option>
                <option value="medium">Medium (40–59)</option>
                <option value="low">Low (&lt;40)</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => { setFilterType("all"); setFilterRisk("all"); }}
            className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Empty State */}
      <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        {/* Table header */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/40 border-b border-white/10">
              <tr>
                <th className="text-left px-4 md:px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Asset Name</th>
                <th className="text-left px-4 md:px-6 py-4 text-sm font-semibold text-gray-300 hidden sm:table-cell whitespace-nowrap">Type</th>
                <th className="text-left px-4 md:px-6 py-4 text-sm font-semibold text-gray-300 hidden md:table-cell whitespace-nowrap">Status</th>
                <th className="text-left px-4 md:px-6 py-4 text-sm font-semibold text-gray-300 whitespace-nowrap">Risk Score</th>
                <th className="text-left px-4 md:px-6 py-4 text-sm font-semibold text-gray-300 hidden lg:table-cell whitespace-nowrap">Last Seen</th>
                <th className="text-right px-4 md:px-6 py-4 text-sm font-semibold text-gray-300"></th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <Database className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">No assets discovered</h3>
                      <p className="text-gray-500 text-sm max-w-sm mb-6">
                        Start a scan from the Monitoring page to discover assets in your infrastructure.
                      </p>
                      <Link
                        to="/monitoring"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium transition-all border border-cyan-500/30"
                      >
                        Go to Monitoring
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/3">
                    <td className="px-4 md:px-6 py-3 text-sm font-medium text-gray-200">{asset.name}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-gray-400 hidden sm:table-cell">{asset.type}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-gray-400 hidden md:table-cell">--</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-gray-200">{asset.riskScore}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-gray-400 hidden lg:table-cell">{asset.discoveredAt ? new Date(asset.discoveredAt).toLocaleString() : "--"}</td>
                    <td className="px-4 md:px-6 py-3 text-right text-sm">
                      <Link to={`/assets/${asset.id}`} className="text-cyan-400 hover:underline">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
