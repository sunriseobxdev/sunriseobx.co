import { Router } from "express";
import { getAlpacaClient } from "../lib/alpaca.js";
import {
  tickers,
  tickerMap,
  sectorMap,
  type TickerInfo,
} from "../data/tickers.js";

export const marketRouter = Router();

// Curated list of liquid mega/large-cap symbols for movers & overview endpoints.
// Kept under 50 to stay within Alpaca snapshot rate limits per call.
const MAJOR_SYMBOLS: string[] = tickers
  .filter((t) => t.marketCap === "mega" || t.marketCap === "large")
  .map((t) => t.symbol)
  .slice(0, 50);

const INDEX_ETFS = ["SPY", "QQQ", "DIA", "IWM"];

// ── Helpers ──

interface MoverEntry {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface IndexEntry {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface SectorPerf {
  sector: string;
  avgChangePercent: number;
  tickerCount: number;
}

function calcChangePercent(snapshot: {
  dailyBar: { o: number; c: number } | null;
  prevDailyBar: { c: number } | null;
}): number | null {
  const daily = snapshot.dailyBar;
  const prev = snapshot.prevDailyBar;
  if (!daily) return null;
  if (prev && prev.c !== 0) {
    return ((daily.c - prev.c) / prev.c) * 100;
  }
  if (daily.o !== 0) {
    return ((daily.c - daily.o) / daily.o) * 100;
  }
  return null;
}

// ── GET /market/tickers ──

marketRouter.get("/market/tickers", (req, res) => {
  try {
    let results: TickerInfo[] = tickers;

    const sector = req.query.sector as string | undefined;
    if (sector) {
      results = results.filter(
        (t) => t.sector.toLowerCase() === sector.toLowerCase()
      );
    }

    const q = req.query.q as string | undefined;
    if (q) {
      const lower = q.toLowerCase();
      results = results.filter(
        (t) =>
          t.symbol.toLowerCase().includes(lower) ||
          t.name.toLowerCase().includes(lower)
      );
    }

    const tagsParam = req.query.tags as string | undefined;
    if (tagsParam) {
      const queryTags = tagsParam
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
      if (queryTags.length > 0) {
        results = results.filter((t) =>
          t.tags.some((tag) => queryTags.includes(tag.toLowerCase()))
        );
      }
    }

    const marketCap = req.query.marketCap as string | undefined;
    if (marketCap) {
      results = results.filter(
        (t) => t.marketCap.toLowerCase() === marketCap.toLowerCase()
      );
    }

    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// ── GET /market/tickers/:symbol ──

marketRouter.get("/market/tickers/:symbol", async (req, res) => {
  try {
    const symbol = (req.params.symbol as string).toUpperCase();
    const info = tickerMap.get(symbol);

    let snapshot = null;
    try {
      const raw = await getAlpacaClient().getSnapshot(symbol) as unknown as Record<string, unknown>;
      // Transform Alpaca's compact field names to readable ones
      const rawQuote = raw.latestQuote as Record<string, unknown> | null;
      const rawTrade = raw.latestTrade as Record<string, unknown> | null;
      const rawDaily = raw.dailyBar as Record<string, unknown> | null;
      const rawPrev = raw.prevDailyBar as Record<string, unknown> | null;

      const dailyBar = rawDaily ? {
        open: rawDaily.o as number, high: rawDaily.h as number,
        low: rawDaily.l as number, close: rawDaily.c as number,
        volume: rawDaily.v as number,
      } : null;

      const prevDailyBar = rawPrev ? {
        open: rawPrev.o as number, high: rawPrev.h as number,
        low: rawPrev.l as number, close: rawPrev.c as number,
        volume: rawPrev.v as number,
      } : null;

      let dailyChange = 0, dailyChangePercent = 0;
      if (dailyBar) {
        const ref = prevDailyBar ? prevDailyBar.close : dailyBar.open;
        if (ref !== 0) {
          dailyChange = dailyBar.close - ref;
          dailyChangePercent = (dailyChange / ref) * 100;
        }
      }

      snapshot = {
        latestTrade: rawTrade ? {
          price: rawTrade.p as number, size: rawTrade.s as number,
          timestamp: rawTrade.t as string,
        } : null,
        latestQuote: rawQuote ? {
          bidPrice: rawQuote.bp as number, bidSize: rawQuote.bs as number,
          askPrice: rawQuote.ap as number, askSize: rawQuote.as as number,
          timestamp: rawQuote.t as string,
        } : null,
        dailyBar, prevDailyBar, dailyChange, dailyChangePercent,
      };
    } catch {
      // Snapshot may fail; return null
    }

    const base = info ?? {
      symbol, name: '', sector: '', industry: '', description: '',
      marketCap: '', tags: [] as string[],
    };

    res.json({ ...base, snapshot });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// ── GET /market/sectors ──

marketRouter.get("/market/sectors", (_req, res) => {
  try {
    const result: { sector: string; count: number }[] = [];
    for (const [sector, list] of sectorMap) {
      result.push({ sector, count: list.length });
    }
    result.sort((a, b) => b.count - a.count);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// ── GET /market/movers ──

marketRouter.get("/market/movers", async (_req, res) => {
  try {
    const symbolsStr = MAJOR_SYMBOLS.join(",");
    const snapshots = await getAlpacaClient().getSnapshots(symbolsStr);

    const entries: MoverEntry[] = [];

    for (const [symbol, snap] of Object.entries(snapshots)) {
      const pct = calcChangePercent(snap);
      if (pct === null || !snap.dailyBar) continue;

      const info = tickerMap.get(symbol);
      const price = snap.dailyBar.c;
      const prevPrice =
        snap.prevDailyBar?.c ?? snap.dailyBar.o;
      const change = price - prevPrice;

      entries.push({
        symbol,
        name: info?.name ?? symbol,
        price,
        change,
        changePercent: pct,
        volume: snap.dailyBar.v,
      });
    }

    entries.sort((a, b) => b.changePercent - a.changePercent);

    const gainers = entries.filter((e) => e.changePercent > 0).slice(0, 10);
    const losers = entries
      .filter((e) => e.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10);

    res.json({ gainers, losers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// ── GET /market/overview ──

marketRouter.get("/market/overview", async (_req, res) => {
  try {
    // Fetch index ETF snapshots and major-symbol snapshots in parallel
    const indexSymbolsStr = INDEX_ETFS.join(",");
    const majorSymbolsStr = MAJOR_SYMBOLS.join(",");

    const [indexSnapshots, majorSnapshots] = await Promise.all([
      getAlpacaClient().getSnapshots(indexSymbolsStr),
      getAlpacaClient().getSnapshots(majorSymbolsStr),
    ]);

    // Build index entries
    const indexNames: Record<string, string> = {
      SPY: "S&P 500",
      QQQ: "Nasdaq 100",
      DIA: "Dow Jones",
      IWM: "Russell 2000",
    };

    const indices: IndexEntry[] = [];
    for (const symbol of INDEX_ETFS) {
      const snap = indexSnapshots[symbol];
      if (!snap?.dailyBar) continue;

      const pct = calcChangePercent(snap);
      const price = snap.dailyBar.c;
      const prevPrice = snap.prevDailyBar?.c ?? snap.dailyBar.o;

      indices.push({
        symbol,
        name: indexNames[symbol] ?? symbol,
        price,
        change: price - prevPrice,
        changePercent: pct ?? 0,
      });
    }

    // Calculate average % change per sector
    const sectorChanges = new Map<string, number[]>();

    for (const [symbol, snap] of Object.entries(majorSnapshots)) {
      const info = tickerMap.get(symbol);
      if (!info) continue;

      const pct = calcChangePercent(snap);
      if (pct === null) continue;

      const existing = sectorChanges.get(info.sector);
      if (existing) {
        existing.push(pct);
      } else {
        sectorChanges.set(info.sector, [pct]);
      }
    }

    const sectors: SectorPerf[] = [];
    for (const [sector, changes] of sectorChanges) {
      const avg = changes.reduce((sum, v) => sum + v, 0) / changes.length;
      sectors.push({
        sector,
        avgChangePercent: Math.round(avg * 100) / 100,
        tickerCount: changes.length,
      });
    }
    sectors.sort((a, b) => b.avgChangePercent - a.avgChangePercent);

    res.json({ indices, sectors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});
