import type {
  Account,
  AlpacaClientConfig,
  Asset,
  Bar,
  Clock,
  CreateOrderParams,
  Order,
  Position,
  Quote,
  Snapshot,
  Trade,
} from "./types.js";

const PAPER_BASE = "https://paper-api.alpaca.markets";
const LIVE_BASE = "https://api.alpaca.markets";
const DATA_BASE = "https://data.alpaca.markets";

export class AlpacaClient {
  private keyId: string;
  private secretKey: string;
  private baseUrl: string;
  private dataUrl: string;

  constructor(config: AlpacaClientConfig) {
    this.keyId = config.keyId;
    this.secretKey = config.secretKey;
    this.baseUrl =
      config.baseUrl ?? (config.paper !== false ? PAPER_BASE : LIVE_BASE);
    this.dataUrl = config.dataUrl ?? DATA_BASE;
  }

  private headers(): Record<string, string> {
    return {
      "APCA-API-KEY-ID": this.keyId,
      "APCA-API-SECRET-KEY": this.secretKey,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    query?: Record<string, string>
  ): Promise<T> {
    let fullUrl = url;
    if (query) {
      const params = new URLSearchParams(
        Object.entries(query).filter(([, v]) => v !== undefined)
      );
      const qs = params.toString();
      if (qs) fullUrl += `?${qs}`;
    }

    const resp = await fetch(fullUrl, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Alpaca API error ${resp.status}: ${text}`);
    }

    if (resp.status === 204) return undefined as T;
    return resp.json() as Promise<T>;
  }

  private tradingUrl(path: string): string {
    return `${this.baseUrl}/v2${path}`;
  }

  private dataUrlPath(path: string): string {
    return `${this.dataUrl}/v2${path}`;
  }

  // ── Account ──

  async getAccount(): Promise<Account> {
    return this.request("GET", this.tradingUrl("/account"));
  }

  async getAccountConfig(): Promise<Record<string, unknown>> {
    return this.request("GET", this.tradingUrl("/account/configurations"));
  }

  async updateAccountConfig(
    config: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.request(
      "PATCH",
      this.tradingUrl("/account/configurations"),
      config
    );
  }

  async getPortfolioHistory(params?: {
    period?: string;
    timeframe?: string;
  }): Promise<Record<string, unknown>> {
    return this.request(
      "GET",
      this.tradingUrl("/account/portfolio/history"),
      undefined,
      params as Record<string, string>
    );
  }

  async getActivities(
    activityType?: string
  ): Promise<Record<string, unknown>[]> {
    const path = activityType
      ? `/account/activities/${activityType}`
      : "/account/activities";
    return this.request("GET", this.tradingUrl(path));
  }

  async getClock(): Promise<Clock> {
    return this.request("GET", this.tradingUrl("/clock"));
  }

  async getCalendar(params?: {
    start?: string;
    end?: string;
  }): Promise<Record<string, string>[]> {
    return this.request(
      "GET",
      this.tradingUrl("/calendar"),
      undefined,
      params as Record<string, string>
    );
  }

  // ── Orders ──

  async createOrder(params: CreateOrderParams): Promise<Order> {
    return this.request("POST", this.tradingUrl("/orders"), {
      symbol: params.symbol,
      qty: params.qty,
      notional: params.notional,
      side: params.side,
      type: params.type ?? "market",
      time_in_force: params.time_in_force ?? "day",
      limit_price: params.limit_price,
      stop_price: params.stop_price,
      extended_hours: params.extended_hours,
    });
  }

  async listOrders(status?: string): Promise<Order[]> {
    return this.request("GET", this.tradingUrl("/orders"), undefined, {
      status: status ?? "open",
    });
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.request("GET", this.tradingUrl(`/orders/${orderId}`));
  }

  async getOrderByClientId(clientOrderId: string): Promise<Order> {
    return this.request(
      "GET",
      this.tradingUrl("/orders:by_client_order_id"),
      undefined,
      { client_order_id: clientOrderId }
    );
  }

  async replaceOrder(
    orderId: string,
    params: {
      qty?: string;
      limit_price?: string;
      stop_price?: string;
      time_in_force?: string;
    }
  ): Promise<Order> {
    return this.request(
      "PATCH",
      this.tradingUrl(`/orders/${orderId}`),
      params
    );
  }

  async cancelOrder(orderId: string): Promise<void> {
    return this.request("DELETE", this.tradingUrl(`/orders/${orderId}`));
  }

  async cancelAllOrders(): Promise<void> {
    return this.request("DELETE", this.tradingUrl("/orders"));
  }

  // ── Positions ──

  async listPositions(): Promise<Position[]> {
    return this.request("GET", this.tradingUrl("/positions"));
  }

  async getPosition(symbol: string): Promise<Position> {
    return this.request("GET", this.tradingUrl(`/positions/${symbol}`));
  }

  async closePosition(
    symbol: string,
    opts?: { qty?: string; percentage?: string }
  ): Promise<Order> {
    return this.request(
      "DELETE",
      this.tradingUrl(`/positions/${symbol}`),
      undefined,
      opts as Record<string, string>
    );
  }

  async closeAllPositions(cancelOrders = true): Promise<unknown[]> {
    return this.request(
      "DELETE",
      this.tradingUrl("/positions"),
      undefined,
      { cancel_orders: String(cancelOrders) }
    );
  }

  // ── Assets ──

  async listAssets(params?: {
    status?: string;
    asset_class?: string;
  }): Promise<Asset[]> {
    return this.request(
      "GET",
      this.tradingUrl("/assets"),
      undefined,
      params as Record<string, string>
    );
  }

  async getAsset(symbol: string): Promise<Asset> {
    return this.request("GET", this.tradingUrl(`/assets/${symbol}`));
  }

  // ── Watchlists ──

  async listWatchlists(): Promise<Record<string, unknown>[]> {
    return this.request("GET", this.tradingUrl("/watchlists"));
  }

  async createWatchlist(
    name: string,
    symbols: string[]
  ): Promise<Record<string, unknown>> {
    return this.request("POST", this.tradingUrl("/watchlists"), {
      name,
      symbols,
    });
  }

  async getWatchlist(id: string): Promise<Record<string, unknown>> {
    return this.request("GET", this.tradingUrl(`/watchlists/${id}`));
  }

  async updateWatchlist(
    id: string,
    params: { name?: string; symbols?: string[] }
  ): Promise<Record<string, unknown>> {
    return this.request("PUT", this.tradingUrl(`/watchlists/${id}`), params);
  }

  async addAssetToWatchlist(
    id: string,
    symbol: string
  ): Promise<Record<string, unknown>> {
    return this.request("POST", this.tradingUrl(`/watchlists/${id}`), {
      symbol,
    });
  }

  async removeAssetFromWatchlist(id: string, symbol: string): Promise<void> {
    return this.request(
      "DELETE",
      this.tradingUrl(`/watchlists/${id}/${symbol}`)
    );
  }

  async deleteWatchlist(id: string): Promise<void> {
    return this.request("DELETE", this.tradingUrl(`/watchlists/${id}`));
  }

  // ── Market Data ──

  async getBars(
    symbol: string,
    timeframe: string,
    opts?: { start?: string; end?: string; limit?: number }
  ): Promise<Bar[]> {
    const query: Record<string, string> = { timeframe };
    if (opts?.start) query.start = opts.start;
    if (opts?.end) query.end = opts.end;
    if (opts?.limit) query.limit = String(opts.limit);

    const resp = await this.request<{ bars: Bar[]; next_page_token?: string }>(
      "GET",
      this.dataUrlPath(`/stocks/${symbol}/bars`),
      undefined,
      query
    );
    return resp.bars;
  }

  async getTrades(
    symbol: string,
    opts?: { start?: string; end?: string; limit?: number }
  ): Promise<Record<string, unknown>> {
    const query: Record<string, string> = {};
    if (opts?.start) query.start = opts.start;
    if (opts?.end) query.end = opts.end;
    if (opts?.limit) query.limit = String(opts.limit);
    return this.request(
      "GET",
      this.dataUrlPath(`/stocks/${symbol}/trades`),
      undefined,
      query
    );
  }

  async getQuotes(
    symbol: string,
    opts?: { start?: string; end?: string; limit?: number }
  ): Promise<Record<string, unknown>> {
    const query: Record<string, string> = {};
    if (opts?.start) query.start = opts.start;
    if (opts?.end) query.end = opts.end;
    if (opts?.limit) query.limit = String(opts.limit);
    return this.request(
      "GET",
      this.dataUrlPath(`/stocks/${symbol}/quotes`),
      undefined,
      query
    );
  }

  async getLatestTrade(symbol: string): Promise<Trade> {
    const resp = await this.request<{ trade: Trade }>(
      "GET",
      this.dataUrlPath(`/stocks/${symbol}/trades/latest`)
    );
    return resp.trade;
  }

  async getLatestQuote(symbol: string): Promise<Quote> {
    const resp = await this.request<{ quote: Quote }>(
      "GET",
      this.dataUrlPath(`/stocks/${symbol}/quotes/latest`)
    );
    return resp.quote;
  }

  async getSnapshot(symbol: string): Promise<Snapshot> {
    return this.request(
      "GET",
      this.dataUrlPath(`/stocks/${symbol}/snapshot`)
    );
  }

  async getSnapshots(symbols: string): Promise<Record<string, Snapshot>> {
    return this.request("GET", this.dataUrlPath("/stocks/snapshots"), undefined, {
      symbols,
    });
  }

  // ── Corporate Actions ──

  async listCorporateActions(
    caTypes: string,
    since: string,
    until: string
  ): Promise<Record<string, unknown>[]> {
    return this.request(
      "GET",
      this.tradingUrl("/corporate_actions/announcements"),
      undefined,
      { ca_types: caTypes, since, until }
    );
  }

  // ── Options ──

  async listOptionContracts(params?: {
    underlying_symbols?: string;
    expiration_date?: string;
    type?: string;
    limit?: number;
  }): Promise<Record<string, unknown>> {
    const query: Record<string, string> = {};
    if (params?.underlying_symbols)
      query.underlying_symbols = params.underlying_symbols;
    if (params?.expiration_date)
      query.expiration_date = params.expiration_date;
    if (params?.type) query.type = params.type;
    if (params?.limit) query.limit = String(params.limit);
    return this.request(
      "GET",
      this.tradingUrl("/options/contracts"),
      undefined,
      query
    );
  }

  async getOptionContract(
    symbolOrId: string
  ): Promise<Record<string, unknown>> {
    return this.request(
      "GET",
      this.tradingUrl(`/options/contracts/${symbolOrId}`)
    );
  }
}
