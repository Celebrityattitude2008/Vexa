import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Shield,
  AlertTriangle,
  Clock,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  { name: "Executive Summary", icon: TrendingUp, color: "cyan", desc: "High-level overview for leadership" },
  { name: "Technical Audit", icon: Shield, color: "blue", desc: "Detailed technical findings" },
  { name: "Compliance Report", icon: FileText, color: "purple", desc: "Regulatory compliance status" },
  { name: "Risk Assessment", icon: AlertTriangle, color: "orange", desc: "Risk scoring and prioritization" },
];

export function Reports() {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Executive Summary");
  const [generating, setGenerating] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    frequency: "weekly",
    recipients: "",
  });
  const [scheduling, setScheduling] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGenerating(false);
    setShowGenerateModal(false);
    toast.success("Report queued", {
      description: `Your ${selectedTemplate} is being generated and will be ready shortly.`,
    });
  };

  const handleSchedule = async () => {
    if (!scheduleForm.title.trim()) {
      toast.error("Please enter a report title.");
      return;
    }
    setScheduling(true);
    await new Promise((r) => setTimeout(r, 800));
    setScheduling(false);
    setShowScheduleModal(false);
    setScheduleForm({ title: "", frequency: "weekly", recipients: "" });
    toast.success("Report scheduled", {
      description: `"${scheduleForm.title}" will run ${scheduleForm.frequency}.`,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Reports</h1>
          <p className="text-gray-400">Security intelligence reports and analytics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3 md:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all text-sm"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-3 md:px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 flex items-center gap-2 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Reports", icon: FileText, color: "text-cyan-400", value: "0" },
          { label: "This Month", icon: Calendar, color: "text-green-400", value: "0" },
          { label: "Scheduled", icon: Clock, color: "text-yellow-400", value: "0" },
          { label: "Downloads", icon: Download, color: "text-purple-400", value: "0" },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-500">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Reports — empty */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-300 mb-2">No reports generated yet</h3>
          <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">
            Generate your first report to get a summary of your security posture.
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium transition-all border border-cyan-500/30"
          >
            <Plus className="w-4 h-4" />
            Generate First Report
          </button>
        </div>
      </div>

      {/* Scheduled Reports — empty */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          Scheduled Reports
        </h2>
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center">
          <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-3">No scheduled reports</p>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Set up a schedule →
          </button>
        </div>
      </div>

      {/* Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {TEMPLATES.map((template, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedTemplate(template.name);
                setShowGenerateModal(true);
              }}
              className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 hover:bg-white/10 transition-colors text-left group"
            >
              <div className={`w-12 h-12 rounded-lg bg-${template.color}-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <template.icon className={`w-6 h-6 text-${template.color}-400`} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
              <p className="text-xs text-gray-500">{template.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0d0d18] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Generate Report</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTemplate(t.name)}
                      className={`p-3 rounded-lg border text-left text-sm transition-all ${
                        selectedTemplate === t.name
                          ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Period</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Custom range</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Format</label>
                <div className="flex gap-2">
                  {["PDF", "CSV", "JSON"].map((fmt) => (
                    <button key={fmt} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-all">
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGenerateModal(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all">
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 px-4 py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0d0d18] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Schedule Report</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">
                  Report Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Security Digest"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Frequency</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, frequency: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Recipients (emails)</label>
                <input
                  type="text"
                  placeholder="email@example.com, another@example.com"
                  value={scheduleForm.recipients}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, recipients: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all">
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={scheduling}
                className="flex-1 px-4 py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {scheduling ? (
                  <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                {scheduling ? "Saving..." : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
