import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  where,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const SHODAN_API_KEY = import.meta.env.VITE_SHODAN_API_KEY || "";
export const CENSYS_API_KEY = import.meta.env.VITE_CENSYS_API_KEY || "";
export const QUALYSYS_API_KEY = import.meta.env.VITE_QUALYSYS_API_KEY || "";
export const VIRUSTOTAL_API_KEY = import.meta.env.VITE_VIRUSTOTAL_API_KEY || "";

export type UserRole = "Administrator" | "Security Analyst" | "Viewer" | string;

export interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt?: DocumentData;
  updatedAt?: DocumentData;
}

export interface NotificationSettings {
  criticalRiskAlerts: boolean;
  newAssets: boolean;
  weeklyDigest: boolean;
}

export const defaultNotificationSettings: NotificationSettings = {
  criticalRiskAlerts: true,
  newAssets: true,
  weeklyDigest: false,
};

// ── Scan Jobs ──────────────────────────────────────────────────────────────────

export type ScanStatus = "queued" | "running" | "completed" | "failed" | "paused";
export type ScanType =
  | "full"
  | "port"
  | "subdomain"
  | "cloud"
  | "cert"
  | "vulnerability"
  | "api";

export interface ScanJob {
  id: string;
  name: string;
  target: string;
  scanType: ScanType;
  status: ScanStatus;
  progress: number;
  findings: number;
  duration: string | null;
  createdBy: string;
  createdAt: Timestamp | null;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
}

export async function createScanJob(
  userId: string,
  data: { name: string; target: string; scanType: string }
): Promise<string> {
  const ref = await addDoc(collection(db, "scans"), {
    name: data.name,
    target: data.target,
    scanType: data.scanType,
    status: "queued" as ScanStatus,
    progress: 0,
    findings: 0,
    duration: null,
    createdBy: userId,
    createdAt: serverTimestamp(),
    startedAt: null,
    completedAt: null,
  });
  return ref.id;
}

export async function updateScanStatus(
  scanId: string,
  status: ScanStatus,
  extra?: Partial<Omit<ScanJob, "id" | "createdBy" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "scans", scanId), {
    status,
    ...extra,
    ...(status === "running" ? { startedAt: serverTimestamp() } : {}),
    ...(status === "completed" || status === "failed"
      ? { completedAt: serverTimestamp() }
      : {}),
  });
}

export async function updateScanProgress(
  scanId: string,
  progress: number
): Promise<void> {
  await updateDoc(doc(db, "scans", scanId), {
    progress,
  });
}

export function getScansQuery() {
  return query(collection(db, "scans"), orderBy("createdAt", "desc"));
}

// ── Integrations ───────────────────────────────────────────────────────────────

export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface Integration {
  id: string;
  name: string;
  type: string;
  webhookUrl?: string;
  apiKey?: string;
  status: IntegrationStatus;
  connectedAt: Timestamp | null;
  connectedBy: string;
}

export async function saveIntegration(
  userId: string,
  name: string,
  type: string,
  data: { webhookUrl?: string; apiKey?: string }
): Promise<string> {
  const existing = doc(db, "integrations", `${userId}_${type}`);
  await setDoc(
    existing,
    {
      name,
      type,
      ...data,
      status: "connected" as IntegrationStatus,
      connectedAt: serverTimestamp(),
      connectedBy: userId,
    },
    { merge: true }
  );
  return existing.id;
}

export function getIntegrationsQuery(userId: string) {
  return query(
    collection(db, "integrations"),
    orderBy("connectedAt", "desc")
  );
}

// ── Auth helpers ───────────────────────────────────────────────────────────────

export async function loginWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmailPassword(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithGithub() {
  const provider = new GithubAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logoutFirebase() {
  return firebaseSignOut(auth);
}

export async function getIdToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken();
}

export async function createOrUpdateUserProfile(
  user: FirebaseUser,
  defaultRole: UserRole = "Viewer"
): Promise<FirestoreUser> {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const storedRole = snapshot.exists()
    ? (snapshot.data()?.role as UserRole)
    : defaultRole;
  const profile: FirestoreUser = {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    role: storedRole,
    updatedAt: serverTimestamp(),
  };

  await setDoc(
    userRef,
    {
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      updatedAt: profile.updatedAt,
      createdAt: snapshot.exists()
        ? snapshot.data()?.createdAt
        : serverTimestamp(),
    },
    { merge: true }
  );

  return profile;
}

export async function getUserProfile(uid: string): Promise<FirestoreUser | null> {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return {
    uid,
    email: snapshot.data()?.email ?? null,
    displayName: snapshot.data()?.displayName ?? null,
    role: snapshot.data()?.role ?? "Viewer",
    createdAt: snapshot.data()?.createdAt,
    updatedAt: snapshot.data()?.updatedAt,
  };
}

export async function getNotificationSettings(
  uid: string
): Promise<NotificationSettings> {
  const snapshot = await getDoc(doc(db, "notificationSettings", uid));
  if (!snapshot.exists()) return defaultNotificationSettings;
  const data = snapshot.data();
  return {
    criticalRiskAlerts: Boolean(data?.criticalRiskAlerts ?? true),
    newAssets: Boolean(data?.newAssets ?? true),
    weeklyDigest: Boolean(data?.weeklyDigest ?? false),
  };
}

export async function saveNotificationSettings(
  uid: string,
  settings: NotificationSettings
): Promise<NotificationSettings> {
  await setDoc(
    doc(db, "notificationSettings", uid),
    { ...settings, updatedAt: serverTimestamp() },
    { merge: true }
  );
  return settings;
}

export async function seedAlert(
  type: "critical" | "warning" | "success" | "info",
  title: string,
  asset: string
): Promise<void> {
  await addDoc(collection(db, "alerts"), {
    type,
    title,
    asset,
    timestamp: serverTimestamp(),
    read: false,
  });
}

export { onAuthStateChanged } from "firebase/auth";

// ── Simulated assets & findings helpers ──────────────────────────────────────
export interface Asset {
  id?: string;
  scanId: string;
  name: string;
  host: string;
  type: string;
  riskScore: number;
  discoveredAt: Timestamp | null;
}

export interface Finding {
  id?: string;
  scanId: string;
  assetId: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  description?: string;
  createdAt: Timestamp | null;
}

export async function createSimulatedAssetsForScan(scanId: string, target: string, count = 3): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const name = `${target.replace(/https?:\/\//, "").split(/\.|:/)[0]}-asset-${i + 1}`;
    const type = ["API", "Web", "Database", "Cloud"][Math.floor(Math.random() * 4)];
    const riskScore = Math.floor(Math.random() * 80) + 10;
    const ref = await addDoc(collection(db, "assets"), {
      scanId,
      name,
      host: target,
      type,
      riskScore,
      discoveredAt: serverTimestamp(),
    });
    ids.push(ref.id);
  }
  return ids;
}

export async function createSimulatedFindingsForScan(scanId: string, assetIds: string[]): Promise<void> {
  const severities: Finding["severity"][] = ["low", "medium", "high", "critical"];
  for (const assetId of assetIds) {
    const items = Math.floor(Math.random() * 3); // 0-2 findings per asset
    for (let i = 0; i < items; i++) {
      const sev = severities[Math.floor(Math.random() * severities.length)];
      await addDoc(collection(db, "findings"), {
        scanId,
        assetId,
        title: `Simulated ${sev} finding for ${assetId}`,
        severity: sev,
        description: `Automatically generated finding from simulated scan ${scanId}`,
        createdAt: serverTimestamp(),
      });
    }
  }
}

export function getAssetsQuery(scanId?: string) {
  const col = collection(db, "assets");
  if (scanId) return query(col, where("scanId", "==", scanId), orderBy("discoveredAt", "desc"));
  return query(col, orderBy("discoveredAt", "desc"));
}

export function getFindingsQuery(scanId?: string) {
  const col = collection(db, "findings");
  if (scanId) return query(col, where("scanId", "==", scanId), orderBy("createdAt", "desc"));
  return query(col, orderBy("createdAt", "desc"));
}
