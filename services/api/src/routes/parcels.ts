import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getPool } from "../lib/db.js";
import { queryParcels as wfsQueryParcels } from "../lib/darecounty.js";

export const parcelsRouter = Router();
parcelsRouter.use(authMiddleware);

// ── Sync: fetch all parcels from GeoServer WFS into local DB ──

parcelsRouter.post("/sync", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }

  try {
    const pool = getPool();
    console.log("Starting parcel sync from GeoServer WFS...");

    // Fetch all parcels (paginated, ~48k records, ~10 seconds)
    const { parcels } = await wfsQueryParcels(null, 60000);
    console.log(`Fetched ${parcels.length} parcels from GeoServer`);

    // Upsert in batches
    let upserted = 0;
    const batchSize = 500;
    for (let i = 0; i < parcels.length; i += batchSize) {
      const batch = parcels.slice(i, i + batchSize);
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < batch.length; j++) {
        const p = batch[j];
        const offset = j * 28;
        placeholders.push(
          `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9},$${offset + 10},$${offset + 11},$${offset + 12},$${offset + 13},$${offset + 14},$${offset + 15},$${offset + 16},$${offset + 17},$${offset + 18},$${offset + 19},$${offset + 20},$${offset + 21},$${offset + 22},$${offset + 23},$${offset + 24},$${offset + 25},$${offset + 26},$${offset + 27},$${offset + 28})`
        );
        values.push(
          p.parcel, p.pin14 || p.pin, p.owner1, p.owner2,
          p.mailaddr1, p.mailaddr2, p.mailcity, p.mailstate, p.mailzip,
          p.stnum, p.stdir, p.stname, p.stsuffix, p.stapt,
          p.zipname, p.zip, p.subdivision, p.lotblksec,
          parseFloat(p.landval as string) || 0,
          parseFloat(p.bldgval as string) || 0,
          parseFloat(p.totval as string) || 0,
          p.calcacre ? parseFloat(p.calcacre as string) : null,
          p.puse, p.buildtype, p.yearbt, p.taxdistname, p.zoning, p.ownership
        );
      }

      await pool.query(
        `INSERT INTO parcels (parcel, pin, owner1, owner2, mailaddr1, mailaddr2, mailcity, mailstate, mailzip, stnum, stdir, stname, stsuffix, stapt, zipname, zip, subdivision, lotblksec, landval, bldgval, totval, calcacre, puse, buildtype, yearbt, taxdistname, zoning, ownership)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (parcel) DO UPDATE SET
           pin=EXCLUDED.pin, owner1=EXCLUDED.owner1, owner2=EXCLUDED.owner2,
           mailaddr1=EXCLUDED.mailaddr1, mailaddr2=EXCLUDED.mailaddr2,
           mailcity=EXCLUDED.mailcity, mailstate=EXCLUDED.mailstate, mailzip=EXCLUDED.mailzip,
           stnum=EXCLUDED.stnum, stdir=EXCLUDED.stdir, stname=EXCLUDED.stname,
           stsuffix=EXCLUDED.stsuffix, stapt=EXCLUDED.stapt,
           zipname=EXCLUDED.zipname, zip=EXCLUDED.zip, subdivision=EXCLUDED.subdivision,
           lotblksec=EXCLUDED.lotblksec, landval=EXCLUDED.landval, bldgval=EXCLUDED.bldgval,
           totval=EXCLUDED.totval, calcacre=EXCLUDED.calcacre,
           puse=EXCLUDED.puse, buildtype=EXCLUDED.buildtype, yearbt=EXCLUDED.yearbt,
           taxdistname=EXCLUDED.taxdistname, zoning=EXCLUDED.zoning, ownership=EXCLUDED.ownership,
           synced_at=NOW()`,
        values
      );
      upserted += batch.length;
    }

    console.log(`Synced ${upserted} parcels to local database`);
    res.json({ synced: upserted, total: parcels.length });
  } catch (err) {
    console.error("Parcel sync error:", err);
    const message = err instanceof Error ? err.message : "Sync failed";
    res.status(500).json({ error: message });
  }
});

// ── Stats: aggregate counts ──

parcelsRouter.get("/stats", async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json({ total: 0, towns: [], synced: false });
    return;
  }
  const pool = getPool();
  const total = await pool.query("SELECT count(*) as count FROM parcels");
  if (parseInt(total.rows[0].count) === 0) {
    res.json({ total: 0, towns: [], synced: false });
    return;
  }

  const towns = await pool.query(
    `SELECT zipname as town, count(*) as count,
            count(*) FILTER (WHERE TRIM(mailstate) NOT IN ('NC','')) as out_of_town,
            ROUND(AVG(totval)) as avg_value,
            count(*) FILTER (WHERE totval > 500000) as high_value
     FROM parcels WHERE zipname IS NOT NULL AND TRIM(zipname) != ''
     GROUP BY zipname ORDER BY count DESC`
  );

  const valueDist = await pool.query(
    `SELECT
       count(*) FILTER (WHERE totval < 250000) as under_250k,
       count(*) FILTER (WHERE totval >= 250000 AND totval < 500000) as v250_500k,
       count(*) FILTER (WHERE totval >= 500000 AND totval < 1000000) as v500k_1m,
       count(*) FILTER (WHERE totval >= 1000000 AND totval < 2000000) as v1m_2m,
       count(*) FILTER (WHERE totval >= 2000000) as over_2m
     FROM parcels`
  );

  res.json({
    total: parseInt(total.rows[0].count),
    synced: true,
    towns: towns.rows,
    valueDistribution: valueDist.rows[0],
  });
});

// ── Filter: advanced query with multiple criteria ──

parcelsRouter.get("/filter", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json({ total: 0, parcels: [] });
    return;
  }

  const pool = getPool();
  const {
    towns,          // comma-separated town names
    excludeTowns,   // comma-separated towns to exclude
    minValue,       // minimum total value
    maxValue,       // maximum total value
    outOfTownOnly,  // "true" = only non-NC mailing addresses
    search,         // owner name or address search
    limit = "100",
    offset = "0",
    sort = "totval",
    order = "desc",
  } = req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (towns) {
    const townList = towns.split(",").map((t) => t.trim().toUpperCase());
    conditions.push(`UPPER(TRIM(zipname)) IN (${townList.map(() => `$${paramIdx++}`).join(",")})`);
    params.push(...townList);
  }

  if (excludeTowns) {
    const excList = excludeTowns.split(",").map((t) => t.trim().toUpperCase());
    for (const t of excList) {
      conditions.push(`UPPER(TRIM(zipname)) != $${paramIdx++}`);
      params.push(t);
    }
  }

  if (minValue) {
    conditions.push(`totval >= $${paramIdx++}`);
    params.push(parseFloat(minValue));
  }

  if (maxValue) {
    conditions.push(`totval <= $${paramIdx++}`);
    params.push(parseFloat(maxValue));
  }

  if (outOfTownOnly === "true") {
    conditions.push(`TRIM(mailstate) NOT IN ('NC', '')`);
  }

  if (search) {
    conditions.push(`(owner1 ILIKE $${paramIdx} OR stname ILIKE $${paramIdx} OR subdivision ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const allowedSorts = ["totval", "owner1", "zipname", "parcel", "landval", "bldgval"];
  const sortCol = allowedSorts.includes(sort) ? sort : "totval";
  const sortDir = order === "asc" ? "ASC" : "DESC";

  const countResult = await pool.query(`SELECT count(*) as count FROM parcels ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const lim = Math.min(parseInt(limit) || 100, 5000);
  const off = parseInt(offset) || 0;

  const rows = await pool.query(
    `SELECT * FROM parcels ${where} ORDER BY ${sortCol} ${sortDir} NULLS LAST LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, lim, off]
  );

  // Town breakdown for the current filter
  const townBreakdown = await pool.query(
    `SELECT TRIM(zipname) as town, count(*) as count FROM parcels ${where} GROUP BY TRIM(zipname) ORDER BY count DESC`,
    params
  );

  res.json({
    total,
    parcels: rows.rows,
    towns: townBreakdown.rows,
    limit: lim,
    offset: off,
  });
});

// ── Search: quick text search ──

parcelsRouter.get("/search", async (req, res) => {
  const term = (req.query.term as string) || "";
  if (!term) {
    res.json([]);
    return;
  }

  if (!process.env.DATABASE_URL) {
    // Fallback to GeoServer
    const { searchParcels } = await import("../lib/darecounty.js");
    res.json(await searchParcels(term));
    return;
  }

  const pool = getPool();
  const result = await pool.query(
    `SELECT * FROM parcels
     WHERE owner1 ILIKE $1 OR parcel LIKE $2 OR stname ILIKE $1 OR pin LIKE $2
     ORDER BY totval DESC NULLS LAST LIMIT 100`,
    [`%${term}%`, `${term}%`]
  );
  res.json(result.rows);
});

// ── Export: CSV download ──

parcelsRouter.get("/export", async (req, res) => {
  // Same filter params as /filter but returns CSV
  const pool = getPool();
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not available" });
    return;
  }

  const { towns, excludeTowns, minValue, maxValue, outOfTownOnly, search } = req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (towns) {
    const townList = towns.split(",").map((t) => t.trim().toUpperCase());
    conditions.push(`UPPER(TRIM(zipname)) IN (${townList.map(() => `$${paramIdx++}`).join(",")})`);
    params.push(...townList);
  }
  if (excludeTowns) {
    for (const t of excludeTowns.split(",")) {
      conditions.push(`UPPER(TRIM(zipname)) != $${paramIdx++}`);
      params.push(t.trim().toUpperCase());
    }
  }
  if (minValue) { conditions.push(`totval >= $${paramIdx++}`); params.push(parseFloat(minValue)); }
  if (maxValue) { conditions.push(`totval <= $${paramIdx++}`); params.push(parseFloat(maxValue)); }
  if (outOfTownOnly === "true") { conditions.push(`TRIM(mailstate) NOT IN ('NC', '')`); }
  if (search) { conditions.push(`owner1 ILIKE $${paramIdx++}`); params.push(`%${search}%`); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await pool.query(`SELECT * FROM parcels ${where} ORDER BY totval DESC NULLS LAST`, params);

  const headers = "owner1,owner2,mailaddr1,mailaddr2,mailcity,mailstate,mailzip,parcel,pin,site_address,zipname,subdivision,totval\n";
  const csvRows = rows.rows.map((p: Record<string, unknown>) => {
    const site = [p.stnum, p.stdir, p.stname, p.stsuffix].filter((s) => s && String(s).trim()).join(" ");
    return [p.owner1, p.owner2, p.mailaddr1, p.mailaddr2, p.mailcity, p.mailstate, p.mailzip, p.parcel, p.pin, site, p.zipname, p.subdivision, p.totval]
      .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
      .join(",");
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=parcels-export.csv");
  res.send(headers + csvRows.join("\n"));
});

// ── Single parcel lookup ──

parcelsRouter.get("/parcel/:number", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    const { getParcel } = await import("../lib/darecounty.js");
    const parcel = await getParcel(req.params.number);
    if (!parcel) { res.status(404).json({ error: "Not found" }); return; }
    res.json(parcel);
    return;
  }
  const pool = getPool();
  const result = await pool.query("SELECT * FROM parcels WHERE parcel = $1", [req.params.number]);
  if (result.rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result.rows[0]);
});
