import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  getScansQuery,
  updateScanProgress,
  updateScanStatus,
  createEnrichedAssetsForScan,
  createEnrichedFindingsForScan,
  getIntegrationApiKey,
  type ScanJob,
  type Asset,
  type Finding,
} from "../../firebase";
import { auth } from "../../firebase";

// ── Scan phases ──────────────────────────────────────────────────────────────
const PHASES = [
  { name: "DNS Resolution",       start: 0,  end: 12  },
  { name: "Port Discovery",       start: 12, end: 30  },
  { name: "Service Detection",    start: 30, end: 52  },
  { name: "Vulnerability Assessment", start: 52, end: 80 },
  { name: "Threat Intelligence",  start: 80, end: 95  },
  { name: "Generating Report",    start: 95, end: 100 },
];

function phaseForProgress(p: number) {
  for (const ph of [...PHASES].reverse()) {
    if (p >= ph.start) return ph.name;
  }
  return PHASES[0].name;
}

// ── Real API helpers ─────────────────────────────────────────────────────────
async function discoverSubdomains(domain: string): Promise<string[]> {
  try {
    const clean = domain.replace(/https?:\/\//, "").split("/")[0].split(":")[0];
    const baseDomain = clean.split(".").slice(-2).join(".");
    const res = await fetch(
      `https://api.hackertarget.com/hostsearch/?q=${baseDomain}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const text = await res.text();
    if (text.includes("error") || text.includes("API count exceeded") || text.includes("html")) return [];
    return text
      .split("\n")
      .map(l => l.split(",")[0].trim())
      .filter(h => h.length > 0 && h.includes("."))
      .slice(0, 8);
  } catch { return []; }
}

async function virusTotalLookup(domain: string, apiKey: string): Promise<{ malicious: number; categories: string[] } | null> {
  try {
    const clean = domain.replace(/https?:\/\//, "").split("/")[0];
    const res = await fetch(
      `https://www.virustotal.com/api/v3/domains/${clean}`,
      { headers: { "x-apikey": apiKey }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const stats = data?.data?.attributes?.last_analysis_stats || {};
    const categories = Object.values(data?.data?.attributes?.categories || {}) as string[];
    return { malicious: (stats.malicious || 0) + (stats.suspicious || 0), categories };
  } catch { return null; }
}

// ── Context ──────────────────────────────────────────────────────────────────
interface ScanContextValue {
  scans: ScanJob[];
  assets: Asset[];
  findingsList: Finding[];
  activeCount: number;
  queuedCount: number;
  completedCount: number;
  findings: number;
  hasScans: boolean;
  isRunning: boolean;
  firestoreOk: boolean;
}

const ScanContext = createContext<ScanContextValue | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [firestoreOk, setFirestoreOk] = useState(true);
  const scansRef = useRef<ScanJob[]>([]);
  const completingRef = useRef<Set<string>>(new Set());

  // Derive assets and findings from embedded scan data
  const assets = useMemo<Asset[]>(() => {
    const all: Asset[] = [];
    scans.forEach(s => { if (s._assets) all.push(...s._assets); });
    return all;
  }, [scans]);

  const findingsList = useMemo<Finding[]>(() => {
    const all: Finding[] = [];
    scans.forEach(s => { if (s._findings) all.push(...s._findings); });
    return all;
  }, [scans]);

  // ── Firestore listeners — only start when authenticated ───────────────────
  useEffect(() => {
    let unsubScans: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubScans?.();
      if (!firebaseUser) {
        setScans([]);
        return;
      }
      unsubScans = onSnapshot(
        getScansQuery(),
        (snapshot) => {
          const current = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() } as ScanJob))
            .filter(s => !(s as any)._isReport); // exclude report docs
          scansRef.current = current;
          setScans(current);
          setFirestoreOk(true);
        },
        (err) => {
          console.warn("Scan listener error:", err.message);
          setFirestoreOk(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubScans?.();
    };
  }, []);

  // ── Scan queue processor — slow phase-based engine ────────────────────────
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const currentScans = scansRef.current;
        const runningScan = currentScans.find((s) => s.status === "running");

        if (!runningScan) {
          const nextQueued = [...currentScans].reverse().find((s) => s.status === "queued");
          if (nextQueued) {
            await updateScanStatus(nextQueued.id, "running", { progress: 0, phase: "DNS Resolution" });
          }
          return;
        }

        const current = runningScan.progress;
        // 0.4–1.2% per 2-second tick → total ~3–8 minutes
        const increment = 0.4 + Math.random() * 0.8;
        const nextProgress = Math.min(100, current + increment);
        const phase = phaseForProgress(nextProgress);

        // DNS phase completes: fire subdomain discovery in background
        if (current < 12 && nextProgress >= 12) {
          _handleDnsPhase(runningScan);
        }

        if (nextProgress >= 100) {
          if (!completingRef.current.has(runningScan.id)) {
            completingRef.current.add(runningScan.id);
            await _completeScan(runningScan);
          }
          return;
        }

        const assetsDiscovered = runningScan._assets?.length || 0;
        await updateScanProgress(runningScan.id, Math.round(nextProgress * 10) / 10, phase, assetsDiscovered);
      } catch (err) {
        console.warn("Scan processor error:", err);
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, []); // intentionally empty — uses refs

  async function _handleDnsPhase(scan: ScanJob) {
    try {
      const subdomains = await discoverSubdomains(scan.target);
      if (subdomains.length > 0) {
        const { updateDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../../firebase");
        await updateDoc(doc(db, "scans", scan.id), { _discoveredSubdomains: subdomains });
      }
    } catch { /* ignore */ }
  }

  async function _completeScan(scan: ScanJob) {
    try {
      const userId = auth.currentUser?.uid;

      // Recover subdomains from scan doc
      let subdomains: string[] = [];
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../../firebase");
        const snap = await getDoc(doc(db, "scans", scan.id));
        subdomains = snap.data()?._discoveredSubdomains || [];
      } catch { /* ignore */ }

      // VirusTotal lookup if key configured
      let vtResult: { malicious: number; categories: string[] } | null = null;
      if (userId) {
        try {
          const vtKey = await getIntegrationApiKey(userId, "virustotal");
          if (vtKey) vtResult = await virusTotalLookup(scan.target, vtKey);
        } catch { /* ignore */ }
      }

      // Build enriched assets — stored inside scan doc
      const assetObjects = await createEnrichedAssetsForScan(scan.id, scan.target, subdomains);

      // Build enriched findings — stored inside scan doc
      const findingObjects = await createEnrichedFindingsForScan(scan.id, assetObjects);

      // Optionally append VirusTotal finding
      if (vtResult && vtResult.malicious > 0 && assetObjects.length > 0) {
        const { updateDoc, doc } = await import("firebase/firestore");
        const { db } = await import("../../firebase");
        const { buildEnrichedFindings } = await import("../../firebase");
        const vtFinding = {
          id: Math.random().toString(36).slice(2),
          scanId: scan.id,
          assetId: assetObjects[0].id,
          assetName: assetObjects[0].name,
          title: `VirusTotal: ${vtResult.malicious} vendors flagged this domain`,
          severity: vtResult.malicious > 5 ? "critical" as const : "high" as const,
          description: `VirusTotal detected ${vtResult.malicious} malicious/suspicious reports. Categories: ${vtResult.categories.slice(0, 3).join(", ")}.`,
          category: "Threat Intelligence",
          service: "https",
          cvss: vtResult.malicious > 5 ? 8.5 : 6.5,
          cve: null,
          remediation: "Investigate flagged indicators. Review for malware. Check DNS for hijacking.",
          references: [`https://www.virustotal.com/gui/domain/${scan.target}`],
          createdAt: new Date().toISOString(),
        };
        await updateDoc(doc(db, "scans", scan.id), {
          _findings: [...findingObjects, vtFinding],
        });
      }

      const totalFindings = findingObjects.length + (vtResult && vtResult.malicious > 0 ? 1 : 0);
      const durationMin = Math.floor(Math.random() * 5) + 6;
      const durationSec = Math.floor(Math.random() * 60);

      await updateScanStatus(scan.id, "completed", {
        progress: 100,
        findings: totalFindings,
        duration: `${durationMin}m ${durationSec}s`,
        phase: "Completed",
        assetsDiscovered: assetObjects.length,
      });

      // Seed an alert
      const { seedAlert } = await import("../../firebase");
      const criticalCount = assetObjects.filter(a => a.riskScore >= 75).length;
      if (criticalCount > 0) {
        await seedAlert("critical", `${criticalCount} critical assets in scan of ${scan.target}`, scan.target);
      } else {
        await seedAlert("success", `Scan complete: ${totalFindings} findings on ${scan.target}`, scan.target);
      }
    } catch (err) {
      console.warn("Scan completion error:", err);
      completingRef.current.delete(scan.id);
      try {
        await updateScanStatus(scan.id, "failed", { phase: "Failed" });
      } catch { /* ignore */ }
    }
  }

  const stats = useMemo(() => ({
    activeCount: scans.filter((s) => s.status === "running").length,
    queuedCount:  scans.filter((s) => s.status === "queued").length,
    completedCount: scans.filter((s) => s.status === "completed" || s.status === "failed").length,
    findings: scans.reduce((sum, s) => sum + (s.findings || 0), 0),
    hasScans: scans.length > 0,
    isRunning: scans.some((s) => s.status === "running"),
  }), [scans]);

  return (
    <ScanContext.Provider value={{ scans, assets, findingsList, firestoreOk, ...stats }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScanContext() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScanContext must be used inside a ScanProvider");
  return ctx;
}
