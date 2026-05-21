import { useState } from "react";
import { ZoomIn, ZoomOut, Maximize, Filter, Network, X, Info } from "lucide-react";
import { useScanContext } from "../contexts/ScanContext";

export function AttackGraph() {
  const [zoom, setZoom] = useState(100);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { scans, completedCount, activeCount, queuedCount, hasScans, isRunning, assets } = useScanContext();

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Attack Graph</h1>
          <p className="text-gray-400">Interactive network intelligence visualization</p>
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
            onClick={() => setFullscreen((v) => !v)}
            className="px-3 md:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all text-sm text-gray-300"
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden sm:inline">{fullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Inline Filters */}
      {filtersOpen && (
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium mb-2 text-gray-300">Asset Type</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                <option>All Types</option>
                <option>Web</option>
                <option>API</option>
                <option>Database</option>
                <option>Cloud</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Connection Type</label>
              <select className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                <option>All Connections</option>
                <option>Direct</option>
                <option>Indirect</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Info cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Nodes", value: hasScans ? scans.length.toString() : "0" },
          { label: "Attack Paths", value: hasScans ? completedCount.toString() : "0" },
          { label: "Critical Edges", value: hasScans ? activeCount.toString() : "0" },
          { label: "Isolated Assets", value: hasScans ? queuedCount.toString() : "0" },
        ].map((item, i) => (
          <div key={i} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <div className="text-2xl font-bold text-gray-500 mb-1">{item.value}</div>
            <div className="text-sm text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Legend + Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Legend */}
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold mb-3">Risk Level Legend</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { color: "bg-red-500", label: "Critical Risk Path" },
              { color: "bg-orange-500", label: "High Risk Path" },
              { color: "bg-yellow-500", label: "Medium Risk Path" },
              { color: "bg-green-500", label: "Low Risk Path" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-0.5 ${item.color} rounded-full flex-shrink-0`} />
                <span className="text-gray-400 text-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How to use */}
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            How to use
          </h3>
          <ul className="space-y-1 text-xs text-gray-400">
            <li>• Click nodes to view asset details</li>
            <li>• Use zoom controls to navigate the graph</li>
            <li>• Dashed edges indicate critical attack paths</li>
            <li>• Run a scan to populate this graph with real data</li>
          </ul>
        </div>
      </div>

      {/* Zoom controls + Graph SVG — at the bottom */}
      <div className={`rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden relative ${fullscreen ? "fixed inset-4 z-50" : "h-[400px] md:h-[500px]"}`}>
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 10, 200))}
            className="w-10 h-10 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-black/80 transition-all"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 10, 50))}
            className="w-10 h-10 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-black/80 transition-all"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-xs text-gray-300">
            {zoom}%
          </div>
        </div>

        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 left-4 z-10 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-xl border border-white/10 flex items-center gap-2 text-sm hover:bg-black/80 transition-all"
          >
            <X className="w-4 h-4" />
            Exit Fullscreen
          </button>
        )}

        {/* Graph SVG canvas */}
        <svg
          className="w-full h-full"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
        >
          <defs>
            <pattern id="attack-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#attack-grid)" />

          {/* Empty state inside SVG */}
          <g>
            <text
              x="50%"
              y="45%"
              textAnchor="middle"
              fill="rgba(255,255,255,0.15)"
              fontSize="14"
              fontFamily="system-ui, sans-serif"
            >
              No nodes to display
            </text>
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              fill="rgba(255,255,255,0.08)"
              fontSize="12"
              fontFamily="system-ui, sans-serif"
            >
              {isRunning ? "Scan in progress — populating the attack graph" : "Run a scan to populate the attack graph"}
            </text>
          </g>
        </svg>

        {/* Network icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Network className="w-16 h-16 text-gray-700 mx-auto mb-2" />
          </div>
        </div>

        {assets && assets.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
            <div className="bg-black/60 border border-white/10 rounded-xl p-3 flex gap-3 overflow-x-auto">
              {assets.slice(0, 8).map((a: any) => (
                <div key={a.id} className="px-3 py-2 bg-white/3 rounded-md text-sm text-gray-200">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-400">{a.type} · {a.riskScore}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
