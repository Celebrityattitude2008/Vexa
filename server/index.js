import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

// Keys come from env vars (set as VITE_ because user added them that way;
// Node.js process.env sees all env vars regardless of prefix)
const SHODAN_KEY  = process.env.VITE_SHODAN_API_KEY;
const CENSYS_KEY  = process.env.VITE_CENSYS_API_KEY;
const QUALYS_KEY  = process.env.VITE_QUALYSYS_API_KEY;
const VT_KEY      = process.env.VITE_VIRUSTOTAL_API_KEY;

// COOP header: allows Google/GitHub OAuth popups to post back to the opener
app.use((_req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});
app.use(cors({ origin: true }));
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    services: {
      shodan:     !!SHODAN_KEY,
      censys:     !!CENSYS_KEY,
      qualys:     !!QUALYS_KEY,
      virustotal: !!VT_KEY,
    },
  });
});

// ── Shodan: domain / subdomain / port intel ──────────────────────────────────
// GET /api/shodan/domain/:domain
app.get("/api/shodan/domain/:domain", async (req, res) => {
  if (!SHODAN_KEY) return res.status(503).json({ error: "Shodan key not configured" });
  try {
    const domain = req.params.domain;
    const upstream = await fetch(
      `https://api.shodan.io/dns/domain/${encodeURIComponent(domain)}?key=${SHODAN_KEY}`,
      { signal: AbortSignal.timeout(12000) }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Shodan request failed", details: err.message });
  }
});

// GET /api/shodan/host/:ip  – per-IP port & vuln data
app.get("/api/shodan/host/:ip", async (req, res) => {
  if (!SHODAN_KEY) return res.status(503).json({ error: "Shodan key not configured" });
  try {
    const upstream = await fetch(
      `https://api.shodan.io/shodan/host/${encodeURIComponent(req.params.ip)}?key=${SHODAN_KEY}`,
      { signal: AbortSignal.timeout(12000) }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Shodan host request failed", details: err.message });
  }
});

// ── Censys: certificate & host search ────────────────────────────────────────
// GET /api/censys/certs?q=example.com
app.get("/api/censys/certs", async (req, res) => {
  if (!CENSYS_KEY) return res.status(503).json({ error: "Censys key not configured" });
  try {
    const q = String(req.query.q || "");
    // Key format: "censys_{id}_{secret}" → split after first underscore after "censys_"
    // or plain Base64-able token. Attempt Basic auth with the raw key as id, empty secret.
    const rawKey = CENSYS_KEY.replace(/^censys_/, "");
    const authHeader = `Basic ${Buffer.from(`${rawKey}:`).toString("base64")}`;

    const upstream = await fetch(
      `https://search.censys.io/api/v2/certificates?q=${encodeURIComponent(q)}&per_page=5`,
      {
        headers: { Authorization: authHeader, Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Censys request failed", details: err.message });
  }
});

// ── VirusTotal: domain reputation ─────────────────────────────────────────────
// GET /api/virustotal/domain/:domain
app.get("/api/virustotal/domain/:domain", async (req, res) => {
  if (!VT_KEY) return res.status(503).json({ error: "VirusTotal key not configured" });
  try {
    const upstream = await fetch(
      `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(req.params.domain)}`,
      {
        headers: { "x-apikey": VT_KEY },
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "VirusTotal request failed", details: err.message });
  }
});

// ── SSL Labs (Qualys): TLS grade ──────────────────────────────────────────────
// GET /api/ssllabs/analyze?host=example.com
app.get("/api/ssllabs/analyze", async (req, res) => {
  try {
    const host = String(req.query.host || "");
    const headers = { Accept: "application/json" };
    if (QUALYS_KEY) headers["X-API-Key"] = QUALYS_KEY;
    const upstream = await fetch(
      `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(host)}&fromCache=on&all=done&ignoreMismatch=on`,
      { headers, signal: AbortSignal.timeout(15000) }
    );
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "SSL Labs request failed", details: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Vigil proxy server ready on port ${PORT}`);
  console.log(`  Shodan:     ${SHODAN_KEY  ? "✓" : "✗ (key missing)"}`);
  console.log(`  Censys:     ${CENSYS_KEY  ? "✓" : "✗ (key missing)"}`);
  console.log(`  Qualys:     ${QUALYS_KEY  ? "✓" : "✗ (key missing)"}`);
  console.log(`  VirusTotal: ${VT_KEY      ? "✓" : "✗ (key missing)"}`);
});
