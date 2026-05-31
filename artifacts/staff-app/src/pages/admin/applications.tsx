import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { useAdminListApplications, getAdminListApplicationsQueryKey, useReviewApplication } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, ChevronDown, MessageSquare, X } from "lucide-react";

type ReviewStatus = "accepted" | "denied" | "under_review";

interface ReviewModalProps {
  appId: number;
  applicantName: string;
  onClose: () => void;
  onSubmit: (status: ReviewStatus, note: string, showNote: boolean) => void;
  isPending: boolean;
}

function ReviewModal({ appId, applicantName, onClose, onSubmit, isPending }: ReviewModalProps) {
  const [status, setStatus] = useState<ReviewStatus>("accepted");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md rounded-xl border shadow-2xl" style={{ background: "#36393F", borderColor: "#202225" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#202225" }}>
          <h3 className="text-white font-semibold">Review Application</h3>
          <button onClick={onClose} className="text-[#72767D] hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <p className="text-[#B9BBBE] text-sm">Reviewing application from <span className="text-white font-medium">{applicantName}</span></p>

          <div>
            <label className="block text-[#DCDDDE] text-sm font-medium mb-2">Decision</label>
            <div className="flex gap-2">
              {[
                { value: "accepted" as ReviewStatus, label: "Accept", color: "#3BA55C", bg: "#3BA55C22" },
                { value: "under_review" as ReviewStatus, label: "Under Review", color: "#5865F2", bg: "#5865F222" },
                { value: "denied" as ReviewStatus, label: "Deny", color: "#ED4245", bg: "#ED424522" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all border"
                  style={{
                    background: status === opt.value ? opt.bg : "#40444B",
                    color: status === opt.value ? opt.color : "#B9BBBE",
                    borderColor: status === opt.value ? opt.color + "66" : "#202225",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#DCDDDE] text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare size={14} />
              Staff Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Leave a note for the applicant or staff..."
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm text-[#DCDDDE] placeholder-[#72767D] resize-none outline-none focus:ring-2 focus:ring-[#5865F2]"
              style={{ background: "#202225", border: "1px solid #40444B" }}
            />
          </div>

          {note && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNote}
                onChange={(e) => setShowNote(e.target.checked)}
                className="rounded"
              />
              <span className="text-[#B9BBBE] text-sm">Show note to applicant</span>
            </label>
          )}
        </div>
        <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: "#202225" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-[#B9BBBE] hover:text-white border hover:border-[#5865F2] transition-all"
            style={{ borderColor: "#40444B", background: "transparent" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(status, note, showNote)}
            disabled={isPending}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "#5865F2" }}
          >
            {isPending ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminApplications() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ id: number; name: string } | null>(null);
  const reviewMutation = useReviewApplication();

  const params = statusFilter ? { status: statusFilter } : undefined;
  const { data: applications, isLoading } = useAdminListApplications(params, {
    query: { queryKey: getAdminListApplicationsQueryKey(params) },
  });

  const handleReview = (status: ReviewStatus, note: string, showNote: boolean) => {
    if (!reviewTarget) return;
    reviewMutation.mutate(
      { id: reviewTarget.id, data: { status, staffNote: note, showNoteToUser: showNote } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListApplicationsQueryKey() });
          setReviewTarget(null);
        },
      }
    );
  };

  const statuses = ["", "pending", "under_review", "accepted", "denied"];
  const statusLabels: Record<string, string> = { "": "All", pending: "Pending", under_review: "Under Review", accepted: "Accepted", denied: "Denied" };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Applications</h1>
            <p className="text-[#B9BBBE] mt-1">{applications?.length ?? 0} application{applications?.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Status filter */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#2F3136" }}>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: statusFilter === s ? "#5865F2" : "transparent",
                  color: statusFilter === s ? "white" : "#B9BBBE",
                }}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "#40444B" }} />
            ))}
          </div>
        ) : !applications?.length ? (
          <div className="rounded-xl p-12 text-center border" style={{ background: "#40444B", borderColor: "#202225" }}>
            <p className="text-[#B9BBBE] font-medium">No applications found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => {
              const avatarUrl = app.applicantAvatar
                ? `https://cdn.discordapp.com/avatars/${app.applicantDiscordId}/${app.applicantAvatar}.png?size=40`
                : `https://cdn.discordapp.com/embed/avatars/0.png`;
              return (
                <div
                  key={app.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                  style={{ background: "#40444B", borderColor: "#202225" }}
                >
                  <img src={avatarUrl} alt={app.applicantDisplayName} className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{app.applicantDisplayName}</p>
                    <p className="text-[#72767D] text-xs">{app.positionName} · {format(new Date(app.submittedAt), "MMM d, yyyy")}</p>
                  </div>
                  <StatusBadge status={app.status} />
                  <div className="flex gap-1.5 ml-2">
                    {app.status !== "accepted" && (
                      <button
                        onClick={() => setReviewTarget({ id: app.id, name: app.applicantDisplayName })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:brightness-110"
                        style={{ background: "#5865F222", color: "#5865F2", border: "1px solid #5865F244" }}
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          appId={reviewTarget.id}
          applicantName={reviewTarget.name}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReview}
          isPending={reviewMutation.isPending}
        />
      )}
    </Layout>
  );
}
