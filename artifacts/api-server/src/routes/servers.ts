import { Router } from "express";
import { db } from "@workspace/db";
import { serversTable, positionsTable, applicationsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

export const serversRouter = Router();

serversRouter.get("/", async (_req, res) => {
  const servers = await db.select().from(serversTable);

  const positionCounts = await db
    .select({ serverId: positionsTable.serverId, count: count() })
    .from(positionsTable)
    .where(eq(positionsTable.isOpen, true))
    .groupBy(positionsTable.serverId);

  const countMap = Object.fromEntries(positionCounts.map((r) => [r.serverId!, r.count]));

  res.json(
    servers.map((s) => ({
      id: s.id,
      guildId: s.guildId,
      serverName: s.serverName,
      serverLogo: s.serverLogo,
      openPositions: countMap[s.id] || 0,
    }))
  );
});

serversRouter.get("/:guildId/positions", async (req, res) => {
  const { guildId } = req.params;

  const [server] = await db.select().from(serversTable).where(eq(serversTable.guildId, guildId));
  if (!server) return res.status(404).json({ error: "Server not found" });

  const positions = await db
    .select()
    .from(positionsTable)
    .where(eq(positionsTable.serverId, server.id));

  const appCounts = await db
    .select({ positionId: applicationsTable.positionId, count: count() })
    .from(applicationsTable)
    .groupBy(applicationsTable.positionId);

  const countMap = Object.fromEntries(appCounts.map((r) => [r.positionId, r.count]));

  res.json({
    server: {
      id: server.id,
      guildId: server.guildId,
      serverName: server.serverName,
      serverLogo: server.serverLogo,
    },
    positions: positions.map((p) => ({
      ...p,
      applicationCount: countMap[p.id] || 0,
    })),
  });
});
