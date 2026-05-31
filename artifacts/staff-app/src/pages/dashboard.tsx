import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { useGetMe, getGetMeQueryKey, useGetMyStats, getGetMyStatsQueryKey, useListMyApplications, getListMyApplicationsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { FileText, Clock, CheckCircle, XCircle, Plus, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: stats } = useGetMyStats({ query: { queryKey: getGetMyStatsQueryKey() } });
  const { data: applications, isLoading } = useListMyApplications({ query: { queryKey: getListMyApplicationsQueryKey() } });

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* User greeting */}
        <div className="flex items-center gap-4 mb-8">
          <img
            src={avatarUrl}
            alt={user?.displayName}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#5865F2]"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.displayName}
            </h1>
            <p className="text-[#B9BBBE] mt-0.5">
              Track your applications and apply for new positions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total", value: stats?.total ?? 0, icon: <FileText size={16} />, color: "#5865F2" },
            { label: "Pending", value: stats?.pending ?? 0, icon: <Clock size={16} />, color: "#FAA81A" },
            { label: "Accepted", value: stats?.accepted ?? 0, icon: <CheckCircle size={16} />, color: "#3BA55C" },
            { label: "Denied", value: stats?.denied ?? 0, icon: <XCircle size={16} />, color: "#ED4245" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg p-4 border"
              style={{ background: "#40444B", borderColor: "#202225" }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
                {stat.icon}
                <span className="text-xs font-medium text-[#B9BBBE] uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Apply CTA */}
        <button
          onClick={() => navigate("/apply")}
          className="w-full mb-6 flex items-center justify-between px-5 py-4 rounded-lg border border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white transition-all duration-200 group"
          style={{ background: "#5865F211" }}
        >
          <div className="flex items-center gap-3">
            <Plus size={20} />
            <span className="font-semibold">Apply for a Position</span>
          </div>
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Applications list */}
        <div>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FileText size={16} className="text-[#5865F2]" />
            My Applications
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: "#40444B" }} />
              ))}
            </div>
          ) : !applications?.length ? (
            <div
              className="rounded-lg p-10 text-center border"
              style={{ background: "#40444B", borderColor: "#202225" }}
            >
              <FileText size={32} className="text-[#72767D] mx-auto mb-3" />
              <p className="text-[#B9BBBE] font-medium">No applications yet</p>
              <p className="text-[#72767D] text-sm mt-1">Start by applying for an open position</p>
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border hover:border-[#5865F2] transition-all duration-200 text-left group"
                  style={{ background: "#40444B", borderColor: "#202225" }}
                >
                  <div>
                    <p className="text-white font-medium group-hover:text-[#5865F2] transition-colors">{app.positionName}</p>
                    <p className="text-[#72767D] text-xs mt-0.5">
                      {format(new Date(app.submittedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <ChevronRight size={16} className="text-[#72767D] group-hover:text-[#5865F2] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
