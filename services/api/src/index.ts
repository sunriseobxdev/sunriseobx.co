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
import { runMigrations } from "./lib/migrate.js";

const app = express();
const port = parseInt(process.env.PORT || "8080", 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

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

// Invoice routes
app.use("/api/invoices", invoiceRouter);

// Dare County GIS parcel routes
app.use("/api/parcels", parcelsRouter);

// Campaign management routes
app.use("/api/campaigns", campaignsRouter);

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
