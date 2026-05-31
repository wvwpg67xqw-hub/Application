import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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

const DEFAULT_QUESTIONS = JSON.stringify([
  "Why do you want this position?",
  "What experience do you have?",
  "How active are you on Discord?",
  "What are your strengths?",
  "What are your weaknesses?",
  "Anything else you'd like us to know?",
]);

const POSITIONS = [
  {
    name: "Moderator",
    description: "Keep the server safe and welcoming. Enforce rules, resolve conflicts, and guide conversations.",
  },
  {
    name: "HR Manager",
    description: "Onboard staff, handle internal relations, and ensure the team operates at its best.",
  },
  {
    name: "Partnership Manager",
    description: "Build bridges with other communities. Grow the network and create meaningful collaborations.",
  },
];

async function seed() {
  console.log("Seeding servers and positions...");

  for (const s of SERVERS) {
    const existing = await pool.query(
      "SELECT id FROM servers WHERE guild_id = $1",
      [s.guildId]
    );

    let serverId;
    if (existing.rows.length > 0) {
      serverId = existing.rows[0].id;
      await pool.query(
        "UPDATE servers SET server_name = $1, server_logo = $2 WHERE guild_id = $3",
        [s.serverName, s.serverLogo, s.guildId]
      );
      console.log(`Updated: ${s.serverName}`);
    } else {
      const res = await pool.query(
        "INSERT INTO servers (guild_id, server_name, server_logo) VALUES ($1, $2, $3) RETURNING id",
        [s.guildId, s.serverName, s.serverLogo]
      );
      serverId = res.rows[0].id;
      console.log(`Inserted: ${s.serverName}`);
    }

    const posCount = await pool.query(
      "SELECT COUNT(*) FROM positions WHERE server_id = $1",
      [serverId]
    );

    if (parseInt(posCount.rows[0].count) === 0) {
      for (const p of POSITIONS) {
        await pool.query(
          "INSERT INTO positions (server_id, name, description, is_open, questions) VALUES ($1, $2, $3, true, $4)",
          [serverId, p.name, p.description, DEFAULT_QUESTIONS]
        );
      }
      console.log(`  → Seeded 3 positions for ${s.serverName}`);
    } else {
      console.log(`  → Positions already exist for ${s.serverName}`);
    }
  }

  await pool.end();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
