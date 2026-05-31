import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { useGetApplication, getGetApplicationQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, MessageSquare, Calendar, User } from "lucide-react";
import { format } from "date-fns";

export default function ApplicationDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const [, navigate] = useLocation();
  const { data: app, isLoading } = useGetApplication(id, { query: { queryKey: getGetApplicationQueryKey(id), enabled: !!id } });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto space-y-4">
          <div className="h-8 w-48 rounded animate-pulse" style={{ background: "#40444B" }} />
          <div className="h-40 rounded-lg animate-pulse" style={{ background: "#40444B" }} />
        </div>
      </Layout>
    );
  }

  if (!app) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <p className="text-[#ED4245]">Application not found.</p>
        </div>
      </Layout>
    );
  }

  const answers = app.answers as Record<string, string>;
  const avatarUrl = app.applicantAvatar
    ? `https://cdn.discordapp.com/avatars/${app.applicantDiscordId}/${app.applicantAvatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-[#B9BBBE] hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        {/* Header */}
        <div
          className="rounded-xl p-5 border mb-5"
          style={{ background: "#40444B", borderColor: "#202225" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{app.positionName} Application</h1>
              <div className="flex items-center gap-3 text-[#B9BBBE] text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#72767D]" />
                  {format(new Date(app.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            </div>
            <StatusBadge status={app.status} />
          </div>

          {/* Applicant info */}
          <div className="mt-4 pt-4 border-t flex items-center gap-3" style={{ borderColor: "#202225" }}>
            <img src={avatarUrl} alt={app.applicantDisplayName} className="w-9 h-9 rounded-full" />
            <div>
              <p className="text-white text-sm font-medium">{app.applicantDisplayName}</p>
              <p className="text-[#B9BBBE] text-xs">@{app.applicantUsername}</p>
            </div>
          </div>
        </div>

        {/* Staff note (if visible) */}
        {app.showNoteToUser && app.staffNote && (
          <div
            className="rounded-xl p-5 border mb-5"
            style={{ background: "#5865F211", borderColor: "#5865F244" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={15} className="text-[#5865F2]" />
              <p className="text-[#5865F2] text-sm font-semibold">Staff Note</p>
              {app.reviewedBy && (
                <span className="text-[#72767D] text-xs ml-auto flex items-center gap-1">
                  <User size={11} />
                  {app.reviewedBy}
                </span>
              )}
            </div>
            <p className="text-[#DCDDDE] text-sm leading-relaxed">{app.staffNote}</p>
          </div>
        )}

        {/* Answers */}
        <div>
          <h2 className="text-white font-semibold mb-4">Your Answers</h2>
          <div className="space-y-4">
            {Object.entries(answers).map(([question, answer], i) => (
              <div
                key={i}
                className="rounded-xl p-5 border"
                style={{ background: "#40444B", borderColor: "#202225" }}
              >
                <p className="text-[#5865F2] text-sm font-semibold mb-2">{question}</p>
                <p className="text-[#DCDDDE] text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
