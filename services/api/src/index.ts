import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { tradingRouter } from "./routes/trading.js";
import { marketDataRouter } from "./routes/market-data.js";
import { marketRouter } from "./routes/market.js";
import { iamRouter } from "./routes/iam.js";
import { authMiddleware } from "./middleware/auth.js";
import { externalRouter } from "./routes/external.js";
import { totpRouter } from "./routes/totp.js";
import { contactRouter } from "./routes/contact.js";
import { payrollRouter } from "./routes/payroll.js";
import { invoiceRouter } from "./routes/invoices.js";
import { apiKeysRouter } from "./routes/api-keys.js";
import { cmsRouter } from "./routes/cms.js";
import { parcelsRouter } from "./routes/parcels.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { jobsRouter } from "./routes/jobs.js";
import { customerAuthRouter } from "./routes/customer-auth.js";
import { paymentsRouter } from "./routes/payments.js";
import { agreementsRouter } from "./routes/agreements.js";
import { customerJobsRouter } from "./routes/customer-jobs.js";
import { supportRouter } from "./routes/support.js";
import { estimatesRouter } from "./routes/estimates.js";
import { mediaRouter } from "./routes/media.js";
import { runMigrations } from "./lib/migrate.js";

const app = express();
const port = parseInt(process.env.PORT || "8080", 10);

app.use(helmet());
app.use(cors());

// Stripe webhook needs raw body — must come before express.json()
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.get("/", (_req, res) => {
  if (_req.headers.accept?.includes("text/html")) {
    res.set("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sunrise Construction API</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #0f1923; color: #c9d6e3; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .container { max-width: 640px; width: 100%; padding: 3rem 2rem; }
  h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
  h1 .sun { color: #f97316; }
  h1 .con { color: white; }
  .subtitle { color: #627d98; font-size: 0.9rem; margin-bottom: 2.5rem; }
  .section { margin-bottom: 2rem; }
  .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #627d98; font-weight: 600; margin-bottom: 0.6rem; }
  .install-box { background: #1a2736; border: 1px solid #2d3f52; border-radius: 10px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; transition: border-color 0.2s; position: relative; }
  .install-box:hover { border-color: #f97316; }
  .install-box code { flex: 1; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .install-box .tag { font-size: 0.6rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; flex-shrink: 0; }
  .win { background: rgba(59,130,246,0.15); color: #60a5fa; }
  .unix { background: rgba(16,185,129,0.15); color: #34d399; }
  .copy-btn { background: none; border: 1px solid #3d5068; color: #9fb3c8; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.65rem; cursor: pointer; flex-shrink: 0; }
  .copy-btn:hover { border-color: #f97316; color: #f97316; }
  .copied { color: #34d399 !important; border-color: #34d399 !important; }
  .links { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }
  .links a { color: #f97316; font-size: 0.8rem; text-decoration: none; font-weight: 500; }
  .links a:hover { text-decoration: underline; }
  .footer { margin-top: 3rem; color: #3d5068; font-size: 0.7rem; }
  .footer a { color: #627d98; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <h1><span class="sun">Sunrise</span> <span class="con">Construction</span></h1>
  <p class="subtitle">Platform API &amp; CLI Tools</p>

  <div class="section">
    <div class="label">Install — Windows (PowerShell)</div>
    <div class="install-box" onclick="copyCmd(this, 'irm https://pkg.sunriseobx.co/install.ps1 | iex')">
      <span class="tag win">PS</span>
      <code>irm https://pkg.sunriseobx.co/install.ps1 | iex</code>
      <button class="copy-btn">Copy</button>
    </div>
  </div>

  <div class="section">
    <div class="label">Install — macOS / Linux</div>
    <div class="install-box" onclick="copyCmd(this, 'curl -fsSL https://pkg.sunriseobx.co/install.sh | bash')">
      <span class="tag unix">SH</span>
      <code>curl -fsSL https://pkg.sunriseobx.co/install.sh | bash</code>
      <button class="copy-btn">Copy</button>
    </div>
  </div>

  <div class="section">
    <div class="label">Then</div>
    <div class="install-box" onclick="copyCmd(this, 'sunrise-cli auth login')">
      <code>sunrise-cli auth login</code>
      <button class="copy-btn">Copy</button>
    </div>
  </div>

  <div class="links">
    <a href="https://sunriseobx.co">Website</a>
    <a href="https://sunriseobx.co/desk">Admin Dashboard</a>
    <a href="https://cdn.sunriseobx.co/img/">CDN Browser</a>
    <a href="https://pkg.sunriseobx.co">Packages</a>
  </div>

  <div class="footer">
    <a href="https://sunriseobx.co">Sunrise Construction Services LLC</a> — Point Harbor, NC
  </div>
</div>
<script>
function copyCmd(el, text) {
  navigator.clipboard.writeText(text);
  const btn = el.querySelector('.copy-btn');
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
}
</script>
</body>
</html>`);
    return;
  }
  res.json({ name: "Sunrise Construction API", version: "1.0.0", docs: "https://api.sunriseobx.co" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/ready", (_req, res) => {
  res.json({ status: "ready" });
});

// Auth routes (login, logout, 2FA, verify)
app.use("/auth", authRouter);

// Public contact form (no auth)
app.use("/api", contactRouter);

// Public CMS routes (published posts/projects)
app.use("/api/cms", cmsRouter);

// Agreement routes (templates require auth inside, onboard is public)
app.use("/api/agreements", agreementsRouter);

// Customer auth routes (public — OTP, verify, profile)
app.use("/customer/auth", customerAuthRouter);

// Customer job portal routes
app.use("/customer/jobs", customerJobsRouter);

// Invoice & estimate routes (public endpoints must be before auth-protected /api mounts)
app.use("/api/invoices", invoiceRouter);
app.use("/api/estimates", estimatesRouter);

// Payment routes (Stripe) — public invoice pay + webhook must come before auth /api mounts
app.use("/api", paymentsRouter);
app.use("/", paymentsRouter);

// IAM routes — auth + manage_users enforced inside iamRouter
app.use("/api/iam", iamRouter);

// Trading routes (RBAC applied per-route inside the router)
app.use("/api", authMiddleware, tradingRouter);

// Market data & market routes
app.use("/api", authMiddleware, marketDataRouter);
app.use("/api", authMiddleware, marketRouter);

// External data routes (FRED, Finnhub, Alpha Vantage)
app.use("/api", authMiddleware, externalRouter);

// TOTP routes
app.use("/api/totp", authMiddleware, totpRouter);

// API keys routes
app.use("/api/keys", authMiddleware, apiKeysRouter);

// Payroll routes
app.use("/api/payroll", payrollRouter);

// Media management (CDN assets)
app.use("/api/media", mediaRouter);

// Dare County GIS parcel routes
app.use("/api/parcels", parcelsRouter);

// Campaign management routes
app.use("/api/campaigns", campaignsRouter);

// Job management routes (auth + RBAC enforced inside router)
app.use("/api/jobs", jobsRouter);

// Support ticket routes (customer + admin)
app.use("/", supportRouter);


async function main() {
  await runMigrations();
  app.listen(port, () => {
    console.log(`sunriseobx-api listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
