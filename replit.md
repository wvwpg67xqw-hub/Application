# Discord Staff Application Website

A professional Discord staff application portal. Members of a Discord server can log in with Discord OAuth, apply for staff positions (Moderator, HR, Partnership Manager), and track their application status. Admins can review, accept, or deny applications — triggering Discord embeds, auto-role assignment, and DM notifications via a Discord bot.

## Run & Operate

- `pnpm --filter @workspace/staff-app run dev` — run the frontend (port assigned by Replit)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Required Environment Variables

| Variable | Description |
|---|---|
| `DISCORD_CLIENT_ID` | OAuth2 app client ID from Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | OAuth2 app client secret |
| `DISCORD_BOT_TOKEN` | Bot token for embeds, auto-role, and DMs |
| `DISCORD_GUILD_ID` | Your server's Guild ID |
| `SESSION_SECRET` | Random string for signing session cookies |
| `BASE_URL` | Your app's public URL (for OAuth callback) |
| `DATABASE_URL` | PostgreSQL connection string (set automatically by Replit) |

## Discord Developer Portal Setup

1. Go to https://discord.com/developers/applications → New Application
2. OAuth2 tab → Add redirect: `https://YOUR-APP.replit.app/api/auth/discord/callback`
3. Bot tab → Reset token → copy `DISCORD_BOT_TOKEN`
4. OAuth2 → Client Information → copy `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`
5. Set all env vars in Replit Secrets

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + Wouter + React Query
- API: Express 5 + Passport + express-session (PostgreSQL-backed)
- Bot: Discord.js (embeds, buttons, auto-role, DMs)
- DB: PostgreSQL + Drizzle ORM
- Auth: Discord OAuth2 via passport-discord

## Where things live

- `artifacts/staff-app/src/pages/` — all frontend pages
- `artifacts/staff-app/src/components/` — shared components (Layout, StatusBadge)
- `artifacts/api-server/src/routes/` — auth, positions, applications, admin
- `artifacts/api-server/src/lib/discord-bot.ts` — Discord bot logic
- `lib/db/src/schema/` — Drizzle table definitions
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)

## Architecture decisions

- Session-based auth (not JWT) — simpler, Discord OAuth callback redirects require server-side sessions
- Passport.js Discord strategy with lazy initialization — the app starts without crashing even if Discord creds aren't set yet
- Discord bot is optional — the app works without it; bot features (embeds, auto-role, DMs) just silently skip
- Rate limiting applied globally (200 req/15min) + stricter limit on auth routes (20 req/min)
- Application embed buttons in Discord update the application status directly via Discord.js interaction handler

## User Roles

- `user` — default, can apply for positions
- `admin` — can review applications and manage positions
- `developer` — same as admin, plus system access
- `owner` — full access

To promote a user to admin/owner, update their `role` column in the `users` table.

## Gotchas

- After adding `DISCORD_CLIENT_ID` and restarting, Discord OAuth works; no code changes needed
- `BASE_URL` must match the redirect URL registered in the Discord Developer Portal exactly
- The bot must be invited to the server with `Manage Roles` permission for auto-role to work
- Session cookie is `secure: true` in production — requires HTTPS

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
