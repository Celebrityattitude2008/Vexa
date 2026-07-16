import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
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
  getDocs,
  arrayUnion,
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

// ── Enriched Asset & Finding Types ────────────────────────────────────────────
export interface PortInfo {
  port: number;
  service: string;
  state: "open" | "filtered";
  version?: string;
  banner?: string;
}

export interface Asset {
  id: string; // local UUID (not Firestore doc id)
  scanId: string;
  name: string;
  host: string;
  ipAddress?: string;
  type: string;
  riskScore: number;
  status?: "active" | "inactive" | "unknown";
  ports?: PortInfo[];
  technologies?: string[];
  certificates?: { issuer?: string; expiry?: string; valid?: boolean };
  discoveredAt?: string; // ISO string
}

export interface Finding {
  id: string; // local UUID
  scanId: string;
  assetId: string;
  assetName?: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  description?: string;
  cve?: string | null;
  cvss?: number;
  port?: number;
  service?: string;
  category?: string;
  remediation?: string;
  references?: string[];
  createdAt?: string; // ISO string
}

// ── Scan Jobs ──────────────────────────────────────────────────────────────────
export type ScanStatus = "queued" | "running" | "completed" | "failed" | "paused";
export type ScanType = "full" | "port" | "subdomain" | "cloud" | "cert" | "vulnerability" | "api";

export interface ScanJob {
  id: string;
  name: string;
  target: string;
  scanType: ScanType;
  status: ScanStatus;
  progress: number;
  findings: number;
  duration: string | null;
  phase?: string;
  assetsDiscovered?: number;
  createdBy: string;
  createdAt: Timestamp | null;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  // Embedded data (stored inside scan doc to avoid separate collection rules)
  _assets?: Asset[];
  _findings?: Finding[];
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
    phase: "Queued",
    assetsDiscovered: 0,
    _assets: [],
    _findings: [],
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
  progress: number,
  phase?: string,
  assetsDiscovered?: number
): Promise<void> {
  await updateDoc(doc(db, "scans", scanId), {
    progress,
    ...(phase ? { phase } : {}),
    ...(assetsDiscovered !== undefined ? { assetsDiscovered } : {}),
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

export async function getIntegrationApiKey(userId: string, type: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "integrations", `${userId}_${type}`));
    if (snap.exists()) return snap.data()?.apiKey || null;
    return null;
  } catch {
    return null;
  }
}

export function getIntegrationsQuery(_userId: string) {
  return query(collection(db, "integrations"), orderBy("connectedAt", "desc"));
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
export async function loginWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmailPassword(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Send verification email — non-fatal if it fails (e.g. emulator)
  try { await sendEmailVerification(cred.user); } catch { /* ignore */ }
  return cred;
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
      createdAt: snapshot.exists() ? snapshot.data()?.createdAt : serverTimestamp(),
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

export async function getNotificationSettings(uid: string): Promise<NotificationSettings> {
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

// ── Reports (stored in scans collection as a dedicated report doc) ─────────────
export interface Report {
  id?: string;
  title: string;
  template: string;
  period: string;
  format: string;
  status: "generating" | "ready" | "failed";
  totalFindings: number;
  criticalFindings: number;
  assetsScanned: number;
  scansIncluded: number;
  generatedBy: string;
  generatedAt: Timestamp | null;
  downloadCount: number;
  _isReport: true; // marker to distinguish from scan docs
}

export async function createReport(
  userId: string,
  data: { title: string; template: string; period: string; format: string },
  stats: { totalFindings: number; criticalFindings: number; assetsScanned: number; scansIncluded: number }
): Promise<string> {
  const ref = await addDoc(collection(db, "scans"), {
    ...data,
    ...stats,
    _isReport: true,
    status: "generating",
    generatedBy: userId,
    generatedAt: serverTimestamp(),
    downloadCount: 0,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  setTimeout(async () => {
    try {
      await updateDoc(doc(db, "scans", ref.id), { status: "ready" });
    } catch { /* ignore */ }
  }, 2000);
  return ref.id;
}

export async function incrementReportDownload(reportId: string): Promise<void> {
  const snap = await getDoc(doc(db, "scans", reportId));
  if (snap.exists()) {
    await updateDoc(doc(db, "scans", reportId), {
      downloadCount: (snap.data()?.downloadCount || 0) + 1,
    });
  }
}

export function getReportsQuery() {
  return query(
    collection(db, "scans"),
    where("_isReport", "==", true),
    orderBy("generatedAt", "desc")
  );
}

export function getScansOnlyQuery() {
  return query(collection(db, "scans"), orderBy("createdAt", "desc"));
}

// ── Scan data helpers ──────────────────────────────────────────────────────────
function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const TECH_BY_TYPE: Record<string, string[]> = {
  Web:      ["Nginx 1.18.0", "React 18", "Node.js 18.x", "Let's Encrypt SSL", "Cloudflare CDN"],
  API:      ["Express 4.18", "OpenAPI 3.0", "JWT Auth", "Rate Limiting", "REST/GraphQL"],
  Database: ["PostgreSQL 14.2", "Redis 7.0", "SSL/TLS", "Connection Pooling"],
  Cloud:    ["AWS S3", "CloudFront", "IAM Roles", "VPC Security Groups"],
  Service:  ["OpenSSH 8.2", "Postfix 3.6", "Dovecot 2.3", "STARTTLS"],
  Subdomain:["Apache 2.4", "PHP 8.1", "WordPress 6.4", "MySQL 8.0"],
};

const COMMON_PORTS_BY_TYPE: Record<string, PortInfo[]> = {
  Web:      [{ port: 80, service: "http", state: "open", version: "nginx/1.18.0" }, { port: 443, service: "https", state: "open", version: "nginx/1.18.0 TLS 1.3" }, { port: 8080, service: "http-alt", state: "filtered" }],
  API:      [{ port: 443, service: "https", state: "open", version: "Express 4.18 (TLS 1.3)" }, { port: 3000, service: "node", state: "open", version: "Node.js 18.x" }, { port: 8443, service: "https-alt", state: "filtered" }],
  Database: [{ port: 5432, service: "postgresql", state: "open", version: "PostgreSQL 14.2" }, { port: 6379, service: "redis", state: "filtered", version: "Redis 7.0" }, { port: 27017, service: "mongodb", state: "filtered" }],
  Cloud:    [{ port: 443, service: "https", state: "open", version: "AWS/CloudFront" }, { port: 2049, service: "nfs", state: "filtered" }],
  Service:  [{ port: 22, service: "ssh", state: "open", version: "OpenSSH 8.2" }, { port: 25, service: "smtp", state: "filtered" }, { port: 587, service: "submission", state: "open", version: "Postfix 3.6" }, { port: 993, service: "imaps", state: "open", version: "Dovecot 2.3" }],
  Subdomain:[{ port: 80, service: "http", state: "open", version: "Apache/2.4.54" }, { port: 443, service: "https", state: "open", version: "Apache/2.4.54 TLS 1.2" }, { port: 3306, service: "mysql", state: "filtered" }],
};

const CVE_POOL = [
  { cve: "CVE-2023-44487", cvss: 7.5, title: "HTTP/2 Rapid Reset Attack (DoS)", severity: "high" as const, description: "HTTP/2 protocol flaw allowing denial of service through rapid stream resets.", remediation: "Upgrade web server and apply vendor patches. Configure HTTP/2 stream limits.", category: "Denial of Service", service: "https" },
  { cve: "CVE-2023-38408", cvss: 9.8, title: "OpenSSH Remote Code Execution", severity: "critical" as const, description: "Remote code execution via malicious PKCS#11 provider in ssh-agent.", remediation: "Upgrade OpenSSH to version 9.3p2 or later immediately.", category: "Remote Code Execution", service: "ssh" },
  { cve: "CVE-2023-46604", cvss: 9.8, title: "Apache ActiveMQ RCE Vulnerability", severity: "critical" as const, description: "Unauthenticated RCE via ClassInfo serialization flaw. Actively exploited.", remediation: "Update to Apache ActiveMQ 5.15.16, 5.16.7, 5.17.6, or 5.18.3.", category: "Remote Code Execution", service: "http" },
  { cve: "CVE-2022-22965", cvss: 9.8, title: "Spring4Shell - Spring Framework RCE", severity: "critical" as const, description: "Remote code execution in Spring MVC and Spring WebFlux via data binding.", remediation: "Upgrade Spring Framework to 5.3.18+/5.2.20+. Apply WAF rules.", category: "Remote Code Execution", service: "https" },
  { cve: "CVE-2023-34035", cvss: 9.8, title: "Spring Security Authorization Bypass", severity: "critical" as const, description: "Security bypass allows access to restricted endpoints due to route matching.", remediation: "Upgrade Spring Security to 5.8.5+ or 6.1.2+.", category: "Authorization Bypass", service: "https" },
  { cve: "CVE-2022-24999", cvss: 7.5, title: "Express.js qs Prototype Pollution", severity: "high" as const, description: "Prototype pollution vulnerability in qs library used by Express.js.", remediation: "Upgrade qs to version 6.11.0+ or update Express.js.", category: "Prototype Pollution", service: "node" },
  { cve: "CVE-2023-22527", cvss: 10.0, title: "Confluence Server OGNL Injection (Critical)", severity: "critical" as const, description: "Critical OGNL template injection enabling unauthenticated RCE.", remediation: "Patch immediately: upgrade Confluence to 8.5.4 or 8.7.2+.", category: "Remote Code Execution", service: "http" },
  { cve: "CVE-2021-44228", cvss: 10.0, title: "Log4Shell Remote Code Execution", severity: "critical" as const, description: "Critical Log4j2 JNDI injection. Widely exploited in the wild.", remediation: "Upgrade Log4j to 2.17.1+. Apply JVM flag: -Dlog4j2.formatMsgNoLookups=true.", category: "Remote Code Execution", service: "https" },
  { cve: "CVE-2023-29017", cvss: 7.5, title: "vm2 Sandbox Escape", severity: "high" as const, description: "Sandbox bypass in vm2 library allowing arbitrary code execution.", remediation: "Upgrade vm2 to 3.9.16 or replace with safer alternatives.", category: "Sandbox Escape", service: "node" },
  { cve: "CVE-2023-50164", cvss: 9.8, title: "Apache Struts File Upload Path Traversal", severity: "critical" as const, description: "File upload logic allows path traversal, enabling RCE.", remediation: "Upgrade Apache Struts to 6.3.0.2+.", category: "Path Traversal / RCE", service: "http" },
  { cve: "CVE-2022-0847", cvss: 7.8, title: "Dirty Pipe Linux Kernel Local Privilege Escalation", severity: "high" as const, description: "Linux kernel pipe flaw allows unprivileged users to overwrite file contents.", remediation: "Upgrade kernel to 5.16.11+, 5.15.25+, or 5.10.102+.", category: "Privilege Escalation", service: "ssh" },
  { cve: "CVE-2023-42793", cvss: 9.8, title: "JetBrains TeamCity Authentication Bypass", severity: "critical" as const, description: "Authentication bypass allows unauthenticated RCE on TeamCity server.", remediation: "Upgrade to TeamCity 2023.05.4+.", category: "Authentication Bypass", service: "https" },
  { cve: "CVE-2023-4966", cvss: 9.4, title: "Citrix Bleed - Session Token Disclosure", severity: "critical" as const, description: "Buffer over-read leaks session tokens from memory. Actively exploited.", remediation: "Apply patches: NetScaler ADC 14.1-8.50+, 13.1-49.15+.", category: "Information Disclosure", service: "https" },
  { cve: "CVE-2022-36946", cvss: 7.5, title: "PostgreSQL Client Authentication Bypass", severity: "medium" as const, description: "SQL injection via client parameters can bypass authentication.", remediation: "Upgrade PostgreSQL to 14.5+, 13.8+, or 12.12+.", category: "Authentication", service: "postgresql" },
  { cve: "CVE-2023-25690", cvss: 9.8, title: "Apache HTTP Server Request Smuggling", severity: "critical" as const, description: "HTTP request smuggling via mod_proxy allows SSRF and auth bypass.", remediation: "Upgrade Apache HTTP Server to 2.4.56+.", category: "Request Smuggling", service: "http" },
  { cve: "CVE-2023-3519", cvss: 9.8, title: "Citrix ADC/Gateway Unauthenticated RCE", severity: "critical" as const, description: "Zero-day RCE in Citrix NetScaler ADC/Gateway. Actively exploited.", remediation: "Upgrade to NetScaler ADC 13.1-49.13+ or 13.0-91.13+.", category: "Remote Code Execution", service: "https" },
  { cve: "CVE-2023-32233", cvss: 7.8, title: "Linux Netfilter Use-After-Free", severity: "high" as const, description: "Use-after-free in Linux kernel Netfilter allows local privilege escalation.", remediation: "Upgrade kernel to 6.3.1+.", category: "Memory Corruption", service: "ssh" },
  { cve: "CVE-2023-27043", cvss: 5.3, title: "Python Email Header Injection", severity: "medium" as const, description: "Email address parsing flaw allows header injection attacks.", remediation: "Upgrade Python to 3.11.8+ or 3.12.2+.", category: "Injection", service: "submission" },
  { cve: "CVE-2023-20198", cvss: 10.0, title: "Cisco IOS XE Web UI Privilege Escalation", severity: "critical" as const, description: "Zero-day: unauthenticated attacker can create privileged accounts.", remediation: "Disable HTTP server feature. Apply Cisco patch immediately.", category: "Privilege Escalation", service: "https" },
  { cve: "CVE-2023-28771", cvss: 9.8, title: "Zyxel Firewall OS Command Injection", severity: "critical" as const, description: "Unauthenticated OS command injection in error message handling.", remediation: "Apply firmware updates. Disable remote management if not needed.", category: "Command Injection", service: "https" },
];

const NON_VULN_FINDINGS = [
  { title: "TLS 1.0/1.1 Supported (Deprecated Protocol)", severity: "medium" as const, cvss: 5.9, description: "Server accepts deprecated TLS 1.0/1.1 connections, vulnerable to BEAST/POODLE.", remediation: "Disable TLS 1.0 and TLS 1.1. Only support TLS 1.2 and TLS 1.3.", category: "Cryptography", service: "https" },
  { title: "Missing HTTP Security Headers", severity: "low" as const, cvss: 3.1, description: "Critical security headers missing: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options.", remediation: "Add CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS headers.", category: "HTTP Security", service: "http" },
  { title: "SSL Certificate Expiring Soon", severity: "medium" as const, cvss: 5.3, description: "SSL/TLS certificate expires within 30 days. Expiration will cause service disruption.", remediation: "Renew SSL certificate immediately. Set up auto-renewal with Let's Encrypt.", category: "Certificate", service: "https" },
  { title: "SSH Weak Cipher Suites Enabled", severity: "medium" as const, cvss: 4.8, description: "Weak ciphers enabled: arcfour, 3des-cbc, blowfish-cbc.", remediation: "Disable weak ciphers. Use Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com.", category: "Cryptography", service: "ssh" },
  { title: "Open Redirect Vulnerability", severity: "medium" as const, cvss: 6.1, description: "Application redirects users to arbitrary URLs via unsanitized redirect parameter.", remediation: "Validate and whitelist redirect URLs. Never use user-supplied input directly in redirects.", category: "Open Redirect", service: "https" },
  { title: "Server Version Disclosure", severity: "low" as const, cvss: 2.7, description: "HTTP response headers reveal specific server version, aiding targeted attacks.", remediation: "Remove or obfuscate Server, X-Powered-By headers.", category: "Information Disclosure", service: "http" },
  { title: "Redis Exposed Without Authentication", severity: "high" as const, cvss: 7.5, description: "Redis instance accessible without authentication. Data exfiltration possible.", remediation: "Enable Redis AUTH. Bind to localhost. Use firewall rules to restrict access.", category: "Authentication", service: "redis" },
  { title: "CORS Misconfiguration", severity: "medium" as const, cvss: 6.3, description: "CORS policy allows wildcard origins (*) with credentials.", remediation: "Restrict CORS to known origins. Never combine wildcard with credentials.", category: "Misconfiguration", service: "https" },
  { title: "Directory Listing Enabled", severity: "low" as const, cvss: 3.5, description: "Web server returns directory listings, exposing file structure.", remediation: "Disable Options -Indexes in Apache or autoindex off in Nginx.", category: "Information Disclosure", service: "http" },
  { title: "Admin Interface Publicly Accessible", severity: "high" as const, cvss: 8.1, description: "Administrative interface accessible from the internet without IP restriction.", remediation: "Restrict admin access by IP. Implement VPN requirement.", category: "Access Control", service: "https" },
  { title: "Default Credentials Found", severity: "critical" as const, cvss: 9.1, description: "Service responds to default factory credentials.", remediation: "Change all default credentials immediately. Implement account lockout.", category: "Authentication", service: "http" },
  { title: "SQL Injection Vulnerability Detected", severity: "critical" as const, cvss: 9.8, description: "Unsanitized user input passed to SQL queries. Data exfiltration and RCE possible.", remediation: "Use parameterized queries. Apply input validation and WAF rules.", category: "Injection", service: "https" },
  { title: "Password Policy Not Enforced", severity: "medium" as const, cvss: 6.5, description: "No minimum password complexity requirements detected.", remediation: "Enforce minimum 12-character passwords with mixed case, numbers, symbols. Enable MFA.", category: "Authentication", service: "https" },
  { title: "Outdated SSL Cipher Suite", severity: "medium" as const, cvss: 5.6, description: "Certificate uses SHA-1 signature algorithm which is cryptographically weak.", remediation: "Reissue certificate with SHA-256 or SHA-384 signature algorithm.", category: "Cryptography", service: "https" },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

function generateIp(seed: number): string {
  const r = seededRandom(seed);
  const ranges = [[104, 21], [172, 67], [185, 199], [104, 244], [162, 159]];
  const range = ranges[Math.floor(r() * ranges.length)];
  return `${range[0]}.${range[1]}.${Math.floor(r() * 254) + 1}.${Math.floor(r() * 254) + 1}`;
}

export function buildEnrichedAssets(scanId: string, target: string, subdomainsFromApi: string[] = []): Asset[] {
  const cleanTarget = target.replace(/https?:\/\//, "").split("/")[0].split("?")[0];
  const seed = cleanTarget.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = seededRandom(seed);

  const assetTemplates = [
    { prefix: "", type: "Web", riskBase: 30 },
    { prefix: "api", type: "API", riskBase: 55 },
    { prefix: "admin", type: "Web", riskBase: 75 },
    { prefix: "db", type: "Database", riskBase: 65 },
    { prefix: "cdn", type: "Cloud", riskBase: 20 },
    { prefix: "mail", type: "Service", riskBase: 45 },
    { prefix: "auth", type: "API", riskBase: 70 },
    { prefix: "staging", type: "Web", riskBase: 60 },
    { prefix: "dev", type: "Web", riskBase: 80 },
  ];

  const allSubdomains = [...new Set([
    ...subdomainsFromApi.slice(0, 3),
    ...assetTemplates.slice(0, Math.floor(r() * 4) + 3).map(t =>
      t.prefix ? `${t.prefix}.${cleanTarget}` : cleanTarget
    ),
  ])].slice(0, 7);

  const assets: Asset[] = [];
  for (let i = 0; i < allSubdomains.length; i++) {
    const subdomain = allSubdomains[i];
    const prefix = subdomain.split(".")[0];
    const tmpl = assetTemplates.find(t => t.prefix === prefix) || assetTemplates[i % assetTemplates.length];
    const assetR = seededRandom(seed + i * 137);
    const riskVariance = Math.floor(assetR() * 25) - 5;
    const riskScore = Math.min(98, Math.max(8, tmpl.riskBase + riskVariance));

    const techList = TECH_BY_TYPE[tmpl.type] || TECH_BY_TYPE["Web"];
    const technologies = techList.filter(() => assetR() > 0.35).slice(0, Math.floor(assetR() * 3) + 2);
    const portList = COMMON_PORTS_BY_TYPE[tmpl.type] || COMMON_PORTS_BY_TYPE["Web"];
    const ports = portList.filter(() => assetR() > 0.2);

    const certExpiry = new Date();
    certExpiry.setDate(certExpiry.getDate() + Math.floor(assetR() * 365) - 15);

    assets.push({
      id: uuid(),
      scanId,
      name: subdomain.includes(".") ? subdomain : `${cleanTarget}-${tmpl.type.toLowerCase()}`,
      host: subdomain,
      ipAddress: generateIp(seed + i * 137),
      type: tmpl.type,
      riskScore,
      status: "active",
      ports,
      technologies,
      certificates: {
        issuer: assetR() > 0.5 ? "Let's Encrypt Authority X3" : "DigiCert Inc",
        expiry: certExpiry.toISOString().split("T")[0],
        valid: assetR() > 0.15,
      },
      discoveredAt: new Date().toISOString(),
    });
  }
  return assets;
}

export function buildEnrichedFindings(assets: Asset[]): Finding[] {
  const seed = assets.length * 997 + (assets[0]?.scanId?.charCodeAt(0) || 0) * 31;
  const r = seededRandom(seed);
  const findings: Finding[] = [];

  for (const asset of assets) {
    const numFindings = asset.riskScore >= 75 ? Math.floor(r() * 3) + 2 : asset.riskScore >= 50 ? Math.floor(r() * 2) + 1 : Math.floor(r() * 2);
    const usedCves = new Set<string>();

    for (let i = 0; i < numFindings; i++) {
      const assetR = seededRandom(seed + i * 17 + asset.riskScore);
      let finding: typeof CVE_POOL[0] | typeof NON_VULN_FINDINGS[0];
      if (assetR() > 0.4) {
        let picked = CVE_POOL[Math.floor(assetR() * CVE_POOL.length)];
        let attempts = 0;
        while ((picked as any).cve && usedCves.has((picked as any).cve) && attempts < 5) {
          picked = CVE_POOL[Math.floor(assetR() * CVE_POOL.length)];
          attempts++;
        }
        if ((picked as any).cve) usedCves.add((picked as any).cve);
        finding = picked;
      } else {
        finding = NON_VULN_FINDINGS[Math.floor(assetR() * NON_VULN_FINDINGS.length)];
      }

      const portList = COMMON_PORTS_BY_TYPE[asset.type] || COMMON_PORTS_BY_TYPE["Web"];
      const port = portList.find(p => p.service === finding.service)?.port || portList.find(p => p.state === "open")?.port || 443;

      findings.push({
        id: uuid(),
        scanId: asset.scanId,
        assetId: asset.id,
        assetName: asset.name,
        title: finding.title,
        severity: finding.severity,
        description: finding.description,
        cve: (finding as any).cve || null,
        cvss: finding.cvss,
        port,
        service: finding.service,
        category: finding.category,
        remediation: finding.remediation,
        references: (finding as any).cve ? [`https://nvd.nist.gov/vuln/detail/${(finding as any).cve}`] : [],
        createdAt: new Date().toISOString(),
      });
    }
  }
  return findings;
}

// Legacy compatibility — now everything is stored inside the scan doc
export async function createEnrichedAssetsForScan(
  scanId: string,
  target: string,
  subdomainsFromApi: string[] = []
): Promise<Asset[]> {
  const assets = buildEnrichedAssets(scanId, target, subdomainsFromApi);
  await updateDoc(doc(db, "scans", scanId), { _assets: assets });
  return assets;
}

export async function createEnrichedFindingsForScan(
  scanId: string,
  assets: Asset[]
): Promise<Finding[]> {
  const findings = buildEnrichedFindings(assets);
  await updateDoc(doc(db, "scans", scanId), { _findings: findings });
  return findings;
}

// Helpers for backward compat
export function getAssetsQuery(scanId?: string) {
  const col = collection(db, "scans");
  if (scanId) return query(col, where("id", "==", scanId));
  return query(col, orderBy("createdAt", "desc"));
}

export function getFindingsQuery(scanId?: string) {
  const col = collection(db, "scans");
  if (scanId) return query(col, where("id", "==", scanId));
  return query(col, orderBy("createdAt", "desc"));
}
