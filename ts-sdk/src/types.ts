export interface Account {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: string;
  buying_power: string;
  portfolio_value: string;
  equity: string;
  long_market_value: string;
  short_market_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  created_at: string;
  daytrade_count: number;
}

export type OrderSide = "buy" | "sell";
export type OrderType =
  | "market"
  | "limit"
  | "stop"
  | "stop_limit"
  | "trailing_stop";
export type TimeInForce = "day" | "gtc" | "opg" | "cls" | "ioc" | "fok";
export type OrderStatus =
  | "new"
  | "partially_filled"
  | "filled"
  | "done_for_day"
  | "canceled"
  | "expired"
  | "replaced"
  | "pending_cancel"
  | "pending_replace"
  | "accepted"
  | "pending_new"
  | "rejected"
  | "suspended"
  | "held";

export interface Order {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  symbol: string;
  qty: string | null;
  filled_qty: string | null;
  filled_avg_price: string | null;
  order_type: string;
  side: OrderSide;
  time_in_force: TimeInForce;
  limit_price: string | null;
  stop_price: string | null;
  status: OrderStatus;
  extended_hours: boolean;
}

export interface CreateOrderParams {
  symbol: string;
  qty?: string;
  notional?: string;
  side: OrderSide;
  type?: OrderType;
  time_in_force?: TimeInForce;
  limit_price?: string;
  stop_price?: string;
  extended_hours?: boolean;
}

export interface Position {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string | null;
  cost_basis: string;
  unrealized_pl: string | null;
  current_price: string | null;
}

export interface Asset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string | null;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  fractionable: boolean;
}

export interface Clock {
  timestamp: string;
  is_open: boolean;
  next_open: string;
  next_close: string;
}

export interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n?: number;
  vw?: number;
}

export interface Trade {
  t: string;
  x?: string;
  p: number;
  s: number;
  c?: string[];
}

export interface Quote {
  t: string;
  ap: number;
  as: number;
  bp: number;
  bs: number;
  ax?: string;
  bx?: string;
}

export interface Snapshot {
  latestTrade: Trade | null;
  latestQuote: Quote | null;
  minuteBar: Bar | null;
  dailyBar: Bar | null;
  prevDailyBar: Bar | null;
}

export interface StreamConfig {
  trades?: string[];
  quotes?: string[];
  bars?: string[];
}

export type StreamEventType = "trade" | "quote" | "bar";

export interface StreamEvent {
  type: StreamEventType;
  symbol: string;
  data: Trade | Quote | Bar;
}

export interface AlpacaClientConfig {
  keyId: string;
  secretKey: string;
  paper?: boolean;
  baseUrl?: string;
  dataUrl?: string;
  wsUrl?: string;
}
