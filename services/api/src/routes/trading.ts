import { Router } from "express";
import { getAlpacaClient } from "../lib/alpaca.js";
import { requirePrivilege } from "../middleware/rbac.js";

export const tradingRouter = Router();

// ── Account & Portfolio (require view_positions) ──

tradingRouter.get("/account", requirePrivilege("view_positions"), async (_req, res) => {
  try {
    const account = await getAlpacaClient().getAccount();
    res.json(account);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

tradingRouter.get("/portfolio/history", requirePrivilege("view_positions"), async (req, res) => {
  try {
    const params = req.query as { period?: string; timeframe?: string };
    const history = await getAlpacaClient().getPortfolioHistory(params);
    res.json(history);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// ── Positions (view_positions for GET, trade for close) ──

tradingRouter.get("/positions", requirePrivilege("view_positions"), async (_req, res) => {
  try {
    const positions = await getAlpacaClient().listPositions();
    res.json(positions);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

tradingRouter.get("/positions/:symbol", requirePrivilege("view_positions"), async (req, res) => {
  try {
    const position = await getAlpacaClient().getPosition(req.params.symbol as string);
    res.json(position);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("404") ? 404 : 502;
    res.status(status).json({ error: message });
  }
});

tradingRouter.post("/positions/:symbol/close", requirePrivilege("trade"), async (req, res) => {
  try {
    const result = await getAlpacaClient().closePosition(
      req.params.symbol as string,
      req.body
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// ── Orders (view_orders for GET, trade for POST/DELETE) ──

tradingRouter.get("/orders", requirePrivilege("view_orders"), async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const orders = await getAlpacaClient().listOrders(status);
    res.json(orders);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

tradingRouter.get("/orders/:id", requirePrivilege("view_orders"), async (req, res) => {
  try {
    const order = await getAlpacaClient().getOrder(req.params.id as string);
    res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("404") ? 404 : 502;
    res.status(status).json({ error: message });
  }
});

tradingRouter.post("/orders", requirePrivilege("trade"), async (req, res) => {
  try {
    const order = await getAlpacaClient().createOrder(req.body);
    res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("422") ? 422 : 502;
    res.status(status).json({ error: message });
  }
});

tradingRouter.delete("/orders/:id", requirePrivilege("trade"), async (req, res) => {
  try {
    await getAlpacaClient().cancelOrder(req.params.id as string);
    res.status(204).end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("404") ? 404 : 502;
    res.status(status).json({ error: message });
  }
});

tradingRouter.delete("/orders", requirePrivilege("trade"), async (_req, res) => {
  try {
    await getAlpacaClient().cancelAllOrders();
    res.status(204).end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

// ── Clock & Assets (accessible to all authenticated users) ──

tradingRouter.get("/clock", async (_req, res) => {
  try {
    const clock = await getAlpacaClient().getClock();
    res.json(clock);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

tradingRouter.get("/assets", async (req, res) => {
  try {
    const params = req.query as {
      status?: string;
      asset_class?: string;
    };
    const assets = await getAlpacaClient().listAssets(params);
    res.json(assets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: message });
  }
});

tradingRouter.get("/assets/:symbol", async (req, res) => {
  try {
    const asset = await getAlpacaClient().getAsset(req.params.symbol as string);
    res.json(asset);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("404") ? 404 : 502;
    res.status(status).json({ error: message });
  }
});
