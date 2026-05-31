import Layout from "@/components/Layout";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ArrowLeft, Lock, FileText, Shield, Users, Handshake } from "lucide-react";

interface Position {
  id: number;
  serverId: number;
  name: string;
  description: string;
  isOpen: boolean;
  applicationCount: number;
  questions: string[];
}

interface ServerWithPositions {
  server: {
    id: number;
    guildId: string;
    serverName: string;
    serverLogo: string | null;
  };
  positions: Position[];
}

const POSITION_ICONS: Record<string, React.ReactNode> = {
  Moderator: <Shield size={22} />,
  "HR Manager": <Users size={22} />,
  "Partnership Manager": <Handshake size={22} />,
  HR: <Users size={22} />,
};

const POSITION_COLORS = [
  { color: "#5865F2", bg: "#5865F222" },
  { color: "#3BA55C", bg: "#3BA55C22" },
  { color: "#FAA81A", bg: "#FAA81A22" },
  { color: "#ED4245", bg: "#ED424522" },
  { color: "#EB459E", bg: "#EB459E22" },
];

function useServerPositions(guildId: string) {
  return useQuery<ServerWithPositions>({
    queryKey: ["server-positions", guildId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${guildId}/positions`);
      if (!res.ok) throw new Error("Failed to fetch positions");
      return res.json();
    },
    staleTime: 30_000,
    enabled: !!guildId,
  });
}

export default function ApplyServer() {
  const params = useParams<{ guildId: string }>();
  const { guildId } = params;
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useServerPositions(guildId);

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-[#B9BBBE] hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-16 w-64 rounded-xl animate-pulse" style={{ background: "#40444B" }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "#40444B" }} />
            ))}
          </div>
        ) : error || !data ? (
          <div className="rounded-xl p-12 text-center border" style={{ background: "#40444B", borderColor: "#202225" }}>
            <p className="text-[#ED4245] font-medium">Server not found or unavailable.</p>
          </div>
        ) : (
          <>
            {/* Server header */}
            <div className="flex items-center gap-4 mb-8">
              {data.server.serverLogo ? (
                <img
                  src={data.server.serverLogo}
                  alt={data.server.serverName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#5865F2]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white" style={{ background: "#5865F244" }}>
                  {data.server.serverName[0]}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{data.server.serverName}</h1>
                <p className="text-[#B9BBBE] text-sm mt-0.5">
                  {data.positions.filter((p) => p.isOpen).length} open position{data.positions.filter((p) => p.isOpen).length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Positions list */}
            {data.positions.length === 0 ? (
              <div className="rounded-xl p-12 text-center border" style={{ background: "#40444B", borderColor: "#202225" }}>
                <Lock size={36} className="text-[#72767D] mx-auto mb-3" />
                <p className="text-white font-semibold">No Positions Available</p>
                <p className="text-[#B9BBBE] text-sm mt-1">Check back later — positions open periodically</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.positions.map((pos, idx) => {
                  const style = POSITION_COLORS[idx % POSITION_COLORS.length];
                  const icon = POSITION_ICONS[pos.name] || <FileText size={22} />;

                  return (
                    <button
                      key={pos.id}
                      onClick={() => navigate(`/apply/${guildId}/${pos.id}`)}
                      disabled={!pos.isOpen}
                      className="w-full text-left rounded-xl p-5 border transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#5865F2]"
                      style={{ background: "#40444B", borderColor: "#202225" }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold group-hover:text-[#5865F2] transition-colors">
                              {pos.name}
                            </h3>
                            {!pos.isOpen && (
                              <span className="text-xs px-2 py-0.5 rounded-full text-[#ED4245]" style={{ background: "#ED424522", border: "1px solid #ED424544" }}>
                                Closed
                              </span>
                            )}
                          </div>
                          <p className="text-[#B9BBBE] text-sm leading-relaxed">{pos.description}</p>
                          <p className="text-[#72767D] text-xs mt-2">{pos.applicationCount} application{pos.applicationCount !== 1 ? "s" : ""}</p>
                        </div>
                        {pos.isOpen && (
                          <ChevronRight size={18} className="text-[#72767D] group-hover:text-[#5865F2] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
