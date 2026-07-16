import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Database,
  Network,
  Globe,
  Brain,
  Activity,
  FileText,
  Settings as SettingsIcon,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth, type Alert } from "./AuthProvider";
import { useTheme } from "../contexts/ThemeContext";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";

function alertAge(alert: Alert): string {
  if (!alert.timestamp) return "just now";
  try {
    return formatDistanceToNow(alert.timestamp.toDate(), { addSuffix: true });
  } catch {
    return "just now";
  }
}

function AlertIcon({ type }: { type: Alert["type"] }) {
  if (type === "critical") return <XCircle className="w-4 h-4" />;
  if (type === "warning") return <AlertTriangle className="w-4 h-4" />;
  if (type === "success") return <CheckCircle2 className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
}

function alertColors(type: Alert["type"]) {
  if (type === "critical") return "bg-red-500/20 text-red-400";
  if (type === "warning") return "bg-orange-500/20 text-orange-400";
  if (type === "success") return "bg-green-500/20 text-green-400";
  return "bg-cyan-500/20 text-cyan-400";
}

export function RootLayout() {
  const navigate = useNavigate();
  const { user, logout, alerts, unreadAlertCount, markAlertRead, markAllAlertsRead } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { path: "/", label: "Overview", icon: LayoutDashboard },
    { path: "/assets", label: "Assets", icon: Database },
    { path: "/attack-graph", label: "Attack Graph", icon: Network },
    { path: "/exposure-map", label: "Exposure Map", icon: Globe },
    { path: "/ai-risk", label: "AI Risk Center", icon: Brain },
    { path: "/monitoring", label: "Monitoring", icon: Activity },
    { path: "/reports", label: "Reports", icon: FileText },
    { path: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  function SidebarContent() {
    return (
      <>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img src="/logo-icon.jpg" alt="Vigil" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-semibold">Vigil</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-[color:var(--accent-muted)] border border-[color:var(--accent-border)] text-[color:var(--accent-text)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
            <div className="flex-1 text-left text-sm min-w-0">
              <div className="font-medium text-gray-200 truncate">
                {user?.displayName || user?.email?.split("@")[0] || "Workspace"}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role || "Member"}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? "bg-[#0a0a0f] text-gray-100" : "bg-slate-100 text-slate-900"} overflow-hidden`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex w-64 ${isDark ? "bg-black/40" : "bg-white/80"} backdrop-blur-xl border-r ${isDark ? "border-white/5" : "border-slate-200"} flex-col flex-shrink-0`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 ${isDark ? "bg-[#0d0d18]" : "bg-white"} border-r ${isDark ? "border-white/10" : "border-slate-200"} flex flex-col transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className={`relative z-20 h-16 ${isDark ? "bg-black/40" : "bg-white/80"} backdrop-blur-xl border-b ${isDark ? "border-white/5" : "border-slate-200"} flex items-center justify-between px-4 md:px-6 flex-shrink-0`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-all flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-2xl min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search assets, domains..."
                  className={`w-full ${isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"} border rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)]`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 ml-3 flex-shrink-0">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-400 hover:text-gray-200"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative p-2 hover:bg-white/5 rounded-lg transition-all"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                {unreadAlertCount > 0 && (
                  <span
                    style={{ backgroundColor: "var(--accent-primary)" }}
                    className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold text-black flex items-center justify-center px-0.5"
                  >
                    {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl ${isDark ? "bg-[#0d0d18]" : "bg-white"} border ${isDark ? "border-white/10" : "border-slate-200"} shadow-2xl z-50 overflow-hidden`}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {unreadAlertCount > 0 && (
                        <span style={{ color: "var(--accent-text)", backgroundColor: "var(--accent-muted)" }} className="px-1.5 py-0.5 rounded-full text-xs font-medium">
                          {unreadAlertCount} new
                        </span>
                      )}
                    </div>
                    {unreadAlertCount > 0 && (
                      <button
                        onClick={markAllAlertsRead}
                        style={{ color: "var(--accent-text)" }}
                        className="text-xs hover:opacity-80 transition-opacity"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className={`max-h-96 overflow-y-auto divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
                    {alerts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => markAlertRead(alert.id)}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            alert.effectivelyRead ? "hover:bg-white/5" : "bg-[color:var(--accent-muted)] hover:opacity-90"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${alertColors(alert.type)}`}>
                            <AlertIcon type={alert.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-tight">{alert.title}</p>
                              {!alert.effectivelyRead && (
                                <div style={{ backgroundColor: "var(--accent-primary)" }} className="w-2 h-2 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{alert.asset}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alertAge(alert)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={`px-4 py-3 border-t ${isDark ? "border-white/5" : "border-slate-100"}`}>
                    <button
                      onClick={() => { setNotifOpen(false); navigate("/monitoring"); }}
                      style={{ color: "var(--accent-text)" }}
                      className="w-full text-center text-xs hover:opacity-80 transition-opacity"
                    >
                      View all activity in Monitoring →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 rounded-lg border ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"} px-2 py-1.5`}>
                  <div
                    style={{ backgroundColor: "var(--accent-primary)" }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-black flex-shrink-0"
                  >
                    {user.email?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-medium truncate max-w-[120px]">{user.email}</div>
                    <div className="text-[10px] text-gray-400">{user.role}</div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                style={{ backgroundColor: "var(--accent-muted)", borderColor: "var(--accent-border)", color: "var(--accent-text)" }}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:opacity-90"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${isDark ? "bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]" : "bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
