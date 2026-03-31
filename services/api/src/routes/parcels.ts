import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  searchParcels,
  searchOwners,
  searchStreets,
  searchSubdivisions,
  queryParcels,
  getParcel,
} from "../lib/darecounty.js";

export const parcelsRouter = Router();

// All parcel routes require auth
parcelsRouter.use(authMiddleware);

// Autocomplete search
parcelsRouter.get("/search", async (req, res) => {
  try {
    const term = (req.query.term as string) || "";
    if (!term) {
      res.json([]);
      return;
    }
    const results = await searchParcels(term);
    res.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Parcel search error:", message);
    res.status(500).json({ error: message });
  }
});

// Owner autocomplete
parcelsRouter.get("/owners", async (req, res) => {
  const term = (req.query.term as string) || "";
  if (!term) {
    res.json([]);
    return;
  }
  const results = await searchOwners(term);
  res.json(results);
});

// Street autocomplete
parcelsRouter.get("/streets", async (req, res) => {
  const term = (req.query.term as string) || "";
  if (!term) {
    res.json([]);
    return;
  }
  const results = await searchStreets(term);
  res.json(results);
});

// Subdivision autocomplete
parcelsRouter.get("/subdivisions", async (req, res) => {
  const term = (req.query.term as string) || "";
  if (!term) {
    res.json([]);
    return;
  }
  const results = await searchSubdivisions(term);
  res.json(results);
});

// Get single parcel by number
parcelsRouter.get("/parcel/:number", async (req, res) => {
  const parcel = await getParcel(req.params.number);
  if (!parcel) {
    res.status(404).json({ error: "Parcel not found" });
    return;
  }
  res.json(parcel);
});

// Query parcels by owner
parcelsRouter.get("/by-owner", async (req, res) => {
  const name = (req.query.name as string) || "";
  const limit = parseInt((req.query.limit as string) || "1000", 10);
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const filter = `owner1 LIKE '%${name.toUpperCase().replace(/'/g, "''") }%'`;
  const result = await queryParcels(filter, limit);
  res.json(result);
});

// Query parcels by street
parcelsRouter.get("/by-street", async (req, res) => {
  const name = (req.query.name as string) || "";
  const limit = parseInt((req.query.limit as string) || "1000", 10);
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const filter = `stname LIKE '%${name.toUpperCase().replace(/'/g, "''")}%'`;
  const result = await queryParcels(filter, limit);
  res.json(result);
});

// Query parcels by subdivision
parcelsRouter.get("/by-subdivision", async (req, res) => {
  const name = (req.query.name as string) || "";
  const limit = parseInt((req.query.limit as string) || "1000", 10);
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const filter = `subdivision LIKE '%${name.toUpperCase().replace(/'/g, "''")}%'`;
  const result = await queryParcels(filter, limit);
  res.json(result);
});

// Query parcels by town
parcelsRouter.get("/by-town", async (req, res) => {
  const name = (req.query.name as string) || "";
  const limit = parseInt((req.query.limit as string) || "1000", 10);
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const filter = `zipname LIKE '%${name.toUpperCase().replace(/'/g, "''")}%'`;
  const result = await queryParcels(filter, limit);
  res.json(result);
});

// Raw CQL query
parcelsRouter.get("/query", async (req, res) => {
  const cql = req.query.cql as string;
  const limit = parseInt((req.query.limit as string) || "1000", 10);
  if (!cql) {
    res.status(400).json({ error: "cql is required" });
    return;
  }
  const result = await queryParcels(cql, limit);
  res.json(result);
});

// Dump all parcels (paginated)
parcelsRouter.get("/all", async (req, res) => {
  const limit = parseInt((req.query.limit as string) || "50000", 10);
  const result = await queryParcels(null, limit);
  res.json(result);
});
