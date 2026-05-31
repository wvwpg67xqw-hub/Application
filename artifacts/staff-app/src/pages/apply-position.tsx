import Layout from "@/components/Layout";
import { useGetPosition, getGetPositionQueryKey, useCreateApplication, getListMyApplicationsQueryKey, getGetMyStatsQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";

export default function ApplyPosition() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: position, isLoading } = useGetPosition(id, { query: { queryKey: getGetPositionQueryKey(id), enabled: !!id } });
  const createMutation = useCreateApplication();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const questions = (position?.questions as string[]) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const incomplete = questions.some((q) => !answers[q]?.trim());
    if (incomplete) {
      setError("Please answer all questions before submitting.");
      return;
    }

    createMutation.mutate(
      { data: { positionId: id, answers } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyApplicationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyStatsQueryKey() });
          navigate("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Failed to submit application. Please try again.");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded animate-pulse" style={{ background: "#40444B" }} />
            <div className="h-4 w-72 rounded animate-pulse" style={{ background: "#40444B" }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-lg animate-pulse" style={{ background: "#40444B" }} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!position) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <p className="text-[#ED4245]">Position not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/apply")}
          className="flex items-center gap-2 text-[#B9BBBE] hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Back to positions
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{position.name} Application</h1>
          <p className="text-[#B9BBBE] mt-1">{position.description}</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: "#ED424522", border: "1px solid #ED424544" }}>
            <AlertCircle size={16} className="text-[#ED4245] mt-0.5 flex-shrink-0" />
            <p className="text-[#ED4245] text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {questions.map((question, i) => (
            <div key={i}>
              <label className="block text-[#DCDDDE] font-medium text-sm mb-2">
                {question}
                <span className="text-[#ED4245] ml-1">*</span>
              </label>
              <textarea
                value={answers[question] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question]: e.target.value }))}
                placeholder="Your answer..."
                rows={4}
                className="w-full rounded-lg px-4 py-3 text-sm text-[#DCDDDE] placeholder-[#72767D] resize-none outline-none transition-colors focus:ring-2 focus:ring-[#5865F2]"
                style={{ background: "#202225", border: "1px solid #40444B" }}
              />
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#5865F2" }}
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  Submit Application
                </>
              )}
            </button>
            <p className="text-center text-[#72767D] text-xs mt-3">
              Your application will be reviewed by the staff team
            </p>
          </div>
        </form>
      </div>
    </Layout>
  );
}
