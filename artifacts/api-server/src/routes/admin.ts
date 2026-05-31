import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, positionsTable, usersTable, serversTable } from "@workspace/db";
import { eq, count, sql, desc, and } from "drizzle-orm";
import { z } from "zod";
import { logger } from "../lib/logger";

export const adminRouter = Router();

const ADMIN_ROLES = ["admin", "developer", "owner"];

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (!ADMIN_ROLES.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  next();
}

async function buildApplicationResponse(app: any, position: any, applicant: any) {
  return {
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
    staffNote: app.staffNote,
    showNoteToUser: app.showNoteToUser,
    reviewedBy: app.reviewedBy,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
  };
}

// Admin: list all applications with filters
adminRouter.get("/applications", requireAdmin, async (req, res) => {
  const { status, positionId } = req.query;

  let query = db.select().from(applicationsTable);

  const conditions = [];
  if (status) conditions.push(eq(applicationsTable.status, status as string));
  if (positionId) conditions.push(eq(applicationsTable.positionId, parseInt(positionId as string)));

  const apps = conditions.length > 0
    ? await db.select().from(applicationsTable).where(conditions.length === 1 ? conditions[0] : and(...conditions)).orderBy(desc(applicationsTable.submittedAt))
    : await db.select().from(applicationsTable).orderBy(desc(applicationsTable.submittedAt));

  const positions = await db.select().from(positionsTable);
  const users = await db.select().from(usersTable);

  const posMap = Object.fromEntries(positions.map((p) => [p.id, p]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const result = apps.map((app) => ({
    id: app.id,
    positionId: app.positionId,
    positionName: posMap[app.positionId]?.name || "Unknown",
    userId: app.userId,
    applicantUsername: userMap[app.userId]?.username || "",
    applicantDisplayName: userMap[app.userId]?.displayName || "",
    applicantAvatar: userMap[app.userId]?.avatar || null,
    applicantDiscordId: userMap[app.userId]?.discordId || "",
    answers: app.answers,
    status: app.status,
    staffNote: app.staffNote,
    showNoteToUser: app.showNoteToUser,
    reviewedBy: app.reviewedBy,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
  }));

  res.json(result);
});

// Admin: review application
adminRouter.patch("/applications/:id/review", requireAdmin, async (req, res) => {
  const reviewer = req.user as any;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const schema = z.object({
    status: z.enum(["accepted", "denied", "under_review", "pending"]),
    staffNote: z.string().optional(),
    showNoteToUser: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { status, staffNote, showNoteToUser } = parsed.data;

  const [app] = await db
    .update(applicationsTable)
    .set({
      status,
      staffNote: staffNote ?? null,
      showNoteToUser: showNoteToUser ?? false,
      reviewedBy: reviewer.displayName || reviewer.username,
      reviewedAt: new Date(),
    })
    .where(eq(applicationsTable.id, id))
    .returning();

  if (!app) return res.status(404).json({ error: "Application not found" });

  const [position] = await db.select().from(positionsTable).where(eq(positionsTable.id, app.positionId));
  const [applicant] = await db.select().from(usersTable).where(eq(usersTable.id, app.userId));

  res.json(await buildApplicationResponse(app, position, applicant));
});

// Admin: list all positions
adminRouter.get("/positions", requireAdmin, async (_req, res) => {
  const positions = await db.select().from(positionsTable);
  const appCounts = await db
    .select({ positionId: applicationsTable.positionId, count: count() })
    .from(applicationsTable)
    .groupBy(applicationsTable.positionId);

  const countMap = Object.fromEntries(appCounts.map((r) => [r.positionId, r.count]));
  res.json(positions.map((p) => ({ ...p, applicationCount: countMap[p.id] || 0 })));
});

// Admin: create position
adminRouter.post("/positions", requireAdmin, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    description: z.string(),
    discordRoleId: z.string().optional(),
    questions: z.array(z.string()).optional(),
    isOpen: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { name, description, discordRoleId, questions, isOpen } = parsed.data;

  const [position] = await db
    .insert(positionsTable)
    .values({
      name,
      description,
      discordRoleId: discordRoleId || null,
      questions: questions || [
        "Why do you want this position?",
        "What experience do you have?",
        "How active are you?",
        "What are your strengths?",
        "What are your weaknesses?",
        "Any additional information?",
      ],
      isOpen: isOpen ?? true,
    })
    .returning();

  res.status(201).json({ ...position, applicationCount: 0 });
});

// Admin: update position
adminRouter.patch("/positions/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const schema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    discordRoleId: z.string().optional(),
    questions: z.array(z.string()).optional(),
    isOpen: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const updateData: any = { ...parsed.data, updatedAt: new Date() };

  const [position] = await db
    .update(positionsTable)
    .set(updateData)
    .where(eq(positionsTable.id, id))
    .returning();

  if (!position) return res.status(404).json({ error: "Position not found" });

  const [appCount] = await db
    .select({ count: count() })
    .from(applicationsTable)
    .where(eq(applicationsTable.positionId, id));

  res.json({ ...position, applicationCount: appCount?.count || 0 });
});

// Admin: delete position
adminRouter.delete("/positions/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  await db.delete(applicationsTable).where(eq(applicationsTable.positionId, id));
  const [deleted] = await db.delete(positionsTable).where(eq(positionsTable.id, id)).returning();

  if (!deleted) return res.status(404).json({ error: "Position not found" });
  res.json({ success: true });
});

// Admin: stats
adminRouter.get("/stats", requireAdmin, async (_req, res) => {
  const apps = await db.select().from(applicationsTable);
  const positions = await db.select().from(positionsTable);
  const uniqueApplicants = new Set(apps.map((a) => a.userId)).size;

  const recent = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.submittedAt))
    .limit(5);

  const posMap = Object.fromEntries(positions.map((p) => [p.id, p]));
  const users = await db.select().from(usersTable);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const recentMapped = recent.map((app) => ({
    id: app.id,
    positionId: app.positionId,
    positionName: posMap[app.positionId]?.name || "Unknown",
    userId: app.userId,
    applicantUsername: userMap[app.userId]?.username || "",
    applicantDisplayName: userMap[app.userId]?.displayName || "",
    applicantAvatar: userMap[app.userId]?.avatar || null,
    applicantDiscordId: userMap[app.userId]?.discordId || "",
    answers: app.answers,
    status: app.status,
    staffNote: app.staffNote,
    showNoteToUser: app.showNoteToUser,
    reviewedBy: app.reviewedBy,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
  }));

  res.json({
    totalApplications: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    underReview: apps.filter((a) => a.status === "under_review").length,
    accepted: apps.filter((a) => a.status === "accepted").length,
    denied: apps.filter((a) => a.status === "denied").length,
    openPositions: positions.filter((p) => p.isOpen).length,
    totalPositions: positions.length,
    totalApplicants: uniqueApplicants,
    recentApplications: recentMapped,
  });
});

// Admin: get server settings
adminRouter.get("/settings", requireAdmin, async (_req, res) => {
  const [server] = await db.select().from(serversTable).limit(1);
  if (!server) {
    return res.json({
      serverName: process.env.DISCORD_SERVER_NAME || "Discord Server",
      serverLogo: process.env.DISCORD_SERVER_LOGO || null,
      guildId: process.env.DISCORD_GUILD_ID || "",
      reviewChannelId: process.env.DISCORD_REVIEW_CHANNEL_ID || null,
      ownerRoleId: process.env.DISCORD_OWNER_ROLE_ID || null,
      developerRoleId: process.env.DISCORD_DEVELOPER_ROLE_ID || null,
    });
  }
  res.json(server);
});

// Admin: update server settings
adminRouter.patch("/settings", requireAdmin, async (req, res) => {
  const schema = z.object({
    serverName: z.string().optional(),
    serverLogo: z.string().optional(),
    reviewChannelId: z.string().optional(),
    ownerRoleId: z.string().optional(),
    developerRoleId: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const guildId = process.env.DISCORD_GUILD_ID || "default";
  const [existing] = await db.select().from(serversTable).limit(1);

  let server;
  if (existing) {
    [server] = await db
      .update(serversTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(serversTable.id, existing.id))
      .returning();
  } else {
    [server] = await db
      .insert(serversTable)
      .values({
        guildId,
        serverName: parsed.data.serverName || "Discord Server",
        serverLogo: parsed.data.serverLogo || null,
        reviewChannelId: parsed.data.reviewChannelId || null,
        ownerRoleId: parsed.data.ownerRoleId || null,
        developerRoleId: parsed.data.developerRoleId || null,
      })
      .returning();
  }

  res.json(server);
});
