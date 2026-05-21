import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Shield,
  Activity,
  Clock,
  AlertTriangle,
  Sparkles,
  Lock,
  Database,
} from "lucide-react";
import { useScanContext } from "../contexts/ScanContext";

export function AssetDetail() {
  const { assetId } = useParams();
  const { assets, findingsList } = useScanContext();
  const asset = assets.find((a) => a.id === assetId);
  const assetFindings = findingsList.filter((f) => f.assetId === assetId);
  const connected = assets.filter((a) => a.host === asset?.host && a.id !== asset?.id).length;
  const riskLevel = asset ? (asset.riskScore >= 75 ? "Critical" : asset.riskScore >= 50 ? "High" : asset.riskScore >= 30 ? "Medium" : "Low") : "--";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Back Navigation */}
      <Link
        to="/assets"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Assets
      </Link>

      {/* Header card */}
      <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Database className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-1">
                {asset ? asset.name : `Asset #${assetId}`}
              </h1>
              <p className="text-sm text-gray-400">{asset ? `Discovered ${asset.discoveredAt?.toDate ? asset.discoveredAt.toDate().toLocaleString() : "recently"}` : "No data available for this asset"}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-sm text-gray-400 mb-1">Risk Score</div>
            <div className="text-4xl font-bold text-gray-500">{asset ? asset.riskScore : "--"}</div>
            <div className="text-sm text-gray-400 mt-1">{asset ? `Host: ${asset.host}` : null}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="px-4 py-3 rounded-lg bg-black/40 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Type</div>
            <div className="font-semibold text-gray-500">{asset ? asset.type : "--"}</div>
          </div>
          <div className="px-4 py-3 rounded-lg bg-black/40 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Status</div>
            <div className="font-semibold text-gray-500">{asset ? "Active" : "--"}</div>
          </div>
          <div className="px-4 py-3 rounded-lg bg-black/40 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Risk Level</div>
            <div className="font-semibold text-gray-500">{asset ? riskLevel : "--"}</div>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl border border-purple-500/30 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Vexa AI Risk Analysis</h3>
              <p className="text-gray-400 text-sm">
              {assetFindings.length === 0
                ? "No scan findings for this asset yet. Run a scan from Monitoring to generate findings."
                : `${assetFindings.length} findings available for this asset.`}
            </p>
            <Link
              to="/monitoring"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium transition-all border border-purple-500/30"
            >
              Go to Monitoring
            </Link>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Technologies */}
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Detected Technologies
          </h3>
          <div className="flex flex-col items-start py-3 space-y-2">
            {asset ? (
              <>
                <div className="text-sm text-gray-400">Type</div>
                <div className="font-semibold text-gray-200">{asset.type}</div>
                <div className="text-sm text-gray-400 mt-2">Host</div>
                <div className="font-semibold text-gray-200">{asset.host}</div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <Shield className="w-10 h-10 text-gray-700 mb-2" />
                <p className="text-sm text-gray-500">No technologies detected yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Open Ports */}
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            Open Ports
          </h3>
          <div className="flex flex-col items-center justify-center py-6">
            <Lock className="w-10 h-10 text-gray-700 mb-2" />
            <p className="text-sm text-gray-500">No open ports detected yet</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Connected Assets */}
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Connected Assets
          </h3>
          <div className="flex flex-col items-start py-3">
            <div className="text-sm text-gray-400">Connected</div>
            <div className="font-semibold text-gray-200">{connected}</div>
            <div className="text-xs text-gray-400 mt-2">Related assets on same host</div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Activity Timeline
          </h3>
          <div className="space-y-2">
            {assetFindings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <AlertTriangle className="w-10 h-10 text-gray-700 mb-2" />
                <p className="text-sm text-gray-500">No events recorded yet</p>
              </div>
            ) : (
              <>
                <SmallTimelineChart findings={assetFindings} />
                <div className="space-y-2">
                  {assetFindings.map((f) => (
                    <div key={f.id} className="px-3 py-2 bg-white/5 rounded-md">
                      <div className="text-sm font-medium text-gray-200">{f.title}</div>
                      <div className="text-xs text-gray-400">Severity: {f.severity}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
