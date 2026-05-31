import {
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, Events, REST, Routes, SlashCommandBuilder, PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { db } from "@workspace/db";
import { applicationsTable, usersTable, positionsTable, serversTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

let client: Client | null = null;

export function getDiscordClient(): Client | null {
  return client;
}

export async function initDiscordBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token) {
    logger.warn("DISCORD_BOT_TOKEN not set — Discord bot disabled");
    return;
  }

  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  client.on(Events.ClientReady, async (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot logged in");

    // Register /setup slash command globally
    if (clientId) {
      try {
        const rest = new REST().setToken(token);
        const command = new SlashCommandBuilder()
          .setName("setup")
          .setDescription("Set this channel as the staff application review channel for this server")
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

        await rest.put(Routes.applicationCommands(clientId), {
          body: [command.toJSON()],
        });
        logger.info("Registered /setup slash command globally");
      } catch (err) {
        logger.error({ err }, "Failed to register slash commands");
      }
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    // Handle /setup command
    if (interaction.isChatInputCommand() && interaction.commandName === "setup") {
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        return;
      }

      const channelId = interaction.channelId;

      try {
        const [existing] = await db.select().from(serversTable).where(eq(serversTable.guildId, guildId));

        if (existing) {
          await db
            .update(serversTable)
            .set({ reviewChannelId: channelId, updatedAt: new Date() })
            .where(eq(serversTable.guildId, guildId));
        } else {
          const guild = interaction.guild;
          await db.insert(serversTable).values({
            guildId,
            serverName: guild?.name || "Unknown Server",
            serverLogo: guild?.iconURL() || null,
            reviewChannelId: channelId,
          });
        }

        await interaction.reply({
          content: `✅ **Setup complete!** This channel (<#${channelId}>) will now receive staff application notifications for **${interaction.guild?.name}**.`,
          ephemeral: true,
        });
        logger.info({ guildId, channelId }, "/setup: review channel configured");
      } catch (err) {
        logger.error({ err }, "/setup: failed to save config");
        await interaction.reply({ content: "❌ Failed to save configuration. Please try again.", ephemeral: true });
      }
      return;
    }

    // Handle Accept/Deny/Review buttons
    if (!interaction.isButton()) return;

    const [action, appIdStr] = interaction.customId.split("_");
    const appId = parseInt(appIdStr, 10);
    if (!appId || isNaN(appId)) return;

    const newStatus = action === "accept" ? "accepted" : action === "deny" ? "denied" : action === "review" ? "under_review" : null;
    if (!newStatus) return;

    try {
      const [app] = await db
        .update(applicationsTable)
        .set({
          status: newStatus,
          reviewedBy: interaction.user.tag,
          reviewedAt: new Date(),
        })
        .where(eq(applicationsTable.id, appId))
        .returning();

      if (!app) {
        await interaction.reply({ content: "Application not found.", ephemeral: true });
        return;
      }

      if (newStatus === "accepted") {
        await assignRole(app.positionId, app.userId);
      }

      await sendDecisionDM(app.userId, newStatus, app.positionId, interaction.user.tag);

      const statusLabel =
        newStatus === "accepted" ? "✅ Accepted" : newStatus === "denied" ? "❌ Denied" : "🔍 Under Review";

      await interaction.update({
        content: `**${statusLabel}** by ${interaction.user.tag}`,
        components: [],
      });
    } catch (err) {
      logger.error({ err }, "Error handling button interaction");
      await interaction.reply({ content: "An error occurred.", ephemeral: true }).catch(() => {});
    }
  });

  await client.login(token);
}

async function assignRole(positionId: number, userId: number): Promise<void> {
  if (!client) return;

  try {
    const [position] = await db.select().from(positionsTable).where(eq(positionsTable.id, positionId));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

    if (!position?.discordRoleId || !user?.discordId || !position.serverId) return;

    const [server] = await db.select().from(serversTable).where(eq(serversTable.id, position.serverId));
    if (!server?.guildId) return;

    const guild = await client.guilds.fetch(server.guildId);
    const member = await guild.members.fetch(user.discordId);
    await member.roles.add(position.discordRoleId);
    logger.info({ discordId: user.discordId, roleId: position.discordRoleId }, "Role assigned");
  } catch (err) {
    logger.error({ err }, "Failed to assign role");
  }
}

async function sendDecisionDM(userId: number, status: string, positionId: number, reviewerTag: string): Promise<void> {
  if (!client) return;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    const [position] = await db.select().from(positionsTable).where(eq(positionsTable.id, positionId));

    if (!user?.discordId || !position) return;

    const discordUser = await client.users.fetch(user.discordId);
    const isAccepted = status === "accepted";
    const isUnderReview = status === "under_review";

    const embed = new EmbedBuilder()
      .setColor(isAccepted ? 0x3ba55c : isUnderReview ? 0x5865f2 : 0xed4245)
      .setTitle(isAccepted ? "Application Accepted!" : isUnderReview ? "Application Under Review" : "Application Update")
      .setDescription(
        isAccepted
          ? `Congratulations! Your application for **${position.name}** has been **accepted**. Welcome to the team!`
          : isUnderReview
          ? `Your application for **${position.name}** is now **under review**. We'll be in touch soon!`
          : `Your application for **${position.name}** has been **denied**. Thank you for applying.`
      )
      .addFields({ name: "Reviewed by", value: reviewerTag })
      .setTimestamp();

    await discordUser.send({ embeds: [embed] });
  } catch (err) {
    logger.error({ err }, "Failed to send DM to applicant");
  }
}

export async function sendApplicationEmbed(
  applicationId: number,
  applicant: { username: string; displayName: string; discordId: string; avatar: string | null },
  position: { name: string; serverId: number | null },
  answers: Record<string, string>,
  questions: string[]
): Promise<void> {
  if (!client) return;

  // Look up this server's review channel from DB
  let channelId: string | null = null;
  if (position.serverId) {
    const [server] = await db.select().from(serversTable).where(eq(serversTable.id, position.serverId));
    channelId = server?.reviewChannelId || null;
  }

  // Fall back to env var for backwards compatibility
  if (!channelId) channelId = process.env.DISCORD_REVIEW_CHANNEL_ID || null;

  if (!channelId) {
    logger.warn({ applicationId }, "No review channel configured for this server — skipping embed");
    return;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return;

    const avatarUrl = applicant.avatar
      ? `https://cdn.discordapp.com/avatars/${applicant.discordId}/${applicant.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`New ${position.name} Application`)
      .setThumbnail(avatarUrl)
      .addFields(
        { name: "Applicant", value: `${applicant.displayName} (${applicant.username})`, inline: true },
        { name: "Discord ID", value: applicant.discordId, inline: true },
        { name: "Position", value: position.name, inline: true }
      );

    questions.slice(0, 5).forEach((q, i) => {
      const answer = answers[q] || answers[String(i)] || "No answer";
      embed.addFields({ name: q, value: answer.substring(0, 1024) });
    });

    embed.setTimestamp().setFooter({ text: `Application ID: ${applicationId}` });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${applicationId}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`review_${applicationId}`)
        .setLabel("Mark Under Review")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`deny_${applicationId}`)
        .setLabel("Deny")
        .setStyle(ButtonStyle.Danger)
    );

    await (channel as any).send({ embeds: [embed], components: [row] });
  } catch (err) {
    logger.error({ err }, "Failed to send application embed");
  }
}

export async function checkGuildMembership(discordId: string, guildId?: string): Promise<boolean> {
  if (!client) return true;

  const targetGuildId = guildId || process.env.DISCORD_GUILD_ID;
  if (!targetGuildId) return true;

  try {
    const guild = await client.guilds.fetch(targetGuildId);
    await guild.members.fetch(discordId);
    return true;
  } catch {
    return false;
  }
}
