import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, positionsTable, usersTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { sendApplicationEmbed } from "../lib/discord-bot";
import { logger } from "../lib/logger";
import { z } from "zod";

export const applicationsRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  next();
}

async function buildApplicationResponse(app: any, positionName: string, user: any) {
  return {
    id: app.id,
    positionId: app.positionId,
    positionName,
    userId: app.userId,
    applicantUsername: user.username,
    applicantDisplayName: user.displayName,
    applicantAvatar: user.avatar,
    applicantDiscordId: user.discordId,
    answers: app.answers,
    status: app.status,
    staffNote: app.staffNote,
    showNoteToUser: app.showNoteToUser,
    reviewedBy: app.reviewedBy,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
  };
}

applicationsRouter.get("/stats", requireAuth, async (req, res) => {
  const user = req.user as any;
  const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.userId, user.id));

  res.json({
    total: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    underReview: apps.filter((a) => a.status === "under_review").length,
    accepted: apps.filter((a) => a.status === "accepted").length,
    denied: apps.filter((a) => a.status === "denied").length,
  });
});

applicationsRouter.get("/", requireAuth, async (req, res) => {
  const user = req.user as any;
  const apps = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.userId, user.id));

  const positions = await db.select().from(positionsTable);
  const posMap = Object.fromEntries(positions.map((p) => [p.id, p]));

  const result = apps.map((app) => ({
    id: app.id,
    positionId: app.positionId,
    positionName: posMap[app.positionId]?.name || "Unknown",
    userId: app.userId,
    applicantUsername: user.username,
    applicantDisplayName: user.displayName,
    applicantAvatar: user.avatar,
    applicantDiscordId: user.discordId,
    answers: app.answers,
    status: app.status,
    staffNote: app.showNoteToUser ? app.staffNote : null,
    showNoteToUser: app.showNoteToUser,
    reviewedBy: app.reviewedBy,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
  }));

  res.json(result);
});

applicationsRouter.post("/", requireAuth, async (req, res) => {
  const user = req.user as any;
  const schema = z.object({
    positionId: z.number().int().positive(),
    answers: z.record(z.string(), z.string()),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { positionId, answers } = parsed.data;

  const [position] = await db.select().from(positionsTable).where(eq(positionsTable.id, positionId));
  if (!position) return res.status(404).json({ error: "Position not found" });
  if (!position.isOpen) return res.status(400).json({ error: "Position is closed" });

  const existing = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.userId, user.id), eq(applicationsTable.positionId, positionId)))
    .then((r) => r[0]);

  if (existing) return res.status(409).json({ error: "You have already applied for this position" });

  const [app] = await db
    .insert(applicationsTable)
    .values({ positionId, userId: user.id, answers })
    .returning();

  // Send Discord embed (fire and forget)
  sendApplicationEmbed(
    app.id,
    { username: user.username, displayName: user.displayName, discordId: user.discordId, avatar: user.avatar },
    { name: position.name },
    answers,
    position.questions as string[]
  ).catch((err) => logger.error({ err }, "Failed to send application embed"));

  res.status(201).json(await buildApplicationResponse(app, position.name, user));
});

applicationsRouter.get("/:id", requireAuth, async (req, res) => {
  const user = req.user as any;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id));
  if (!app) return res.status(404).json({ error: "Application not found" });
  if (app.userId !== user.id && !["admin", "developer", "owner"].includes(user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const [position] = await db.select().from(positionsTable).where(eq(positionsTable.id, app.positionId));
  const [applicant] = await db.select().from(usersTable).where(eq(usersTable.id, app.userId));

  const isAdmin = ["admin", "developer", "owner"].includes(user.role);

  res.json({
    id: app.id,
    positionId: app.positionId,
    positionName: position?.name || "Unknown",
    userId: app.userId,
    applicantUsername: applicant?.username || "",
    applicantDisplayName: applicant?.displayName || "",
    applicantAvatar: applicant?.avatar || null,
    applicantDiscordId: applicant?.discordId || "",
    answers: app.answers,
    status: app.status,
    staffNote: isAdmin || app.showNoteToUser ? app.staffNote : null,
    showNoteToUser: app.showNoteToUser,
    reviewedBy: app.reviewedBy,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
  });
});
