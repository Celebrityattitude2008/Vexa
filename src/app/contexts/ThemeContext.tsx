import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light";
export type AccentColor = "cyan" | "purple" | "blue" | "green" | "orange" | "rose";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  isDark: boolean;
}

export const ACCENT_CONFIGS: Record<
  AccentColor,
  { primary: string; muted: string; text: string; border: string; hover: string; label: string; tw: string }
> = {
  cyan:   { primary: "#06b6d4", muted: "rgba(6,182,212,0.2)",   text: "#22d3ee", border: "rgba(6,182,212,0.3)",   hover: "rgba(6,182,212,0.3)",   label: "Cyan",   tw: "bg-cyan-500" },
  purple: { primary: "#a855f7", muted: "rgba(168,85,247,0.2)",  text: "#c084fc", border: "rgba(168,85,247,0.3)",  hover: "rgba(168,85,247,0.3)",  label: "Purple", tw: "bg-purple-500" },
  blue:   { primary: "#3b82f6", muted: "rgba(59,130,246,0.2)",  text: "#60a5fa", border: "rgba(59,130,246,0.3)",  hover: "rgba(59,130,246,0.3)",  label: "Blue",   tw: "bg-blue-500" },
  green:  { primary: "#22c55e", muted: "rgba(34,197,94,0.2)",   text: "#4ade80", border: "rgba(34,197,94,0.3)",   hover: "rgba(34,197,94,0.3)",   label: "Green",  tw: "bg-green-500" },
  orange: { primary: "#f97316", muted: "rgba(249,115,22,0.2)",  text: "#fb923c", border: "rgba(249,115,22,0.3)",  hover: "rgba(249,115,22,0.3)",  label: "Orange", tw: "bg-orange-500" },
  rose:   { primary: "#f43f5e", muted: "rgba(244,63,94,0.2)",   text: "#fb7185", border: "rgba(244,63,94,0.3)",   hover: "rgba(244,63,94,0.3)",   label: "Rose",   tw: "bg-rose-500" },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyAccent(color: AccentColor) {
  const cfg = ACCENT_CONFIGS[color];
  const root = document.documentElement;
  root.style.setProperty("--accent-primary", cfg.primary);
  root.style.setProperty("--accent-muted", cfg.muted);
  root.style.setProperty("--accent-text", cfg.text);
  root.style.setProperty("--accent-border", cfg.border);
  root.style.setProperty("--accent-hover", cfg.hover);
}

function applyTheme(theme: ThemeMode) {
  const html = document.documentElement;
  if (theme === "dark") {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try { return (localStorage.getItem("vigil-theme") as ThemeMode) || "dark"; } catch { return "dark"; }
  });
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    try { return (localStorage.getItem("vigil-accent") as AccentColor) || "cyan"; } catch { return "cyan"; }
  });

  useEffect(() => {
    applyTheme(theme);
    applyAccent(accentColor);
  }, []);

  const setTheme = (t: ThemeMode) => {
    try { localStorage.setItem("vigil-theme", t); } catch {}
    setThemeState(t);
    applyTheme(t);
  };

  const setAccentColor = (c: AccentColor) => {
    try { localStorage.setItem("vigil-accent", c); } catch {}
    setAccentColorState(c);
    applyAccent(c);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
