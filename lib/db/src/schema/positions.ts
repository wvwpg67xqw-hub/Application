import { pgTable, serial, text, boolean, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const positionsTable = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isOpen: boolean("is_open").notNull().default(true),
  discordRoleId: text("discord_role_id"),
  questions: json("questions").$type<string[]>().notNull().default([
    "Why do you want this position?",
    "What experience do you have?",
    "How active are you?",
    "What are your strengths?",
    "What are your weaknesses?",
    "Any additional information?",
  ]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPositionSchema = createInsertSchema(positionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positionsTable.$inferSelect;
