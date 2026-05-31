import { Router } from "express";
import passport from "passport";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { checkGuildMembership } from "../lib/discord-bot";
import { logger } from "../lib/logger";

export const authRouter = Router();

function setupPassport() {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    logger.warn("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET not set — Discord OAuth disabled");
    return;
  }

  // Dynamic import to avoid crash when env vars missing at module load time
  import("passport-discord").then(({ default: DiscordStrategyModule }) => {
    const Strategy = (DiscordStrategyModule as any).Strategy || DiscordStrategyModule;

    const BASE_URL = process.env.BASE_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    const CALLBACK_URL = `${BASE_URL}/api/auth/discord/callback`;

    passport.use(
      new Strategy(
        {
          clientID: DISCORD_CLIENT_ID,
          clientSecret: DISCORD_CLIENT_SECRET,
          callbackURL: CALLBACK_URL,
          scope: ["identify", "guilds", "guilds.members.read"],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const discordId = profile.id;
            const username = profile.username;
            const displayName = profile.global_name || profile.username;
            const avatar = profile.avatar;

            const isMember = await checkGuildMembership(discordId);

            const existing = await db
              .select()
              .from(usersTable)
              .where(eq(usersTable.discordId, discordId))
              .then((r) => r[0]);

            let user;
            if (existing) {
              [user] = await db
                .update(usersTable)
                .set({ username, displayName, avatar, isMember, accessToken: _accessToken, refreshToken: _refreshToken, updatedAt: new Date() })
                .where(eq(usersTable.discordId, discordId))
                .returning();
            } else {
              [user] = await db
                .insert(usersTable)
                .values({ discordId, username, displayName, avatar, isMember, accessToken: _accessToken, refreshToken: _refreshToken })
                .returning();
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );

    logger.info("Discord OAuth strategy registered");
  }).catch((err) => logger.error({ err }, "Failed to load passport-discord"));
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    done(null, user || null);
  } catch (err) {
    done(err);
  }
});

// Setup strategy (async, safe if env vars missing)
setupPassport();

authRouter.get("/discord", (req, res, next) => {
  if (!process.env.DISCORD_CLIENT_ID) {
    return res.status(503).json({ error: "Discord OAuth not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET." });
  }
  passport.authenticate("discord")(req, res, next);
});

authRouter.get(
  "/discord/callback",
  (req, res, next) => {
    if (!process.env.DISCORD_CLIENT_ID) {
      return res.redirect("/?error=oauth_not_configured");
    }
    passport.authenticate("discord", { failureRedirect: "/?error=auth_failed" })(req, res, next);
  },
  (_req, res) => {
    res.redirect("/dashboard");
  }
);

authRouter.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = req.user as any;
  res.json({
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role,
    isMember: user.isMember,
    createdAt: user.createdAt,
  });
});

authRouter.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});
