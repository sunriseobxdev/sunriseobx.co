const GEOSERVER_BASE =
  process.env.DARECOUNTY_GEOSERVER || "https://gs.darecountync.gov/geoserver";
const MAPS_BASE =
  process.env.DARECOUNTY_MAPS || "https://maps.darecountync.gov";
const WFS_PATH = "/Production/wfs";

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
  const resp = await fetch(url);
  return resp.json() as Promise<unknown[]>;
}

export async function searchOwners(term: string): Promise<unknown[]> {
  const url = `${MAPS_BASE}/mailSearch3.php?term=${encodeURIComponent(term)}`;
  const resp = await fetch(url);
  return resp.json() as Promise<unknown[]>;
}

export async function searchStreets(term: string): Promise<unknown[]> {
  const url = `${MAPS_BASE}/mailSearch.php?term=${encodeURIComponent(term)}`;
  const resp = await fetch(url);
  return resp.json() as Promise<unknown[]>;
}

export async function searchSubdivisions(term: string): Promise<unknown[]> {
  const url = `${MAPS_BASE}/mailSearch2.php?term=${encodeURIComponent(term)}`;
  const resp = await fetch(url);
  return resp.json() as Promise<unknown[]>;
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

  const resp = await fetch(`${GEOSERVER_BASE}${WFS_PATH}?${params}`);
  return resp.json() as Promise<WfsResponse>;
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
