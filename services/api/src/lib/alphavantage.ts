const BASE_URL = "https://www.alphavantage.co/query";

function apiKey(): string {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) throw new Error("ALPHAVANTAGE_API_KEY not configured");
  return key;
}

export interface CompanyOverview {
  Name: string;
  Sector: string;
  Industry: string;
  MarketCapitalization: string;
  PERatio: string;
  DividendYield: string;
  EPS: string;
  [key: string]: string;
}

export async function getCompanyOverview(
  symbol: string
): Promise<CompanyOverview> {
  const url = `${BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey()}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Alpha Vantage API error: ${res.status} ${res.statusText}`);
  return (await res.json()) as CompanyOverview;
}

export interface IncomeReport {
  fiscalDateEnding: string;
  totalRevenue: string;
  netIncome: string;
  [key: string]: string;
}

export interface IncomeStatementResponse {
  annualReports: IncomeReport[];
}

export async function getIncomeStatement(
  symbol: string
): Promise<IncomeStatementResponse> {
  const url = `${BASE_URL}?function=INCOME_STATEMENT&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey()}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Alpha Vantage API error: ${res.status} ${res.statusText}`);
  return (await res.json()) as IncomeStatementResponse;
}
