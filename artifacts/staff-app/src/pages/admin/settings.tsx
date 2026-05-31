import Layout from "@/components/Layout";
import { useGetServerSettings, getGetServerSettingsQueryKey, useUpdateServerSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Save, Info } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetServerSettings({ query: { queryKey: getGetServerSettingsQueryKey() } });
  const updateMutation = useUpdateServerSettings();

  const [form, setForm] = useState({
    serverName: "",
    reviewChannelId: "",
    ownerRoleId: "",
    developerRoleId: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        serverName: settings.serverName || "",
        reviewChannelId: settings.reviewChannelId || "",
        ownerRoleId: settings.ownerRoleId || "",
        developerRoleId: settings.developerRoleId || "",
      });
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      { data: { serverName: form.serverName || undefined, reviewChannelId: form.reviewChannelId || undefined, ownerRoleId: form.ownerRoleId || undefined, developerRoleId: form.developerRoleId || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetServerSettingsQueryKey() });
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        },
      }
    );
  };

  const fields = [
    { key: "serverName", label: "Server Name", placeholder: "Your Discord Server Name", hint: "Displayed on the landing page" },
    { key: "reviewChannelId", label: "Review Channel ID", placeholder: "e.g. 123456789012345678", hint: "Discord channel where application embeds are sent" },
    { key: "ownerRoleId", label: "Owner Role ID", placeholder: "e.g. 123456789012345678", hint: "Role with full admin access" },
    { key: "developerRoleId", label: "Developer Role ID", placeholder: "e.g. 123456789012345678", hint: "Role with developer access" },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Server Settings</h1>
          <p className="text-[#B9BBBE] mt-1">Configure your Discord server integration</p>
        </div>

        {/* Info banner */}
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: "#5865F222", border: "1px solid #5865F244" }}>
          <Info size={16} className="text-[#5865F2] mt-0.5 flex-shrink-0" />
          <p className="text-[#B9BBBE] text-sm">
            To find IDs in Discord, enable Developer Mode in Settings, then right-click any channel or role and select "Copy ID".
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: "#40444B" }} />)}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Guild ID (read-only) */}
            <div>
              <label className="block text-sm font-medium text-[#DCDDDE] mb-1.5">Guild ID</label>
              <input
                value={settings?.guildId || "Not configured"}
                readOnly
                className="w-full rounded-lg px-3 py-2.5 text-sm text-[#72767D] cursor-not-allowed"
                style={{ background: "#202225", border: "1px solid #40444B" }}
              />
              <p className="text-[#72767D] text-xs mt-1">Set via DISCORD_GUILD_ID environment variable</p>
            </div>

            {fields.map(({ key, label, placeholder, hint }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[#DCDDDE] mb-1.5">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-[#DCDDDE] placeholder-[#72767D] outline-none focus:ring-2 focus:ring-[#5865F2] transition-shadow"
                  style={{ background: "#202225", border: "1px solid #40444B" }}
                />
                {hint && <p className="text-[#72767D] text-xs mt-1">{hint}</p>}
              </div>
            ))}

            <div className="pt-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white hover:brightness-110 disabled:opacity-50 transition-all"
                style={{ background: saved ? "#3BA55C" : "#5865F2" }}
              >
                {updateMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    {saved ? "Saved!" : "Save Settings"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Environment variables guide */}
        <div className="mt-8 rounded-xl p-5 border" style={{ background: "#2F3136", borderColor: "#202225" }}>
          <h3 className="text-white font-semibold mb-3 text-sm">Required Environment Variables</h3>
          <div className="space-y-2">
            {[
              { key: "DISCORD_CLIENT_ID", desc: "OAuth2 application client ID" },
              { key: "DISCORD_CLIENT_SECRET", desc: "OAuth2 application secret" },
              { key: "DISCORD_BOT_TOKEN", desc: "Bot token for auto-role and DMs" },
              { key: "DISCORD_GUILD_ID", desc: "Your server's guild ID" },
              { key: "DISCORD_REVIEW_CHANNEL_ID", desc: "Channel for application notifications" },
              { key: "SESSION_SECRET", desc: "Random string for session encryption" },
              { key: "BASE_URL", desc: "Your app's public URL (for OAuth callback)" },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-start gap-3">
                <code className="text-[#5865F2] text-xs font-mono bg-[#202225] px-2 py-0.5 rounded flex-shrink-0">{key}</code>
                <span className="text-[#72767D] text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
