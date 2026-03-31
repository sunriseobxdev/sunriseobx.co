const BASE_URL = "https://finnhub.io/api/v1";

function token(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not configured");
  return key;
}

export interface CompanyNewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image: string;
}

export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<CompanyNewsItem[]> {
  const url = `${BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${token()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub API error: ${res.status} ${res.statusText}`);
  return (await res.json()) as CompanyNewsItem[];
}

export interface EarningsEntry {
  symbol: string;
  date: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
}

export interface EarningsCalendarResponse {
  earningsCalendar: EarningsEntry[];
}

export async function getEarningsCalendar(
  from: string,
  to: string
): Promise<EarningsCalendarResponse> {
  const url = `${BASE_URL}/calendar/earnings?from=${from}&to=${to}&token=${token()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub API error: ${res.status} ${res.statusText}`);
  return (await res.json()) as EarningsCalendarResponse;
}

export interface InsiderTransaction {
  name: string;
  share: number;
  change: number;
  transactionDate: string;
  transactionCode: string;
}

export interface InsiderTransactionsResponse {
  data: InsiderTransaction[];
}

export async function getInsiderTransactions(
  symbol: string
): Promise<InsiderTransactionsResponse> {
  const url = `${BASE_URL}/stock/insider-transactions?symbol=${encodeURIComponent(symbol)}&token=${token()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub API error: ${res.status} ${res.statusText}`);
  return (await res.json()) as InsiderTransactionsResponse;
}
