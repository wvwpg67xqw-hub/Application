import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import * as schema from "./schema/index.js";
import { serversTable, positionsTable } from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const SERVERS = [
  {
    guildId: "1238248843968122952",
    serverName: "Plain Promotions",
    serverLogo: "https://cdn.discordapp.com/icons/1238248843968122952/400c103ac9cef5fb77a08f2710304b24.webp?size=256",
  },
  {
    guildId: "1160258234083450970",
    serverName: "Advertises Legends",
    serverLogo: "https://cdn.discordapp.com/icons/1160258234083450970/3dbc96a7d3484a7edcff65a6bcb1c1cc.webp?size=256",
  },
  {
    guildId: "1308214357725020240",
    serverName: "Devil Advertising",
    serverLogo: "https://cdn.discordapp.com/icons/1308214357725020240/74dd4c7bafe6661c1c0273d7acef5ed7.webp?size=256",
  },
  {
    guildId: "1488364715108466841",
    serverName: "Prime Promotions",
    serverLogo: "https://cdn.discordapp.com/icons/1488364715108466841/8c1e8a537f5069857644cc8158fd335a.webp?size=256",
  },
];

const DEFAULT_QUESTIONS = [
  "Why do you want this position?",
  "What experience do you have?",
  "How active are you on Discord?",
  "What are your strengths?",
  "What are your weaknesses?",
  "Anything else you'd like us to know?",
];

async function seed() {
  console.log("Seeding servers and positions...");

  for (const serverData of SERVERS) {
    const [existing] = await db
      .select()
      .from(serversTable)
      .where(eq(serversTable.guildId, serverData.guildId));

    let serverId: number;
    if (existing) {
      await db
        .update(serversTable)
        .set({ serverName: serverData.serverName, serverLogo: serverData.serverLogo })
        .where(eq(serversTable.guildId, serverData.guildId));
      serverId = existing.id;
      console.log(`Updated server: ${serverData.serverName}`);
    } else {
      const [inserted] = await db.insert(serversTable).values(serverData).returning();
      serverId = inserted.id;
      console.log(`Inserted server: ${serverData.serverName}`);
    }

    const existingPositions = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.serverId, serverId));

    if (existingPositions.length === 0) {
      await db.insert(positionsTable).values([
        {
          serverId,
          name: "Moderator",
          description: "Keep the server safe and welcoming. Enforce rules, resolve conflicts, and guide conversations.",
          isOpen: true,
          questions: DEFAULT_QUESTIONS,
        },
        {
          serverId,
          name: "HR Manager",
          description: "Onboard staff, handle internal relations, and ensure the team operates at its best.",
          isOpen: true,
          questions: DEFAULT_QUESTIONS,
        },
        {
          serverId,
          name: "Partnership Manager",
          description: "Build bridges with other communities. Grow the network and create meaningful collaborations.",
          isOpen: true,
          questions: DEFAULT_QUESTIONS,
        },
      ]);
      console.log(`  → Seeded 3 positions for ${serverData.serverName}`);
    } else {
      console.log(`  → ${existingPositions.length} positions already exist for ${serverData.serverName}`);
    }
  }

  console.log("Done.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
