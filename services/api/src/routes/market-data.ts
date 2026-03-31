import { Router } from "express";
import { getAlpacaClient } from "../lib/alpaca.js";

export const marketDataRouter = Router();

marketDataRouter.get("/bars/:symbol", async (req, res) => {
  try {
    const { timeframe, start, end, limit } = req.query as {
      timeframe?: string;
      start?: string;
      end?: string;
      limit?: string;
    };

    if (!timeframe) {
      res.status(400).json({ error: "timeframe query parameter is required" });
      return;
    }

    const bars = await getAlpacaClient().getBars(req.params.symbol as string, timeframe, {
      start,
      end,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    res.json(bars);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

marketDataRouter.get("/trades/:symbol/latest", async (req, res) => {
  try {
    const trade = await getAlpacaClient().getLatestTrade(req.params.symbol as string);
    res.json(trade);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

marketDataRouter.get("/trades/:symbol", async (req, res) => {
  try {
    const opts = req.query as {
      start?: string;
      end?: string;
      limit?: string;
    };
    const trades = await getAlpacaClient().getTrades(req.params.symbol as string, {
      start: opts.start,
      end: opts.end,
      limit: opts.limit ? parseInt(opts.limit, 10) : undefined,
    });
    res.json(trades);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

marketDataRouter.get("/quotes/:symbol/latest", async (req, res) => {
  try {
    const quote = await getAlpacaClient().getLatestQuote(req.params.symbol as string);
    res.json(quote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

marketDataRouter.get("/quotes/:symbol", async (req, res) => {
  try {
    const opts = req.query as {
      start?: string;
      end?: string;
      limit?: string;
    };
    const quotes = await getAlpacaClient().getQuotes(req.params.symbol as string, {
      start: opts.start,
      end: opts.end,
      limit: opts.limit ? parseInt(opts.limit, 10) : undefined,
    });
    res.json(quotes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

marketDataRouter.get("/snapshot/:symbol", async (req, res) => {
  try {
    const snapshot = await getAlpacaClient().getSnapshot(req.params.symbol as string);
    res.json(snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

marketDataRouter.get("/snapshots", async (req, res) => {
  try {
    const symbols = req.query.symbols as string;
    if (!symbols) {
      res.status(400).json({ error: "symbols query parameter is required" });
      return;
    }
    const snapshots = await getAlpacaClient().getSnapshots(symbols);
    res.json(snapshots);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});
