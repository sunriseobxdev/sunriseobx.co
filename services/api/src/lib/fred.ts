const BASE_URL = "https://api.stlouisfed.org/fred";

function apiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY not configured");
  return key;
}

interface Observation {
  date: string;
  value: string;
}

interface FredObservationsResponse {
  observations: Observation[];
}

export async function getSeriesObservations(
  seriesId: string,
  limit = 10
): Promise<FredObservationsResponse> {
  const url = `${BASE_URL}/series/observations?series_id=${encodeURIComponent(seriesId)}&api_key=${apiKey()}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED API error: ${res.status} ${res.statusText}`);
  return (await res.json()) as FredObservationsResponse;
}

interface SeriesSummary {
  id: string;
  name: string;
  value: string;
  date: string;
  unit: string;
}

const MACRO_SERIES: { id: string; name: string; unit: string }[] = [
  { id: "FEDFUNDS", name: "Fed Funds Rate", unit: "%" },
  { id: "DGS10", name: "10-Year Treasury Yield", unit: "%" },
  { id: "CPIAUCSL", name: "Consumer Price Index", unit: "Index" },
  { id: "UNRATE", name: "Unemployment Rate", unit: "%" },
  { id: "GDP", name: "Gross Domestic Product", unit: "Billions $" },
  { id: "DGS2", name: "2-Year Treasury Yield", unit: "%" },
  { id: "T10Y2Y", name: "10Y-2Y Treasury Spread", unit: "%" },
];

export async function getMacroSummary(): Promise<{ series: SeriesSummary[] }> {
  const results = await Promise.all(
    MACRO_SERIES.map(async (s) => {
      const data = await getSeriesObservations(s.id, 1);
      const obs = data.observations[0];
      return {
        id: s.id,
        name: s.name,
        value: obs?.value ?? "N/A",
        date: obs?.date ?? "N/A",
        unit: s.unit,
      };
    })
  );
  return { series: results };
}
