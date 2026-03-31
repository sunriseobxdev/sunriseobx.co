import type { StreamConfig, StreamEvent } from "./types.js";

const PAPER_WS = "wss://paper-api.alpaca.markets/stream";
const LIVE_WS = "wss://api.alpaca.markets/stream";
const DATA_WS_IEX = "wss://stream.data.alpaca.markets/v2/iex";

export type StreamEventHandler = (event: StreamEvent) => void;
export type ErrorHandler = (error: Error) => void;

export interface AlpacaStreamConfig {
  keyId: string;
  secretKey: string;
  paper?: boolean;
  dataFeed?: "iex" | "sip";
}

/**
 * WebSocket streaming client for real-time market data and trade updates.
 * Works in both browser and Node.js (Node.js 21+ has native WebSocket,
 * or use a polyfill like `ws` assigned to globalThis.WebSocket).
 */
export class AlpacaStream {
  private keyId: string;
  private secretKey: string;
  private tradingWsUrl: string;
  private dataWsUrl: string;
  private tradingWs: WebSocket | null = null;
  private dataWs: WebSocket | null = null;
  private handlers: Map<string, StreamEventHandler[]> = new Map();
  private errorHandler: ErrorHandler = (e) => console.error("AlpacaStream error:", e);

  constructor(config: AlpacaStreamConfig) {
    this.keyId = config.keyId;
    this.secretKey = config.secretKey;
    this.tradingWsUrl = config.paper !== false ? PAPER_WS : LIVE_WS;
    const feed = config.dataFeed ?? "iex";
    this.dataWsUrl = `wss://stream.data.alpaca.markets/v2/${feed}`;
  }

  onError(handler: ErrorHandler): this {
    this.errorHandler = handler;
    return this;
  }

  on(event: string, handler: StreamEventHandler): this {
    const existing = this.handlers.get(event) ?? [];
    existing.push(handler);
    this.handlers.set(event, existing);
    return this;
  }

  async subscribeTradeUpdates(): Promise<void> {
    this.tradingWs = this.createAuthenticatedWs(this.tradingWsUrl, (msg) => {
      const data = JSON.parse(msg);
      if (data.stream === "trade_updates") {
        const handlers = this.handlers.get("trade_update") ?? [];
        for (const handler of handlers) {
          handler({
            type: "trade",
            symbol: data.data?.order?.symbol ?? "",
            data: data.data,
          });
        }
      }
    });
    await this.waitForAuth(this.tradingWs);
    this.tradingWs.send(
      JSON.stringify({
        action: "listen",
        data: { streams: ["trade_updates"] },
      })
    );
  }

  async subscribeMarketData(config: StreamConfig): Promise<void> {
    this.dataWs = this.createAuthenticatedWs(this.dataWsUrl, (msg) => {
      const messages: unknown[] = JSON.parse(msg);
      for (const m of messages) {
        const rec = m as Record<string, unknown>;
        const T = rec.T as string;
        if (T === "t") {
          this.emit("trade", { type: "trade", symbol: rec.S as string, data: rec as never });
        } else if (T === "q") {
          this.emit("quote", { type: "quote", symbol: rec.S as string, data: rec as never });
        } else if (T === "b") {
          this.emit("bar", { type: "bar", symbol: rec.S as string, data: rec as never });
        }
      }
    });
    await this.waitForAuth(this.dataWs);
    this.dataWs.send(
      JSON.stringify({
        action: "subscribe",
        trades: config.trades ?? [],
        quotes: config.quotes ?? [],
        bars: config.bars ?? [],
      })
    );
  }

  close(): void {
    this.tradingWs?.close();
    this.dataWs?.close();
    this.tradingWs = null;
    this.dataWs = null;
  }

  private emit(event: string, data: StreamEvent): void {
    const handlers = this.handlers.get(event) ?? [];
    for (const handler of handlers) {
      handler(data);
    }
  }

  private createAuthenticatedWs(
    url: string,
    onMessage: (msg: string) => void
  ): WebSocket {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          action: "auth",
          key: this.keyId,
          secret: this.secretKey,
        })
      );
    };

    ws.onmessage = (event) => {
      onMessage(typeof event.data === "string" ? event.data : "");
    };

    ws.onerror = (event) => {
      this.errorHandler(new Error(`WebSocket error: ${event}`));
    };

    return ws;
  }

  private waitForAuth(ws: WebSocket): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Auth timeout")), 10000);
      const origOnMessage = ws.onmessage;
      ws.onmessage = (event) => {
        const data = typeof event.data === "string" ? event.data : "";
        try {
          const msgs = JSON.parse(data);
          const arr = Array.isArray(msgs) ? msgs : [msgs];
          for (const msg of arr) {
            if (msg.T === "success" && msg.msg === "authenticated") {
              clearTimeout(timeout);
              ws.onmessage = origOnMessage;
              resolve();
              return;
            }
            if (msg.T === "error") {
              clearTimeout(timeout);
              reject(new Error(`Auth failed: ${msg.msg}`));
              return;
            }
          }
        } catch {
          // ignore parse errors during auth handshake
        }
      };
    });
  }
}
