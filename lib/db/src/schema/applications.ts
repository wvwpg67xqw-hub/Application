import { pgTable, serial, text, boolean, timestamp, json, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { positionsTable } from "./positions";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").notNull().references(() => positionsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  answers: json("answers").$type<Record<string, string>>().notNull().default({}),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  staffNote: text("staff_note"),
  showNoteToUser: boolean("show_note_to_user").notNull().default(false),
  reviewedBy: text("reviewed_by"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, submittedAt: true, reviewedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
