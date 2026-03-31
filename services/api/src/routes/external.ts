import { Router } from "express";
import { cached } from "../lib/cache.js";
import * as fred from "../lib/fred.js";
import * as finnhub from "../lib/finnhub.js";
import * as alphavantage from "../lib/alphavantage.js";

export const externalRouter = Router();

// FRED Macro indicators (1h cache)
externalRouter.get("/external/macro", async (_req, res) => {
  try {
    const data = await cached("fred:macro", 3600, () =>
      fred.getMacroSummary()
    );
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// FRED specific series (1h cache)
externalRouter.get("/external/macro/:series", async (req, res) => {
  const series = req.params.series as string;
  try {
    const data = await cached(`fred:${series}`, 3600, () =>
      fred.getSeriesObservations(series, 30)
    );
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// Finnhub company news (5 min cache)
externalRouter.get("/external/news/:symbol", async (req, res) => {
  const symbol = (req.params.symbol as string).toUpperCase();
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  try {
    const data = await cached(`finnhub:news:${symbol}`, 300, () =>
      finnhub.getCompanyNews(symbol, from, to)
    );
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// Finnhub earnings calendar (6h cache)
externalRouter.get("/external/earnings", async (_req, res) => {
  const from = new Date().toISOString().split("T")[0];
  const to = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  try {
    const data = await cached("finnhub:earnings", 21600, () =>
      finnhub.getEarningsCalendar(from, to)
    );
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// Finnhub insider transactions (1h cache)
externalRouter.get("/external/insiders/:symbol", async (req, res) => {
  const symbol = (req.params.symbol as string).toUpperCase();
  try {
    const data = await cached(`finnhub:insiders:${symbol}`, 3600, () =>
      finnhub.getInsiderTransactions(symbol)
    );
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// Alpha Vantage company fundamentals (24h cache)
externalRouter.get("/external/fundamentals/:symbol", async (req, res) => {
  const symbol = (req.params.symbol as string).toUpperCase();
  try {
    const [overview, income] = await Promise.all([
      cached(`av:overview:${symbol}`, 86400, () =>
        alphavantage.getCompanyOverview(symbol)
      ),
      cached(`av:income:${symbol}`, 86400, () =>
        alphavantage.getIncomeStatement(symbol)
      ),
    ]);
    res.json({ overview, income });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});
