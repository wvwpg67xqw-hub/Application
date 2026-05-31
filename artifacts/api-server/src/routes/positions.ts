import { Router } from "express";
import { db } from "@workspace/db";
import { positionsTable, applicationsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

export const positionsRouter = Router();

positionsRouter.get("/", async (_req, res) => {
  const rows = await db.select().from(positionsTable).where(eq(positionsTable.isOpen, true));
  const appCounts = await db
    .select({ positionId: applicationsTable.positionId, count: count() })
    .from(applicationsTable)
    .groupBy(applicationsTable.positionId);

  const countMap = Object.fromEntries(appCounts.map((r) => [r.positionId, r.count]));

  res.json(
    rows.map((p) => ({
      ...p,
      applicationCount: countMap[p.id] || 0,
    }))
  );
});

positionsRouter.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const [position] = await db.select().from(positionsTable).where(eq(positionsTable.id, id));
  if (!position) return res.status(404).json({ error: "Position not found" });

  const [appCount] = await db
    .select({ count: count() })
    .from(applicationsTable)
    .where(eq(applicationsTable.positionId, id));

  res.json({ ...position, applicationCount: appCount?.count || 0 });
});
