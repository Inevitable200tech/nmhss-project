import mongoose, { Connection } from "mongoose";
import { MediaDatabaseModel } from "@shared/schema";

export const mediaConnections: Map<string, { conn: Connection; name: string }> = new Map();
const MAX_DB_CAPACITY_MB = 512;

export async function loadMediaDBs() {
  const dbs = await MediaDatabaseModel.find();
  const numDBs = dbs.length;

  // Hard cap at 80 DBs
  const DB_CAP = 80;
  if (numDBs > DB_CAP) {
    console.error(`[MEDIA-DB] ❌ Too many DBs (${numDBs}). Cap is ${DB_CAP}. Refusing to connect.`);
    throw new Error(`Exceeded DB cap of ${DB_CAP}`);
  }

  const MAX_POOL = 10;
  const MIN_POOL = 2;

  // Scale pool inversely with DB count, reaching MIN_POOL by 80 DBs
  const poolSize = Math.max(
    MIN_POOL,
    Math.floor(MAX_POOL - (numDBs / DB_CAP) * (MAX_POOL - MIN_POOL))
  );

  console.log(
    `[MEDIA-DB] Preparing to connect to ${numDBs} DB(s) with poolSize=${poolSize}`
  );

  for (const db of dbs) {
    if (!mediaConnections.has(db.name)) {
      try {
        const conn = await mongoose.createConnection(db.uri, {
          maxPoolSize: poolSize,
          minPoolSize: 1,
        }).asPromise();

        mediaConnections.set(db.name, { conn, name: db.name });
        console.log(`[MEDIA-DB] Connected to ${db.name} (poolSize=${poolSize})`);
      } catch (err) {
        console.error(`[MEDIA-DB] Failed to connect to ${db.uri}`, err);
      }
    }
  }
}


export async function reloadMediaDBs() {
  for (const { conn } of Array.from(mediaConnections.values())) {
    await conn.close();
  }
  mediaConnections.clear();
  await loadMediaDBs();
  console.log("[MEDIA-DB] Reloaded all media DB connections");
}

export async function getBestMediaDB(fileSizeBytes: number): Promise<Connection> {
  if (mediaConnections.size === 0) {
    throw new Error("No media DB connections available.");
  }

  let bestConn: Connection | null = null;
  let maxFreeMB = -1;

  console.log(
    `[MEDIA-DB] Evaluating best DB for file size ${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
  );

  for (const { conn, name } of Array.from(mediaConnections.values())) {
    try {
      if (!conn.db) {
        console.warn(`[MEDIA-DB][${name}] No db instance found, skipping`);
        continue;
      }

      let allocatedMB: number;
      let logicalMB: number;

      try {
        const stats = await conn.db.command({ dbStats: 1 });
        logicalMB = stats.dataSize / (1024 * 1024);     // ✅ FIX: use dataSize
        allocatedMB = stats.storageSize / (1024 * 1024);

        console.log(
          `[MEDIA-DB][${name}] dbStats OK → logical=${logicalMB.toFixed(
            2
          )} MB, allocated=${allocatedMB.toFixed(2)} MB`
        );
      } catch (dbStatsErr) {
        console.warn(
          `[MEDIA-DB][${name}] dbStats failed, falling back to collStats`,
          dbStatsErr
        );

        const chunkStats = await conn.db.command({ collStats: "media.chunks" });
        logicalMB = chunkStats.size / (1024 * 1024);
        allocatedMB = chunkStats.storageSize / (1024 * 1024);

        console.log(
          `[MEDIA-DB][${name}] collStats fallback → logical=${logicalMB.toFixed(
            2
          )} MB, allocated=${allocatedMB.toFixed(2)} MB`
        );
      }

      const freeMB = MAX_DB_CAPACITY_MB - allocatedMB;
      console.log(`[MEDIA-DB][${name}] Free space ≈ ${freeMB.toFixed(2)} MB`);

      if (freeMB * 1024 * 1024 > fileSizeBytes && freeMB > maxFreeMB) {
        bestConn = conn;
        maxFreeMB = freeMB;
        console.log(`[MEDIA-DB][${name}] ✅ Selected as current best candidate`);
      }
    } catch (err) {
      console.error(`[MEDIA-DB][${name}] ERROR fetching stats:`, err);
    }
  }

  if (!bestConn) {
    console.error(`[MEDIA-DB] ❌ No DB has enough free space for this file`);
    throw new Error("No media DB has enough free space for this file.");
  }

  console.log(
    `[MEDIA-DB] ✅ Final choice: ${bestConn.name} with ~${maxFreeMB.toFixed(
      2
    )} MB free`
  );
  return bestConn;
}





