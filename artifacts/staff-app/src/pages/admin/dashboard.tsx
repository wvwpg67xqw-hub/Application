import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { FileText, Clock, CheckCircle, XCircle, Users, Briefcase, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-[#B9BBBE] mt-1">Overview of all applications and server activity</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: "#40444B" }} />
            ))}
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Applications", value: stats?.totalApplications ?? 0, icon: <FileText size={16} />, color: "#5865F2" },
                { label: "Pending", value: stats?.pending ?? 0, icon: <Clock size={16} />, color: "#FAA81A" },
                { label: "Accepted", value: stats?.accepted ?? 0, icon: <CheckCircle size={16} />, color: "#3BA55C" },
                { label: "Denied", value: stats?.denied ?? 0, icon: <XCircle size={16} />, color: "#ED4245" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg p-4 border" style={{ background: "#40444B", borderColor: "#202225" }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
                    {stat.icon}
                    <span className="text-xs font-medium text-[#B9BBBE] uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {[
                { label: "Open Positions", value: stats?.openPositions ?? 0, icon: <Briefcase size={16} />, color: "#5865F2" },
                { label: "Total Positions", value: stats?.totalPositions ?? 0, icon: <Briefcase size={16} />, color: "#72767D" },
                { label: "Total Applicants", value: stats?.totalApplicants ?? 0, icon: <Users size={16} />, color: "#3BA55C" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg p-4 border" style={{ background: "#40444B", borderColor: "#202225" }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
                    {stat.icon}
                    <span className="text-xs font-medium text-[#B9BBBE] uppercase tracking-wide">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              {[
                { label: "Review Applications", href: "/admin/applications", desc: "Accept or deny pending applications" },
                { label: "Manage Positions", href: "/admin/positions", desc: "Open, close, or create positions" },
                { label: "Server Settings", href: "/admin/settings", desc: "Configure roles and channels" },
              ].map((action) => (
                <button
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className="text-left rounded-lg p-4 border hover:border-[#5865F2] transition-all duration-200 group"
                  style={{ background: "#40444B", borderColor: "#202225" }}
                >
                  <p className="text-white font-medium group-hover:text-[#5865F2] transition-colors flex items-center gap-2">
                    {action.label}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <p className="text-[#72767D] text-sm mt-1">{action.desc}</p>
                </button>
              ))}
            </div>

            {/* Recent applications */}
            {stats?.recentApplications && stats.recentApplications.length > 0 && (
              <div>
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-[#5865F2]" />
                  Recent Applications
                </h2>
                <div className="space-y-2">
                  {stats.recentApplications.map((app) => {
                    const avatarUrl = app.applicantAvatar
                      ? `https://cdn.discordapp.com/avatars/${app.applicantDiscordId}/${app.applicantAvatar}.png?size=40`
                      : `https://cdn.discordapp.com/embed/avatars/0.png`;
                    return (
                      <div
                        key={app.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                        style={{ background: "#40444B", borderColor: "#202225" }}
                      >
                        <img src={avatarUrl} alt={app.applicantDisplayName} className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{app.applicantDisplayName}</p>
                          <p className="text-[#72767D] text-xs">{app.positionName}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <StatusBadge status={app.status} />
                          <span className="text-[#72767D] text-xs hidden md:block">
                            {format(new Date(app.submittedAt), "MMM d")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => navigate("/admin/applications")}
                  className="mt-3 text-[#5865F2] text-sm hover:underline flex items-center gap-1"
                >
                  View all applications <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
