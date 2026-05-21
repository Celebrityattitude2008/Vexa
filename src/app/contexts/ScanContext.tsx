import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { onSnapshot } from "firebase/firestore";
import {
  getScansQuery,
  updateScanProgress,
  updateScanStatus,
  getAssetsQuery,
  getFindingsQuery,
  createSimulatedAssetsForScan,
  createSimulatedFindingsForScan,
  type ScanJob,
} from "../../firebase";

interface ScanContextValue {
  scans: ScanJob[];
  assets: any[];
  findingsList: any[];
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
  const [assets, setAssets] = useState<any[]>([]);
  const [findingsList, setFindingsList] = useState<any[]>([]);
  const [firestoreOk, setFirestoreOk] = useState(true);
  const scansRef = useRef<ScanJob[]>([]);

  useEffect(() => {
    const unsubScans = onSnapshot(
      getScansQuery(),
      (snapshot) => {
        const currentScans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ScanJob));
        scansRef.current = currentScans;
        setScans(currentScans);
        setFirestoreOk(true);
      },
      (err) => {
        console.warn("Scan listener error:", err.message);
        setFirestoreOk(false);
      }
    );

    const unsubAssets = onSnapshot(getAssetsQuery(), (snap) => {
      setAssets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubFindings = onSnapshot(getFindingsQuery(), (snap) => {
      setFindingsList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubScans();
      unsubAssets();
      unsubFindings();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const currentScans = scansRef.current;
        const runningScan = currentScans.find((scan) => scan.status === "running");

        if (!runningScan) {
          const nextQueued = [...currentScans]
            .reverse()
            .find((scan) => scan.status === "queued");

          if (nextQueued) {
            await updateScanStatus(nextQueued.id, "running", { progress: 0 });
          }
          return;
        }

        const nextProgress = Math.min(
          100,
          runningScan.progress + Math.floor(Math.random() * 20) + 10
        );

        if (nextProgress >= 100) {
          const findings = Math.floor(Math.random() * 6) + 1;
          const duration = `${Math.floor(Math.random() * 15) + 10}s`;
          await updateScanStatus(runningScan.id, "completed", {
            progress: 100,
            findings,
            duration,
          });

          // Generate simulated assets and findings for the completed scan
          try {
            const assetIds = await createSimulatedAssetsForScan(runningScan.id, runningScan.target, Math.floor(Math.random() * 4) + 1);
            await createSimulatedFindingsForScan(runningScan.id, assetIds);
          } catch (e) {
            console.warn("Failed to create simulated assets/findings:", e);
          }

          return;
        }

        await updateScanProgress(runningScan.id, nextProgress);
      } catch (err) {
        console.warn("Scan queue processor error:", err);
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const stats = useMemo(
    () => ({
      activeCount: scans.filter((s) => s.status === "running").length,
      queuedCount: scans.filter((s) => s.status === "queued").length,
      completedCount: scans.filter((s) => s.status === "completed" || s.status === "failed").length,
      findings: scans.reduce((sum, s) => sum + (s.findings || 0), 0),
      hasScans: scans.length > 0,
      isRunning: scans.some((s) => s.status === "running"),
    }),
    [scans]
  );

  return (
    <ScanContext.Provider value={{ scans, assets, findingsList, firestoreOk, ...stats }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScanContext() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error("useScanContext must be used inside a ScanProvider");
  }
  return context;
}
