import { Link } from "react-router";
import {
  Sparkles,
  Shield,
  Target,
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useScanContext } from "../contexts/ScanContext";

export function AIRiskCenter() {
  const { findings, findingsList, completedCount, isRunning, hasScans } = useScanContext();
  const riskScore = hasScans
    ? Math.max(15, 100 - Math.min(findings, 12) * 5 - completedCount * 6)
    : null;
  const statusText = isRunning
    ? "Scanning in progress"
    : hasScans
    ? "Analysis ready"
    : "Waiting for data";
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-400" />
            AI Risk Center
          </h1>
          <p className="text-gray-400">AI-powered security intelligence and risk prediction</p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-gray-400 text-sm font-medium">{statusText}</span>
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
            <p className="text-sm text-gray-400 mb-4">Real-time AI assessment</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold text-gray-500">{riskScore ?? "--"}</span>
              <span className="text-2xl text-gray-600">/100</span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-gray-700 transition-all" style={{ width: riskScore ? `${riskScore}%` : "0%" }} />
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Scan your infrastructure to get an AI-powered global risk assessment.
            </p>
          </div>
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-white/10 flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-1" />
              <div className="text-xs text-gray-500">No data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Risk Analysis */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Predictive Risk Analysis
        </h2>
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-gray-300 mb-2">No predictions available</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-4">
            AI predictions will appear here once your assets have been scanned and analyzed.
          </p>
          <Link
            to="/monitoring"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium transition-all border border-purple-500/30"
          >
            Start a Scan
          </Link>
        </div>
      </div>

      {/* Attack Paths + Priority Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Attack Path Prediction */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            Attack Path Prediction
          </h2>
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 text-center">
            {findingsList && findingsList.length > 0 ? (
              <div className="p-4">
                <h4 className="text-sm text-gray-300 mb-2">Findings by severity</h4>
                <SimpleSeverityBars data={buildSeverityCounts(findingsList)} />
              </div>
            ) : (
              <div className="p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No attack paths predicted yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority Risk Queue */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Priority Risk Queue
          </h2>
          <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center">
            <Zap className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No items in the priority queue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildSeverityCounts(findingsList: any[]) {
  const buckets: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  findingsList.forEach((f) => {
    const sev = f.severity ? String(f.severity).charAt(0).toUpperCase() + String(f.severity).slice(1) : "Low";
    if (buckets[sev] !== undefined) buckets[sev] += 1;
  });
  return Object.entries(buckets).map(([k, v]) => ({ label: k, value: v }));
}

function SimpleSeverityBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-24 text-xs text-gray-300">{d.label}</div>
          <div className="flex-1 bg-black/30 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="w-8 text-right text-xs text-gray-300">{d.value}</div>
        </div>
      ))}
    </div>
  );
}
