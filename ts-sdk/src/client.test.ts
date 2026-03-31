import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { AlpacaClient } from "./client.js";
import { createServer, IncomingMessage, ServerResponse } from "http";
import type { Server } from "http";
import type { Order, Account, Position, Asset, Clock } from "./types.js";

let server: Server;
let baseUrl: string;
let mockState: {
  orders: Record<string, unknown>[];
  positions: Map<string, Record<string, unknown>>;
  watchlists: Record<string, unknown>[];
  fillPrice: number;
  accountConfig: Record<string, unknown>;
};

function resetState() {
  mockState = {
    orders: [],
    positions: new Map(),
    watchlists: [],
    fillPrice: 150.0,
    accountConfig: {
      dtbp_check: "both",
      fractional_trading: true,
      max_margin_multiplier: "2",
      no_shorting: false,
      pdt_check: "entry",
      suspend_trade: false,
      trade_confirm_email: "all",
    },
  };
}

function generateId(): string {
  return crypto.randomUUID();
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk.toString()));
    req.on("end", () => resolve(data));
  });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method!;

  res.setHeader("Content-Type", "application/json");

  // Account
  if (method === "GET" && path === "/v2/account") {
    res.end(
      JSON.stringify({
        id: generateId(),
        account_number: "PA1234567890",
        status: "ACTIVE",
        currency: "USD",
        cash: "100000",
        buying_power: "200000",
        portfolio_value: "100000",
        equity: "100000",
        long_market_value: "0",
        short_market_value: "0",
        pattern_day_trader: false,
        trading_blocked: false,
        created_at: new Date().toISOString(),
        daytrade_count: 0,
        regt_buying_power: "200000",
        daytrading_buying_power: "0",
        non_marginable_buying_power: "100000",
        last_equity: "100000",
        initial_margin: "0",
        maintenance_margin: "0",
        last_maintenance_margin: "0",
        sma: "0",
        multiplier: "2",
        transfers_blocked: false,
        account_blocked: false,
        trade_suspended_by_user: false,
        shorting_enabled: true,
      })
    );
    return;
  }

  // Account config
  if (method === "GET" && path === "/v2/account/configurations") {
    res.end(JSON.stringify(mockState.accountConfig));
    return;
  }
  if (method === "PATCH" && path === "/v2/account/configurations") {
    const body = JSON.parse(await readBody(req));
    Object.assign(mockState.accountConfig, body);
    res.end(JSON.stringify(mockState.accountConfig));
    return;
  }

  // Portfolio history
  if (method === "GET" && path === "/v2/account/portfolio/history") {
    res.end(
      JSON.stringify({
        timestamp: [1616630400, 1616716800],
        equity: [100000.0, 100500.0],
        profit_loss: [0.0, 500.0],
        profit_loss_pct: [0.0, 0.005],
        base_value: 100000.0,
        timeframe: "1D",
      })
    );
    return;
  }

  // Activities
  if (method === "GET" && path.startsWith("/v2/account/activities")) {
    res.end(JSON.stringify([]));
    return;
  }

  // Clock
  if (method === "GET" && path === "/v2/clock") {
    const now = new Date().toISOString();
    res.end(
      JSON.stringify({
        timestamp: now,
        is_open: true,
        next_open: now,
        next_close: now,
      })
    );
    return;
  }

  // Calendar
  if (method === "GET" && path === "/v2/calendar") {
    res.end(
      JSON.stringify([
        { date: "2026-03-27", open: "09:30", close: "16:00" },
        { date: "2026-03-30", open: "09:30", close: "16:00" },
      ])
    );
    return;
  }

  // Orders by client ID
  if (method === "GET" && path === "/v2/orders:by_client_order_id") {
    const clientId = url.searchParams.get("client_order_id");
    const order = mockState.orders.find(
      (o) => o.client_order_id === clientId
    );
    if (order) {
      res.end(JSON.stringify(order));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    }
    return;
  }

  // Orders
  if (method === "GET" && path === "/v2/orders") {
    res.end(JSON.stringify(mockState.orders));
    return;
  }

  if (method === "POST" && path === "/v2/orders") {
    const body = JSON.parse(await readBody(req));
    const isMarket = (body.type ?? "market") === "market";
    const now = new Date().toISOString();
    const orderId = generateId();
    const qty = body.qty ?? "1";

    const order = {
      id: orderId,
      client_order_id: body.client_order_id ?? generateId(),
      created_at: now,
      updated_at: now,
      submitted_at: now,
      filled_at: isMarket ? now : null,
      expired_at: null,
      expires_at: null,
      canceled_at: null,
      failed_at: null,
      replaced_at: null,
      replaced_by: null,
      replaces: null,
      asset_id: generateId(),
      symbol: body.symbol,
      asset_class: "us_equity",
      notional: body.notional ?? null,
      qty,
      filled_qty: isMarket ? qty : "0",
      filled_avg_price: isMarket
        ? mockState.fillPrice.toFixed(2)
        : null,
      order_class: "",
      order_type: body.type ?? "market",
      type: body.type ?? "market",
      side: body.side,
      position_intent:
        body.side === "buy" ? "buy_to_open" : "sell_to_close",
      time_in_force: body.time_in_force ?? "day",
      limit_price: body.limit_price ?? null,
      stop_price: body.stop_price ?? null,
      status: isMarket ? "filled" : "new",
      extended_hours: body.extended_hours ?? false,
      legs: null,
      trail_percent: null,
      trail_price: null,
      hwm: null,
      subtag: null,
      source: null,
    };

    if (isMarket) {
      const symbol = body.symbol;
      const qtyNum = parseFloat(qty);
      const existing = mockState.positions.get(symbol);
      const currentQty = existing
        ? parseFloat(existing.qty as string)
        : 0;
      const newQty =
        body.side === "buy" ? currentQty + qtyNum : currentQty - qtyNum;
      if (newQty === 0) {
        mockState.positions.delete(symbol);
      } else {
        mockState.positions.set(symbol, {
          asset_id: generateId(),
          symbol,
          exchange: "NASDAQ",
          asset_class: "us_equity",
          avg_entry_price: mockState.fillPrice.toFixed(2),
          qty: newQty.toString(),
          side: newQty > 0 ? "long" : "short",
          market_value: (newQty * mockState.fillPrice).toFixed(2),
          cost_basis: (newQty * mockState.fillPrice).toFixed(2),
          unrealized_pl: "0.00",
          current_price: mockState.fillPrice.toFixed(2),
        });
      }
    }

    mockState.orders.push(order);
    res.end(JSON.stringify(order));
    return;
  }

  // Replace order
  const replaceMatch = path.match(/^\/v2\/orders\/(.+)$/);
  if (method === "PATCH" && replaceMatch) {
    const id = replaceMatch[1];
    const body = JSON.parse(await readBody(req));
    const order = mockState.orders.find((o) => o.id === id);
    if (order) {
      if (body.qty) order.qty = body.qty;
      if (body.limit_price) order.limit_price = body.limit_price;
      if (body.stop_price) order.stop_price = body.stop_price;
      order.status = "replaced";
      res.end(JSON.stringify(order));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    }
    return;
  }

  // Get order by ID
  const orderGetMatch = path.match(/^\/v2\/orders\/(.+)$/);
  if (method === "GET" && orderGetMatch) {
    const id = orderGetMatch[1];
    const order = mockState.orders.find((o) => o.id === id);
    if (order) {
      res.end(JSON.stringify(order));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    }
    return;
  }

  // Cancel order
  const cancelMatch = path.match(/^\/v2\/orders\/(.+)$/);
  if (method === "DELETE" && cancelMatch) {
    const id = cancelMatch[1];
    const order = mockState.orders.find((o) => o.id === id);
    if (order) {
      order.status = "canceled";
      order.canceled_at = new Date().toISOString();
      res.statusCode = 204;
      res.end();
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    }
    return;
  }

  if (method === "DELETE" && path === "/v2/orders") {
    for (const order of mockState.orders) {
      if (order.status === "new" || order.status === "partially_filled") {
        order.status = "canceled";
      }
    }
    res.end(JSON.stringify([]));
    return;
  }

  // Positions
  if (method === "GET" && path === "/v2/positions") {
    res.end(JSON.stringify([...mockState.positions.values()]));
    return;
  }

  if (method === "DELETE" && path === "/v2/positions") {
    mockState.positions.clear();
    res.end(JSON.stringify([]));
    return;
  }

  const posMatch = path.match(/^\/v2\/positions\/(.+)$/);
  if (method === "GET" && posMatch) {
    const pos = mockState.positions.get(posMatch[1]);
    if (pos) {
      res.end(JSON.stringify(pos));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    }
    return;
  }

  if (method === "DELETE" && posMatch) {
    const sym = posMatch[1];
    const existed = mockState.positions.delete(sym);
    if (existed) {
      res.end(
        JSON.stringify({
          id: generateId(),
          symbol: sym,
          status: "filled",
          side: "sell",
          type: "market",
          order_class: "",
        })
      );
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "not found" }));
    }
    return;
  }

  // Assets
  if (method === "GET" && path === "/v2/assets") {
    res.end(
      JSON.stringify([
        {
          id: generateId(),
          class: "us_equity",
          exchange: "NASDAQ",
          symbol: "AAPL",
          name: "Apple Inc.",
          status: "active",
          tradable: true,
          marginable: true,
          maintenance_margin_requirement: 30,
          margin_requirement_long: "30",
          margin_requirement_short: "30",
          shortable: true,
          easy_to_borrow: true,
          fractionable: true,
        },
        {
          id: generateId(),
          class: "us_equity",
          exchange: "NASDAQ",
          symbol: "MSFT",
          name: "Microsoft Corporation",
          status: "active",
          tradable: true,
          marginable: true,
          maintenance_margin_requirement: 30,
          margin_requirement_long: "30",
          margin_requirement_short: "30",
          shortable: true,
          easy_to_borrow: true,
          fractionable: true,
        },
      ])
    );
    return;
  }

  const assetMatch = path.match(/^\/v2\/assets\/(.+)$/);
  if (method === "GET" && assetMatch) {
    const sym = assetMatch[1].toUpperCase();
    res.end(
      JSON.stringify({
        id: generateId(),
        class: "us_equity",
        exchange: "NASDAQ",
        symbol: sym,
        name: `${sym} Inc.`,
        status: "active",
        tradable: true,
        marginable: true,
        maintenance_margin_requirement: 30,
        shortable: true,
        easy_to_borrow: true,
        fractionable: true,
      })
    );
    return;
  }

  // Watchlists
  if (method === "GET" && path === "/v2/watchlists") {
    res.end(JSON.stringify(mockState.watchlists));
    return;
  }

  if (method === "POST" && path === "/v2/watchlists") {
    const body = JSON.parse(await readBody(req));
    const wl = {
      id: generateId(),
      account_id: generateId(),
      name: body.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assets: [],
    };
    mockState.watchlists.push(wl);
    res.end(JSON.stringify(wl));
    return;
  }

  const wlMatch = path.match(/^\/v2\/watchlists\/([^/]+)$/);
  if (wlMatch) {
    const id = wlMatch[1];
    if (method === "GET") {
      const wl = mockState.watchlists.find((w) => w.id === id);
      if (wl) {
        res.end(JSON.stringify(wl));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: "not found" }));
      }
      return;
    }
    if (method === "PUT") {
      const body = JSON.parse(await readBody(req));
      const wl = mockState.watchlists.find((w) => w.id === id);
      if (wl) {
        if (body.name) wl.name = body.name;
        wl.updated_at = new Date().toISOString();
        res.end(JSON.stringify(wl));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: "not found" }));
      }
      return;
    }
    if (method === "POST") {
      // Add asset
      const wl = mockState.watchlists.find((w) => w.id === id);
      if (wl) {
        res.end(JSON.stringify(wl));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: "not found" }));
      }
      return;
    }
    if (method === "DELETE") {
      mockState.watchlists = mockState.watchlists.filter(
        (w) => w.id !== id
      );
      res.statusCode = 204;
      res.end();
      return;
    }
  }

  // Watchlist remove asset
  const wlAssetMatch = path.match(/^\/v2\/watchlists\/([^/]+)\/(.+)$/);
  if (method === "DELETE" && wlAssetMatch) {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Corporate actions
  if (
    method === "GET" &&
    path === "/v2/corporate_actions/announcements"
  ) {
    res.end(JSON.stringify([]));
    return;
  }

  // Market data - bars
  if (method === "GET" && path.match(/\/v2\/stocks\/\w+\/bars$/)) {
    const now = new Date().toISOString();
    res.end(
      JSON.stringify({
        bars: [
          {
            t: now,
            o: 150.0,
            h: 152.0,
            l: 149.0,
            c: 151.0,
            v: 1000000,
            n: 5000,
            vw: 150.5,
          },
        ],
        next_page_token: null,
      })
    );
    return;
  }

  // Latest trade
  if (method === "GET" && path.match(/\/v2\/stocks\/\w+\/trades\/latest$/)) {
    res.end(
      JSON.stringify({
        trade: {
          t: new Date().toISOString(),
          x: "V",
          p: mockState.fillPrice,
          s: 100,
          c: ["@"],
        },
      })
    );
    return;
  }

  // Latest quote
  if (method === "GET" && path.match(/\/v2\/stocks\/\w+\/quotes\/latest$/)) {
    res.end(
      JSON.stringify({
        quote: {
          t: new Date().toISOString(),
          ax: "V",
          ap: mockState.fillPrice + 0.01,
          as: 100,
          bx: "V",
          bp: mockState.fillPrice - 0.01,
          bs: 200,
        },
      })
    );
    return;
  }

  // Snapshot
  if (method === "GET" && path.match(/\/v2\/stocks\/\w+\/snapshot$/)) {
    const now = new Date().toISOString();
    const p = mockState.fillPrice;
    res.end(
      JSON.stringify({
        latestTrade: { t: now, x: "V", p, s: 100 },
        latestQuote: {
          t: now,
          ax: "V",
          ap: p + 0.01,
          as: 100,
          bx: "V",
          bp: p - 0.01,
          bs: 200,
        },
        minuteBar: {
          t: now,
          o: p,
          h: p + 1,
          l: p - 1,
          c: p + 0.5,
          v: 50000,
        },
        dailyBar: {
          t: now,
          o: p - 2,
          h: p + 3,
          l: p - 3,
          c: p,
          v: 5000000,
        },
        prevDailyBar: null,
      })
    );
    return;
  }

  // Historical trades
  if (method === "GET" && path.match(/\/v2\/stocks\/\w+\/trades$/)) {
    const now = new Date().toISOString();
    res.end(
      JSON.stringify({
        trades: [
          {
            t: now,
            x: "V",
            p: 150.25,
            s: 100,
            c: ["@"],
            i: 12345,
            z: "C",
          },
          {
            t: now,
            x: "V",
            p: 150.30,
            s: 200,
            c: ["@"],
            i: 12346,
            z: "C",
          },
        ],
        next_page_token: null,
      })
    );
    return;
  }

  // Historical quotes
  if (method === "GET" && path.match(/\/v2\/stocks\/\w+\/quotes$/)) {
    const now = new Date().toISOString();
    res.end(
      JSON.stringify({
        quotes: [
          {
            t: now,
            ax: "V",
            ap: 150.01,
            as: 100,
            bx: "V",
            bp: 149.99,
            bs: 200,
            c: ["R"],
            z: "C",
          },
        ],
        next_page_token: null,
      })
    );
    return;
  }

  // Multi snapshots
  if (method === "GET" && path === "/v2/stocks/snapshots") {
    const symbols = (url.searchParams.get("symbols") ?? "").split(",");
    const result: Record<string, unknown> = {};
    const now = new Date().toISOString();
    for (const sym of symbols) {
      result[sym] = {
        latestTrade: { t: now, p: mockState.fillPrice, s: 100 },
        latestQuote: {
          t: now,
          ap: mockState.fillPrice + 0.01,
          bp: mockState.fillPrice - 0.01,
        },
        minuteBar: null,
        dailyBar: null,
        prevDailyBar: null,
      };
    }
    res.end(JSON.stringify(result));
    return;
  }

  // Option contracts list
  if (method === "GET" && path === "/v2/options/contracts") {
    res.end(
      JSON.stringify({
        option_contracts: [
          {
            id: "c0b04beb-5c9a-4a29-8dbc-1a01a0a0a0a0",
            symbol: "AAPL260417C00200000",
            name: "AAPL Apr 17 2026 200 Call",
            status: "active",
            tradable: true,
            expiration_date: "2026-04-17",
            strike_price: "200.00",
            type: "call",
            underlying_symbol: "AAPL",
            style: "american",
            size: "100",
            open_interest: "5000",
          },
        ],
        next_page_token: null,
      })
    );
    return;
  }

  // Option contract by ID
  const optionContractMatch = path.match(/^\/v2\/options\/contracts\/(.+)$/);
  if (method === "GET" && optionContractMatch) {
    const contractId = optionContractMatch[1];
    res.end(
      JSON.stringify({
        id: contractId,
        symbol: "AAPL260417C00200000",
        name: "AAPL Apr 17 2026 200 Call",
        status: "active",
        tradable: true,
        expiration_date: "2026-04-17",
        strike_price: "200.00",
        type: "call",
        underlying_symbol: "AAPL",
        style: "american",
        size: "100",
        open_interest: "5000",
      })
    );
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ message: "not found" }));
}

// ── Test Suite ──────────────────────────────────────────

describe("AlpacaClient", () => {
  let client: AlpacaClient;

  beforeAll(async () => {
    server = createServer((req, res) => {
      handleRequest(req, res).catch((err) => {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: String(err) }));
      });
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    server?.close();
  });

  beforeEach(() => {
    resetState();
    client = new AlpacaClient({
      keyId: "test-key",
      secretKey: "test-secret",
      paper: true,
      baseUrl,
      dataUrl: baseUrl,
    });
  });

  describe("Account", () => {
    it("should get account details", async () => {
      const account = await client.getAccount();
      expect(account.status).toBe("ACTIVE");
      expect(account.currency).toBe("USD");
      expect(account.trading_blocked).toBe(false);
    });

    it("should get account config", async () => {
      const config = await client.getAccountConfig();
      expect(config.fractional_trading).toBe(true);
      expect(config.max_margin_multiplier).toBe("2");
    });

    it("should update account config", async () => {
      const updated = await client.updateAccountConfig({
        no_shorting: true,
      });
      expect(updated.no_shorting).toBe(true);
    });

    it("should get portfolio history", async () => {
      const history = await client.getPortfolioHistory();
      expect(
        (history as Record<string, unknown[]>).timestamp.length
      ).toBeGreaterThan(0);
    });

    it("should get activities", async () => {
      const activities = await client.getActivities();
      expect(activities).toEqual([]);
    });
  });

  describe("Clock & Calendar", () => {
    it("should get market clock", async () => {
      const clock = await client.getClock();
      expect(clock.is_open).toBe(true);
    });

    it("should get market calendar", async () => {
      const cal = await client.getCalendar({
        start: "2026-03-27",
        end: "2026-03-30",
      });
      expect(cal.length).toBeGreaterThan(0);
    });
  });

  describe("Orders", () => {
    it("should create a market order", async () => {
      const order = await client.createOrder({
        symbol: "AAPL",
        qty: "10",
        side: "buy",
        type: "market",
        time_in_force: "day",
      });
      expect(order.symbol).toBe("AAPL");
      expect(order.status).toBe("filled");
    });

    it("should create a limit order", async () => {
      const order = await client.createOrder({
        symbol: "MSFT",
        qty: "5",
        side: "buy",
        type: "limit",
        time_in_force: "gtc",
        limit_price: "300.00",
      });
      expect(order.status).toBe("new");
      expect(order.limit_price).toBe("300.00");
    });

    it("should list orders", async () => {
      await client.createOrder({ symbol: "AAPL", qty: "1", side: "buy" });
      const orders = await client.listOrders("all");
      expect(orders.length).toBeGreaterThan(0);
    });

    it("should get order by ID", async () => {
      const order = await client.createOrder({
        symbol: "AAPL",
        qty: "1",
        side: "buy",
      });
      const fetched = await client.getOrder(order.id);
      expect(fetched.id).toBe(order.id);
    });

    it("should get order by client ID", async () => {
      const order = await client.createOrder({
        symbol: "AAPL",
        qty: "1",
        side: "buy",
      });
      const fetched = await client.getOrderByClientId(order.client_order_id);
      expect(fetched.id).toBe(order.id);
    });

    it("should replace an order", async () => {
      const order = await client.createOrder({
        symbol: "AAPL",
        qty: "5",
        side: "buy",
        type: "limit",
        limit_price: "100.00",
      });
      const replaced = await client.replaceOrder(order.id, {
        qty: "10",
        limit_price: "105.00",
      });
      expect(replaced.status).toBe("replaced");
    });

    it("should cancel an order", async () => {
      const order = await client.createOrder({
        symbol: "AAPL",
        qty: "1",
        side: "buy",
        type: "limit",
        limit_price: "100.00",
      });
      await client.cancelOrder(order.id);
    });

    it("should cancel all orders", async () => {
      await client.createOrder({
        symbol: "AAPL",
        qty: "1",
        side: "buy",
        type: "limit",
        limit_price: "100.00",
      });
      await client.cancelAllOrders();
    });
  });

  describe("Positions", () => {
    it("should start with no positions", async () => {
      const positions = await client.listPositions();
      expect(positions).toEqual([]);
    });

    it("should have position after market buy", async () => {
      await client.createOrder({ symbol: "AAPL", qty: "10", side: "buy" });
      const positions = await client.listPositions();
      expect(positions.length).toBe(1);
      expect(positions[0].symbol).toBe("AAPL");
      expect(positions[0].qty).toBe("10");
    });

    it("should reduce position on sell", async () => {
      await client.createOrder({ symbol: "AAPL", qty: "10", side: "buy" });
      await client.createOrder({ symbol: "AAPL", qty: "4", side: "sell" });
      const positions = await client.listPositions();
      expect(positions.length).toBe(1);
      expect(positions[0].qty).toBe("6");
    });

    it("should remove position when fully sold", async () => {
      await client.createOrder({ symbol: "AAPL", qty: "5", side: "buy" });
      await client.createOrder({ symbol: "AAPL", qty: "5", side: "sell" });
      const positions = await client.listPositions();
      expect(positions).toEqual([]);
    });

    it("should get position by symbol", async () => {
      await client.createOrder({ symbol: "NVDA", qty: "3", side: "buy" });
      const pos = await client.getPosition("NVDA");
      expect(pos.symbol).toBe("NVDA");
      expect(pos.qty).toBe("3");
    });

    it("should close a position", async () => {
      await client.createOrder({ symbol: "AAPL", qty: "5", side: "buy" });
      await client.closePosition("AAPL");
      const positions = await client.listPositions();
      expect(positions).toEqual([]);
    });

    it("should close all positions", async () => {
      await client.createOrder({ symbol: "AAPL", qty: "5", side: "buy" });
      await client.createOrder({ symbol: "MSFT", qty: "3", side: "buy" });
      expect((await client.listPositions()).length).toBe(2);
      await client.closeAllPositions();
      const positions = await client.listPositions();
      expect(positions).toEqual([]);
    });
  });

  describe("Assets", () => {
    it("should list assets", async () => {
      const assets = await client.listAssets();
      expect(assets.length).toBeGreaterThan(0);
      const aapl = assets.find((a) => a.symbol === "AAPL");
      expect(aapl).toBeTruthy();
      expect(aapl!.tradable).toBe(true);
    });

    it("should get asset by symbol", async () => {
      const asset = await client.getAsset("AAPL");
      expect(asset.symbol).toBe("AAPL");
      expect(asset.tradable).toBe(true);
    });
  });

  describe("Watchlists", () => {
    it("should CRUD watchlists", async () => {
      // Create
      const wl = await client.createWatchlist("Tech", ["AAPL", "MSFT"]);
      expect(wl.name).toBe("Tech");

      // List
      const wls = await client.listWatchlists();
      expect(wls.length).toBe(1);

      // Get
      const fetched = await client.getWatchlist(wl.id as string);
      expect(fetched.name).toBe("Tech");

      // Update
      const updated = await client.updateWatchlist(wl.id as string, {
        name: "Tech v2",
      });
      expect(updated.name).toBe("Tech v2");

      // Add asset
      await client.addAssetToWatchlist(wl.id as string, "NVDA");

      // Remove asset
      await client.removeAssetFromWatchlist(wl.id as string, "MSFT");

      // Delete
      await client.deleteWatchlist(wl.id as string);
      const empty = await client.listWatchlists();
      expect(empty).toEqual([]);
    });
  });

  describe("Market Data", () => {
    it("should get bars", async () => {
      const bars = await client.getBars("AAPL", "1Day");
      expect(bars.length).toBeGreaterThan(0);
      expect(bars[0].o).toBeGreaterThan(0);
    });

    it("should get latest trade", async () => {
      const trade = await client.getLatestTrade("AAPL");
      expect(trade.p).toBeGreaterThan(0);
    });

    it("should get latest quote", async () => {
      const quote = await client.getLatestQuote("AAPL");
      expect(quote.ap).toBeGreaterThan(0);
      expect(quote.bp).toBeGreaterThan(0);
      expect(quote.ap).toBeGreaterThan(quote.bp);
    });

    it("should get snapshot", async () => {
      const snap = await client.getSnapshot("AAPL");
      expect(snap.latestTrade).toBeTruthy();
      expect(snap.latestQuote).toBeTruthy();
    });

    it("should get multi snapshots", async () => {
      const snaps = await client.getSnapshots("AAPL,MSFT");
      expect(snaps["AAPL"]).toBeTruthy();
      expect(snaps["MSFT"]).toBeTruthy();
    });

    it("should get historical trades", async () => {
      const result = await client.getTrades("AAPL", {
        start: "2026-01-01",
        end: "2026-03-27",
        limit: 10,
      });
      const data = result as { trades: Record<string, unknown>[]; next_page_token: string | null };
      expect(data.trades).toBeDefined();
      expect(data.trades.length).toBe(2);
      expect(data.trades[0].p).toBe(150.25);
      expect(data.next_page_token).toBeNull();
    });

    it("should get historical quotes", async () => {
      const result = await client.getQuotes("AAPL", {
        start: "2026-01-01",
        end: "2026-03-27",
        limit: 10,
      });
      const data = result as { quotes: Record<string, unknown>[]; next_page_token: string | null };
      expect(data.quotes).toBeDefined();
      expect(data.quotes.length).toBe(1);
      expect(data.quotes[0].ap).toBe(150.01);
      expect(data.quotes[0].bp).toBe(149.99);
      expect(data.next_page_token).toBeNull();
    });
  });

  describe("Corporate Actions", () => {
    it("should list corporate actions", async () => {
      const actions = await client.listCorporateActions(
        "dividend",
        "2026-01-01",
        "2026-12-31"
      );
      expect(Array.isArray(actions)).toBe(true);
    });
  });

  describe("Options", () => {
    it("should list option contracts", async () => {
      const result = await client.listOptionContracts({
        underlying_symbols: "AAPL",
        type: "call",
      });
      const data = result as {
        option_contracts: Record<string, unknown>[];
        next_page_token: string | null;
      };
      expect(data.option_contracts).toBeDefined();
      expect(data.option_contracts.length).toBe(1);
      expect(data.option_contracts[0].underlying_symbol).toBe("AAPL");
      expect(data.option_contracts[0].type).toBe("call");
      expect(data.option_contracts[0].strike_price).toBe("200.00");
      expect(data.next_page_token).toBeNull();
    });

    it("should get option contract by ID", async () => {
      const contractId = "c0b04beb-5c9a-4a29-8dbc-1a01a0a0a0a0";
      const contract = await client.getOptionContract(contractId);
      expect(contract.id).toBe(contractId);
      expect(contract.symbol).toBe("AAPL260417C00200000");
      expect(contract.type).toBe("call");
      expect(contract.underlying_symbol).toBe("AAPL");
      expect(contract.expiration_date).toBe("2026-04-17");
    });
  });

  describe("Multi-symbol trading", () => {
    it("should manage positions across multiple symbols", async () => {
      await client.createOrder({ symbol: "AAPL", qty: "10", side: "buy" });
      await client.createOrder({ symbol: "MSFT", qty: "5", side: "buy" });
      await client.createOrder({ symbol: "NVDA", qty: "3", side: "buy" });

      let positions = await client.listPositions();
      expect(positions.length).toBe(3);

      await client.createOrder({ symbol: "MSFT", qty: "5", side: "sell" });

      positions = await client.listPositions();
      expect(positions.length).toBe(2);
      expect(positions.find((p) => p.symbol === "MSFT")).toBeUndefined();
    });
  });
});
