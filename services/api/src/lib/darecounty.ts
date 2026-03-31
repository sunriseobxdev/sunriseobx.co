import https from "https";
import dns from "dns";

// Fix GKE kube-dns ndots:5 issue — prefer IPv4 and use resolve4 directly
dns.setDefaultResultOrder("ipv4first");

const GEOSERVER_BASE =
  process.env.DARECOUNTY_GEOSERVER || "https://gs.darecountync.gov/geoserver";
const MAPS_BASE =
  process.env.DARECOUNTY_MAPS || "https://maps.darecountync.gov";
const WFS_PATH = "/Production/wfs";

// Use Node.js https module with DNS lookup override for reliability in GKE
function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      port: 443,
      timeout: 15000,
      headers: { "Host": parsed.hostname },
      lookup: dns.lookup,
    };
    const req = https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function fetchJson(url: string): Promise<unknown> {
  const text = await httpGet(url);
  return JSON.parse(text);
}

const PARCEL_PROPERTIES = [
  "parcel", "pin14", "owner1", "owner2",
  "mailaddr1", "mailaddr2", "mailcity", "mailstate", "mailzip",
  "stnum", "stdir", "stname", "stsuffix", "stapt",
  "zipname", "zip", "subdivision", "lotblksec",
  "landval", "bldgval", "totval", "calcacre",
  "puse", "buildtype", "yearbt", "taxdistname", "zoning", "ownership",
].join(",");

export async function searchParcels(term: string): Promise<unknown[]> {
  const url = `${MAPS_BASE}/searchData.php?term=${encodeURIComponent(term)}`;
  return fetchJson(url) as Promise<unknown[]>;
}

export async function searchOwners(term: string): Promise<unknown[]> {
  const url = `${MAPS_BASE}/mailSearch3.php?term=${encodeURIComponent(term)}`;
  return fetchJson(url) as Promise<unknown[]>;
}

export async function searchStreets(term: string): Promise<unknown[]> {
  const url = `${MAPS_BASE}/mailSearch.php?term=${encodeURIComponent(term)}`;
  return fetchJson(url) as Promise<unknown[]>;
}

export async function searchSubdivisions(term: string): Promise<unknown[]> {
  const url = `${MAPS_BASE}/mailSearch2.php?term=${encodeURIComponent(term)}`;
  return fetchJson(url) as Promise<unknown[]>;
}

interface WfsResponse {
  totalFeatures?: number;
  features: Array<{ properties: Record<string, unknown> }>;
}

async function wfsQuery(
  cqlFilter: string | null,
  maxFeatures: number,
  startIndex: number
): Promise<WfsResponse> {
  const params = new URLSearchParams({
    service: "WFS",
    version: "1.1.0",
    request: "GetFeature",
    typeName: "Production:gis_polygons",
    outputFormat: "application/json",
    propertyName: PARCEL_PROPERTIES,
    maxFeatures: maxFeatures.toString(),
    startIndex: startIndex.toString(),
  });
  if (cqlFilter) {
    params.set("CQL_FILTER", cqlFilter);
  }

  return fetchJson(`${GEOSERVER_BASE}${WFS_PATH}?${params}`) as Promise<WfsResponse>;
}

export async function queryParcels(
  cqlFilter: string | null,
  maxFeatures = 1000
): Promise<{ totalFeatures: number; parcels: Record<string, unknown>[] }> {
  const pageSize = maxFeatures > 1000 ? 1000 : maxFeatures;
  const parcels: Record<string, unknown>[] = [];
  let startIndex = 0;
  let total = 0;

  while (true) {
    const fc = await wfsQuery(cqlFilter, pageSize, startIndex);
    total = fc.totalFeatures ?? parcels.length + fc.features.length;
    for (const f of fc.features) {
      parcels.push(f.properties);
    }
    if (fc.features.length < pageSize || parcels.length >= maxFeatures) break;
    startIndex += pageSize;
  }

  return { totalFeatures: total, parcels };
}

export async function getParcel(
  parcelNumber: string
): Promise<Record<string, unknown> | null> {
  const fc = await wfsQuery(`parcel='${parcelNumber}'`, 1, 0);
  return fc.features.length > 0 ? fc.features[0].properties : null;
}
