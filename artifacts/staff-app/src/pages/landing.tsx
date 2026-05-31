import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Zap, Star, Shield, Users } from "lucide-react";

interface ServerCard {
  id: number;
  guildId: string;
  serverName: string;
  serverLogo: string | null;
  openPositions: number;
}

function useServers() {
  return useQuery<ServerCard[]>({
    queryKey: ["servers"],
    queryFn: async () => {
      const res = await fetch("/api/servers");
      if (!res.ok) throw new Error("Failed to fetch servers");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { data: user, isLoading: userLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: servers, isLoading: serversLoading } = useServers();

  useEffect(() => {
    if (!userLoading && user) {
      navigate("/dashboard");
    }
  }, [user, userLoading]);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #1e2124 0%, #36393F 50%, #2f3136 100%)" }}>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        <div className="flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase" style={{ background: "#5865F222", color: "#5865F2", border: "1px solid #5865F244" }}>
          <span>Staff Applications Network</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Plain Promotions
        </h1>
        <p className="text-[#B9BBBE] text-lg max-w-xl mb-8 leading-relaxed">
          Apply for staff positions across our network of Discord servers. Select a server below to get started.
        </p>

        <a
          href="/api/auth/discord"
          className="inline-flex items-center gap-3 px-7 py-3.5 rounded-lg font-semibold text-white text-base transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-100 shadow-lg"
          style={{ background: "#5865F2" }}
        >
          <svg width="20" height="20" viewBox="0 0 71 55" fill="white">
            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" />
          </svg>
          Login with Discord
        </a>
        <p className="mt-3 text-[#72767D] text-sm">Log in to apply for staff positions</p>
      </div>

      {/* Server Cards */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-center text-xs font-semibold text-[#72767D] mb-6 uppercase tracking-widest">
          Our Servers
        </h2>

        {serversLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: "#2F3136" }} />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(servers || []).map((server, idx) => {
              const accentColors = ["#5865F2", "#ED4245", "#FAA81A", "#3BA55C"];
              const accent = accentColors[idx % accentColors.length];
              return (
                <div
                  key={server.guildId}
                  className="group rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col"
                  style={{ background: "#2F3136", borderColor: "#202225" }}
                >
                  {/* Server icon */}
                  <div className="flex justify-center pt-6 pb-4">
                    {server.serverLogo ? (
                      <img
                        src={server.serverLogo}
                        alt={server.serverName}
                        className="w-20 h-20 rounded-full object-cover ring-4 transition-all duration-200"
                        style={{ ringColor: accent + "55" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: accent + "44" }}>
                        {server.serverName[0]}
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-5 flex flex-col flex-1">
                    <h3 className="text-white font-bold text-center mb-1 leading-snug">{server.serverName}</h3>
                    <p className="text-center text-xs mb-4" style={{ color: accent }}>
                      {server.openPositions} open position{server.openPositions !== 1 ? "s" : ""}
                    </p>

                    <div className="mt-auto">
                      <a
                        href="/api/auth/discord"
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
                        style={{ background: accent + "22", color: accent, border: `1px solid ${accent}44` }}
                      >
                        Apply Now <ChevronRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="border-t py-6" style={{ borderColor: "#202225", background: "#2F3136" }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-10 text-center">
          {[
            { icon: <Zap size={15} />, label: "Fast Review Process" },
            { icon: <Star size={15} />, label: "Merit-Based Selection" },
            { icon: <Shield size={15} />, label: "Secure & Private" },
            { icon: <Users size={15} />, label: "Multiple Servers" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-[#B9BBBE] text-sm">
              <span className="text-[#5865F2]">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
