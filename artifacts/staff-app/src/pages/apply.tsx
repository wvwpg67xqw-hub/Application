import Layout from "@/components/Layout";
import { useListPositions, getListPositionsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Shield, Users, Handshake, Lock, ChevronRight, FileText } from "lucide-react";

const POSITION_ICONS: Record<string, React.ReactNode> = {
  Moderator: <Shield size={22} />,
  HR: <Users size={22} />,
  "Partnership Manager": <Handshake size={22} />,
};

const POSITION_COLORS: Record<string, { color: string; bg: string }> = {
  Moderator: { color: "#5865F2", bg: "#5865F222" },
  HR: { color: "#3BA55C", bg: "#3BA55C22" },
  "Partnership Manager": { color: "#FAA81A", bg: "#FAA81A22" },
};

export default function Apply() {
  const [, navigate] = useLocation();
  const { data: positions, isLoading } = useListPositions({ query: { queryKey: getListPositionsQueryKey() } });

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Apply for a Position</h1>
          <p className="text-[#B9BBBE] mt-1">Select a role to apply for. Each application is reviewed by our team.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "#40444B" }} />
            ))}
          </div>
        ) : !positions?.length ? (
          <div
            className="rounded-xl p-12 text-center border"
            style={{ background: "#40444B", borderColor: "#202225" }}
          >
            <Lock size={36} className="text-[#72767D] mx-auto mb-3" />
            <p className="text-white font-semibold">No Open Positions</p>
            <p className="text-[#B9BBBE] text-sm mt-1">Check back later — positions open periodically</p>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((pos) => {
              const iconStyle = POSITION_COLORS[pos.name] || { color: "#5865F2", bg: "#5865F222" };
              const icon = POSITION_ICONS[pos.name] || <FileText size={22} />;

              return (
                <button
                  key={pos.id}
                  onClick={() => navigate(`/apply/${pos.id}`)}
                  disabled={!pos.isOpen}
                  className="w-full text-left rounded-xl p-5 border transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#5865F2]"
                  style={{ background: "#40444B", borderColor: "#202225" }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: iconStyle.bg, color: iconStyle.color }}
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
                      <ChevronRight
                        size={18}
                        className="text-[#72767D] group-hover:text-[#5865F2] group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
