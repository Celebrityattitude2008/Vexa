import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot } from "firebase/firestore";
import {
  getScansQuery,
  buildEnrichedAssets,
  buildEnrichedFindings,
  type ScanJob,
  type Asset,
  type Finding,
  type ScanStatus,
} from "../../firebase";
import { auth } from "../../firebase";

// ── Per-user Local Storage helpers ──────────────────────────────────────────
// Each user's scans are stored under their own key so users never see each
// other's data even when they share the same browser.
function lsKey(uid: string) {
  return `vigil_scans_v4_${uid}`;
}

function makeFakeTimestamp(isoStr: string | null | undefined) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return { toDate: () => d, toMillis: () => d.getTime(), seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 };
}

function serializeScan(scan: ScanJob): object {
  return {
    ...scan,
    createdAt: (scan.createdAt as any)?.toDate?.()?.toISOString?.() ?? scan.createdAt ?? null,
    startedAt: (scan.startedAt as any)?.toDate?.()?.toISOString?.() ?? scan.startedAt ?? null,
    completedAt: (scan.completedAt as any)?.toDate?.()?.toISOString?.() ?? scan.completedAt ?? null,
  };
}

function deserializeScan(data: any): ScanJob {
  return {
    ...data,
    createdAt: typeof data.createdAt === "string" ? makeFakeTimestamp(data.createdAt) as any : data.createdAt ?? null,
    startedAt: typeof data.startedAt === "string" ? makeFakeTimestamp(data.startedAt) as any : data.startedAt ?? null,
    completedAt: typeof data.completedAt === "string" ? makeFakeTimestamp(data.completedAt) as any : data.completedAt ?? null,
  };
}

function loadUserScans(uid: string): ScanJob[] {
  try {
    const raw = localStorage.getItem(lsKey(uid));
    if (!raw) return [];
    return (JSON.parse(raw) as any[]).map(deserializeScan);
  } catch { return []; }
}

function saveUserScans(uid: string, scans: ScanJob[]) {
  try {
    localStorage.setItem(lsKey(uid), JSON.stringify(scans.map(serializeScan)));
  } catch { /* storage full or private mode */ }
}

function newLocalTimestamp() {
  const d = new Date();
  return { toDate: () => d, toMillis: () => d.getTime(), seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 } as any;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Scan phases ──────────────────────────────────────────────────────────────
const PHASES = [
  { name: "DNS Resolution",           start: 0,  end: 12  },
  { name: "Port Discovery",           start: 12, end: 30  },
  { name: "Service Detection",        start: 30, end: 52  },
  { name: "Vulnerability Assessment", start: 52, end: 80  },
  { name: "Threat Intelligence",      start: 80, end: 95  },
  { name: "Generating Report",        start: 95, end: 100 },
];

function phaseForProgress(p: number) {
  for (const ph of [...PHASES].reverse()) if (p >= ph.start) return ph.name;
  return PHASES[0].name;
}

// ── API helpers ──────────────────────────────────────────────────────────────

function cleanHost(target: string): string {
  return target.replace(/https?:\/\//, "").split("/")[0].split(":")[0];
}

// HackerTarget — free subdomain enumeration (no key needed)
async function discoverSubdomains(domain: string): Promise<string[]> {
  try {
    const clean = cleanHost(domain);
    const base = clean.split(".").slice(-2).join(".");
    const res = await fetch(`https://api.hackertarget.com/hostsearch/?q=${base}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (text.includes("error") || text.includes("API count") || text.includes("<html")) return [];
    return text.split("\n").map(l => l.split(",")[0].trim()).filter(h => h.length > 0 && h.includes(".")).slice(0, 8);
  } catch { return []; }
}

// VirusTotal — domain reputation
async function virusTotalLookup(domain: string, apiKey: string): Promise<{ malicious: number; categories: string[] } | null> {
  try {
    const clean = cleanHost(domain);
    const res = await fetch(`https://www.virustotal.com/api/v3/domains/${clean}`, {
      headers: { "x-apikey": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const stats = data?.data?.attributes?.last_analysis_stats || {};
    const cats = Object.values(data?.data?.attributes?.categories || {}) as string[];
    return { malicious: (stats.malicious || 0) + (stats.suspicious || 0), categories: cats };
  } catch { return null; }
}

// Shodan — via backend proxy (avoids browser CORS restrictions)
async function shodanDomainLookup(domain: string): Promise<{ subdomains: string[]; ports: number[]; tags: string[] } | null> {
  try {
    const clean = cleanHost(domain);
    const base = clean.split(".").slice(-2).join(".");
    const res = await fetch(`/api/shodan/domain/${encodeURIComponent(base)}`, {
      signal: AbortSignal.timeout(14000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    const subs: string[] = (data.subdomains || []).slice(0, 8).map((s: string) => `${s}.${base}`);
    const ports: number[] = data.ports || [];
    const tags: string[] = data.tags || [];
    return { subdomains: subs, ports, tags };
  } catch { return null; }
}

// Censys — via backend proxy
async function censysHostLookup(domain: string): Promise<{ services: string[]; certs: string[] } | null> {
  try {
    const clean = cleanHost(domain);
    const res = await fetch(`/api/censys/certs?q=${encodeURIComponent(`parsed.names: ${clean}`)}`, {
      signal: AbortSignal.timeout(14000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const hits = data?.result?.hits || [];
    const certs: string[] = hits.map((h: any) => h?.parsed?.subject_dn || "").filter(Boolean).slice(0, 3);
    return { services: [], certs };
  } catch { return null; }
}

// VirusTotal — via backend proxy
async function virusTotalLookupProxy(domain: string): Promise<{ malicious: number; categories: string[] } | null> {
  try {
    const clean = cleanHost(domain);
    const res = await fetch(`/api/virustotal/domain/${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const stats = data?.data?.attributes?.last_analysis_stats || {};
    const cats = Object.values(data?.data?.attributes?.categories || {}) as string[];
    return { malicious: (stats.malicious || 0) + (stats.suspicious || 0), categories: cats };
  } catch { return null; }
}

// SSL Labs (Qualys) — via backend proxy
async function sslLabsLookup(domain: string): Promise<{ grade: string; hasIssues: boolean; protocol: string } | null> {
  try {
    const clean = cleanHost(domain);
    if (!/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(clean)) return null;
    const res = await fetch(`/api/ssllabs/analyze?host=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(18000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === "ERROR" || !data.endpoints?.length) return null;
    const ep = data.endpoints[0];
    return {
      grade: ep.grade || "T",
      hasIssues: ["C", "D", "E", "F", "T", "M"].includes(ep.grade || ""),
      protocol: data.protocol || "TLS",
    };
  } catch { return null; }
}

// ── Context types ────────────────────────────────────────────────────────────
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
  createScan: (userId: string, data: { name: string; target: string; scanType: string }) => Promise<string>;
  deleteScan: (id: string) => Promise<void>;
  pauseScan: (scan: ScanJob) => Promise<void>;
}

const ScanContext = createContext<ScanContextValue | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  // Start with empty scans — loaded per-user once auth resolves
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [firestoreOk, setFirestoreOk] = useState(true);

  const scansRef = useRef<ScanJob[]>([]);
  const currentUidRef = useRef<string | null>(null);
  const completingRef = useRef<Set<string>>(new Set());

  // ── Persist to user-specific localStorage whenever scans change ────────────
  useEffect(() => {
    scansRef.current = scans;
    const uid = currentUidRef.current;
    if (uid) {
      saveUserScans(uid, scans);
    }
  }, [scans]);

  // ── Auth state: load/clear per-user scans ──────────────────────────────────
  useEffect(() => {
    let unsubScans: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubScans?.();
      unsubScans = null;

      if (!firebaseUser) {
        // User logged out — clear all scan state immediately
        currentUidRef.current = null;
        setScans([]);
        scansRef.current = [];
        completingRef.current.clear();
        return;
      }

      const uid = firebaseUser.uid;

      // Only reload from localStorage if switching users
      if (currentUidRef.current !== uid) {
        currentUidRef.current = uid;
        const userScans = loadUserScans(uid);
        setScans(userScans);
        scansRef.current = userScans;
        completingRef.current.clear();
      }

      // Attempt to sync from Firestore — if it fails, we just use localStorage
      try {
        unsubScans = onSnapshot(
          getScansQuery(),
          (snapshot) => {
            // Only process if this is still the current user
            if (currentUidRef.current !== uid) return;

            const remoteDocs = snapshot.docs
              .map(d => deserializeScan({ id: d.id, ...d.data() }))
              .filter((s: any) => !s._isReport && s.createdBy === uid);

            setScans(prev => {
              const merged = [...prev];
              for (const remote of remoteDocs) {
                const li = merged.findIndex(s => s.id === remote.id);
                if (li === -1) {
                  merged.push(remote);
                } else {
                  merged[li] = {
                    ...remote,
                    _assets: remote._assets?.length ? remote._assets : merged[li]._assets,
                    _findings: remote._findings?.length ? remote._findings : merged[li]._findings,
                  };
                }
              }
              return merged;
            });
            setFirestoreOk(true);
          },
          (err) => {
            console.info("Firestore unavailable, using local storage:", err.code || err.message);
            setFirestoreOk(false);
          }
        );
      } catch (e) {
        console.info("Firestore setup failed, using local storage:", e);
        setFirestoreOk(false);
      }
    });

    return () => { unsubAuth(); unsubScans?.(); };
  }, []);

  // ── Local mutation helpers ─────────────────────────────────────────────────
  const upsertScan = useCallback((id: string, patch: Partial<ScanJob>) => {
    setScans(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      return updated;
    });
  }, []);

  // ── Best-effort Firestore write ────────────────────────────────────────────
  async function tryFirestore(fn: () => Promise<void>) {
    try { await fn(); } catch { /* ignore — local state is already updated */ }
  }

  // ── Public actions ────────────────────────────────────────────────────────
  const createScan = useCallback(async (
    userId: string,
    data: { name: string; target: string; scanType: string }
  ): Promise<string> => {
    const id = uuid();
    const now = newLocalTimestamp();
    const newScan: ScanJob = {
      id,
      name: data.name,
      target: data.target,
      scanType: data.scanType as any,
      status: "queued",
      progress: 0,
      findings: 0,
      duration: null,
      phase: "Queued",
      assetsDiscovered: 0,
      _assets: [],
      _findings: [],
      createdBy: userId,
      createdAt: now,
      startedAt: null,
      completedAt: null,
    };
    setScans(prev => [newScan, ...prev]);

    tryFirestore(async () => {
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("../../firebase");
      await addDoc(collection(db, "scans"), {
        id,
        name: data.name,
        target: data.target,
        scanType: data.scanType,
        status: "queued",
        progress: 0,
        findings: 0,
        duration: null,
        phase: "Queued",
        assetsDiscovered: 0,
        _assets: [],
        _findings: [],
        createdBy: userId,
        createdAt: serverTimestamp(),
        startedAt: null,
        completedAt: null,
      });
    });

    return id;
  }, []);

  const deleteScan = useCallback(async (id: string) => {
    setScans(prev => prev.filter(s => s.id !== id));
    tryFirestore(async () => {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../../firebase");
      await deleteDoc(doc(db, "scans", id));
    });
  }, []);

  const pauseScan = useCallback(async (scan: ScanJob) => {
    const newStatus: ScanStatus = scan.status === "paused" ? "running" : "paused";
    upsertScan(scan.id, { status: newStatus });
    tryFirestore(async () => {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../../firebase");
      await updateDoc(doc(db, "scans", scan.id), { status: newStatus });
    });
  }, [upsertScan]);

  // ── Scan engine (local, 2-second tick) ────────────────────────────────────
  useEffect(() => {
    const timer = window.setInterval(async () => {
      const current = scansRef.current;
      const running = current.find(s => s.status === "running");

      if (!running) {
        const queued = [...current].reverse().find(s => s.status === "queued");
        if (queued) {
          const patch: Partial<ScanJob> = { status: "running", progress: 0, phase: "DNS Resolution", startedAt: newLocalTimestamp() };
          upsertScan(queued.id, patch);
          tryFirestore(async () => {
            const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
            const { db } = await import("../../firebase");
            await updateDoc(doc(db, "scans", queued.id), { status: "running", progress: 0, phase: "DNS Resolution", startedAt: serverTimestamp() });
          });
        }
        return;
      }

      const prev = running.progress;
      const increment = 0.4 + Math.random() * 0.8;
      const next = Math.min(100, prev + increment);
      const phase = phaseForProgress(next);

      if (prev < 12 && next >= 12) _handleDnsPhase(running);

      if (next >= 100) {
        if (!completingRef.current.has(running.id)) {
          completingRef.current.add(running.id);
          _completeScan(running);
        }
        return;
      }

      const roundedNext = Math.round(next * 10) / 10;
      upsertScan(running.id, { progress: roundedNext, phase, assetsDiscovered: running._assets?.length || 0 });
      tryFirestore(async () => {
        const { doc, updateDoc } = await import("firebase/firestore");
        const { db } = await import("../../firebase");
        await updateDoc(doc(db, "scans", running.id), { progress: roundedNext, phase, assetsDiscovered: running._assets?.length || 0 });
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [upsertScan]);

  async function _handleDnsPhase(scan: ScanJob) {
    try {
      // Run HackerTarget + Shodan subdomain discovery in parallel (Shodan via proxy)
      const [htSubs, shodanData] = await Promise.all([
        discoverSubdomains(scan.target),
        shodanDomainLookup(scan.target),
      ]);

      // Merge subdomains from both sources, deduplicate
      const allSubs = [...new Set([...htSubs, ...(shodanData?.subdomains || [])])].slice(0, 12);

      setScans(prev => {
        const idx = prev.findIndex(s => s.id === scan.id);
        if (idx === -1) return prev;
        const updated = [...prev];
        (updated[idx] as any)._discoveredSubdomains = allSubs;
        (updated[idx] as any)._shodanPorts = shodanData?.ports || [];
        (updated[idx] as any)._shodanTags = shodanData?.tags || [];
        return updated;
      });
    } catch { /* ignore */ }
  }

  async function _completeScan(scan: ScanJob) {
    try {
      const uid = currentUidRef.current;
      const subdomains: string[] = (scan as any)._discoveredSubdomains || [];
      const shodanPorts: number[] = (scan as any)._shodanPorts || [];
      const shodanTags: string[] = (scan as any)._shodanTags || [];

      // Run all threat-intel lookups in parallel via backend proxy
      const [vtResult, censysResult, sslResult] = await Promise.all([
        virusTotalLookupProxy(scan.target),
        censysHostLookup(scan.target),
        sslLabsLookup(scan.target),
      ]);

      const assets = buildEnrichedAssets(scan.id, scan.target, subdomains);

      // Inject Shodan port data into discovered assets
      if (shodanPorts.length > 0 && assets.length > 0) {
        assets[0].ports = [
          ...( assets[0].ports || []),
          ...shodanPorts
            .filter(p => !(assets[0].ports || []).some((ep: any) => ep.port === p))
            .map(p => ({ port: p, service: "unknown", state: "open" as const })),
        ];
      }
      if (shodanTags.length > 0 && assets.length > 0) {
        assets[0].technologies = [...new Set([...(assets[0].technologies || []), ...shodanTags])];
      }

      const findings = buildEnrichedFindings(assets);
      const allFindings = [...findings];

      // VirusTotal finding
      if (vtResult && vtResult.malicious > 0 && assets.length > 0) {
        allFindings.push({
          id: uuid(), scanId: scan.id, assetId: assets[0].id, assetName: assets[0].name,
          title: `VirusTotal: ${vtResult.malicious} vendors flagged this domain`,
          severity: vtResult.malicious > 5 ? "critical" : "high",
          description: `VirusTotal detected ${vtResult.malicious} malicious/suspicious reports. Categories: ${vtResult.categories.slice(0, 3).join(", ")}.`,
          category: "Threat Intelligence", service: "https",
          cvss: vtResult.malicious > 5 ? 8.5 : 6.5, cve: null,
          remediation: "Investigate flagged indicators. Review for malware. Check DNS for hijacking.",
          references: [`https://www.virustotal.com/gui/domain/${cleanHost(scan.target)}`],
          createdAt: new Date().toISOString(),
        } as any);
      }

      // SSL Labs / Qualys TLS finding
      if (sslResult && sslResult.hasIssues && assets.length > 0) {
        allFindings.push({
          id: uuid(), scanId: scan.id, assetId: assets[0].id, assetName: assets[0].name,
          title: `TLS Grade ${sslResult.grade} — Certificate/Protocol Issue Detected`,
          severity: ["F", "T", "M"].includes(sslResult.grade) ? "high" : "medium",
          description: `Qualys SSL Labs rated this host ${sslResult.grade}. This indicates weak cipher suites, expired certificates, or deprecated protocol versions.`,
          category: "Certificate", service: "https",
          cvss: ["F", "T", "M"].includes(sslResult.grade) ? 7.5 : 5.0, cve: null,
          remediation: "Update TLS configuration. Disable SSLv3, TLS 1.0/1.1. Renew expired certificates. See ssllabs.com for full report.",
          references: [`https://www.ssllabs.com/ssltest/analyze.html?d=${cleanHost(scan.target)}`],
          createdAt: new Date().toISOString(),
        } as any);
      }

      // Censys certificate finding (if certs differ from expected)
      if (censysResult && censysResult.certs.length > 0 && assets.length > 0) {
        assets[0].certificates = {
          ...assets[0].certificates,
          issuer: censysResult.certs[0] || assets[0].certificates?.issuer,
        };
      }

      const durationMin = Math.floor(Math.random() * 5) + 6;
      const durationSec = Math.floor(Math.random() * 60);

      const completedPatch: Partial<ScanJob> = {
        status: "completed",
        progress: 100,
        findings: allFindings.length,
        duration: `${durationMin}m ${durationSec}s`,
        phase: "Completed",
        assetsDiscovered: assets.length,
        _assets: assets,
        _findings: allFindings,
        completedAt: newLocalTimestamp(),
      };

      upsertScan(scan.id, completedPatch);

      tryFirestore(async () => {
        const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("../../firebase");
        await updateDoc(doc(db, "scans", scan.id), {
          status: "completed",
          progress: 100,
          findings: allFindings.length,
          duration: completedPatch.duration,
          phase: "Completed",
          assetsDiscovered: assets.length,
          _assets: assets,
          _findings: allFindings,
          completedAt: serverTimestamp(),
        });
      });

      tryFirestore(async () => {
        const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("../../firebase");
        const critCount = assets.filter(a => a.riskScore >= 75).length;
        await addDoc(collection(db, "alerts"), {
          type: critCount > 0 ? "critical" : "success",
          title: critCount > 0
            ? `${critCount} critical assets in scan of ${scan.target}`
            : `Scan complete: ${allFindings.length} findings on ${scan.target}`,
          asset: scan.target,
          timestamp: serverTimestamp(),
          read: false,
          createdBy: uid,
        });
      });
    } catch (err) {
      console.warn("Scan completion error:", err);
      completingRef.current.delete(scan.id);
      upsertScan(scan.id, { status: "failed", phase: "Failed" });
    }
  }

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

  const stats = useMemo(() => ({
    activeCount:    scans.filter(s => s.status === "running").length,
    queuedCount:    scans.filter(s => s.status === "queued").length,
    completedCount: scans.filter(s => s.status === "completed" || s.status === "failed").length,
    findings:       scans.reduce((sum, s) => sum + (s.findings || 0), 0),
    hasScans:       scans.length > 0,
    isRunning:      scans.some(s => s.status === "running"),
  }), [scans]);

  return (
    <ScanContext.Provider value={{
      scans, assets, findingsList, firestoreOk,
      createScan, deleteScan, pauseScan,
      ...stats,
    }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScanContext() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScanContext must be used inside a ScanProvider");
  return ctx;
}
