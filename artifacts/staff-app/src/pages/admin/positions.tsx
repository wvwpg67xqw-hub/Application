import Layout from "@/components/Layout";
import {
  useAdminListPositions, getAdminListPositionsQueryKey,
  useCreatePosition, useUpdatePosition, useDeletePosition,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Edit2, Trash2, Lock, Unlock, X, Check } from "lucide-react";

interface PositionFormData {
  name: string;
  description: string;
  discordRoleId: string;
  questions: string[];
  isOpen: boolean;
}

const DEFAULT_QUESTIONS = [
  "Why do you want this position?",
  "What experience do you have?",
  "How active are you?",
  "What are your strengths?",
  "What are your weaknesses?",
  "Any additional information?",
];

function PositionModal({
  initial,
  onClose,
  onSave,
  isPending,
  title,
}: {
  initial?: PositionFormData;
  onClose: () => void;
  onSave: (data: PositionFormData) => void;
  isPending: boolean;
  title: string;
}) {
  const [form, setForm] = useState<PositionFormData>(
    initial || { name: "", description: "", discordRoleId: "", questions: [...DEFAULT_QUESTIONS], isOpen: true }
  );

  const updateQ = (i: number, val: string) => {
    const qs = [...form.questions];
    qs[i] = val;
    setForm((f) => ({ ...f, questions: qs }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border shadow-2xl my-4" style={{ background: "#36393F", borderColor: "#202225" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#202225" }}>
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[#72767D] hover:text-white"><X size={18} /></button>
        </div>
        <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-[#DCDDDE] mb-1.5">Position Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Moderator"
              className="w-full rounded-lg px-3 py-2 text-sm text-[#DCDDDE] placeholder-[#72767D] outline-none focus:ring-2 focus:ring-[#5865F2]"
              style={{ background: "#202225", border: "1px solid #40444B" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#DCDDDE] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe this role..."
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-sm text-[#DCDDDE] placeholder-[#72767D] resize-none outline-none focus:ring-2 focus:ring-[#5865F2]"
              style={{ background: "#202225", border: "1px solid #40444B" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#DCDDDE] mb-1.5">Discord Role ID (optional)</label>
            <input
              value={form.discordRoleId}
              onChange={(e) => setForm((f) => ({ ...f, discordRoleId: e.target.value }))}
              placeholder="Role ID for auto-assign on accept"
              className="w-full rounded-lg px-3 py-2 text-sm text-[#DCDDDE] placeholder-[#72767D] outline-none focus:ring-2 focus:ring-[#5865F2]"
              style={{ background: "#202225", border: "1px solid #40444B" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#DCDDDE] mb-2">Application Questions</label>
            <div className="space-y-2">
              {form.questions.map((q, i) => (
                <input
                  key={i}
                  value={q}
                  onChange={(e) => updateQ(i, e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm text-[#DCDDDE] placeholder-[#72767D] outline-none focus:ring-2 focus:ring-[#5865F2]"
                  style={{ background: "#202225", border: "1px solid #40444B" }}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isOpen}
              onChange={(e) => setForm((f) => ({ ...f, isOpen: e.target.checked }))}
            />
            <span className="text-sm text-[#DCDDDE]">Position is open for applications</span>
          </label>
        </div>
        <div className="px-5 py-4 border-t flex gap-3" style={{ borderColor: "#202225" }}>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium text-[#B9BBBE] border transition-all hover:text-white" style={{ borderColor: "#40444B", background: "transparent" }}>
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isPending || !form.name.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50 transition-all"
            style={{ background: "#5865F2" }}
          >
            {isPending ? "Saving..." : "Save Position"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPositions() {
  const queryClient = useQueryClient();
  const { data: positions, isLoading } = useAdminListPositions({ query: { queryKey: getAdminListPositionsQueryKey() } });
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getAdminListPositionsQueryKey() });

  const handleCreate = (data: PositionFormData) => {
    createMutation.mutate(
      { data: { name: data.name, description: data.description, discordRoleId: data.discordRoleId || undefined, questions: data.questions, isOpen: data.isOpen } },
      { onSuccess: () => { invalidate(); setShowCreate(false); } }
    );
  };

  const handleUpdate = (data: PositionFormData) => {
    if (!editing) return;
    updateMutation.mutate(
      { id: editing.id, data: { name: data.name, description: data.description, discordRoleId: data.discordRoleId || undefined, questions: data.questions, isOpen: data.isOpen } },
      { onSuccess: () => { invalidate(); setEditing(null); } }
    );
  };

  const handleToggle = (pos: any) => {
    updateMutation.mutate(
      { id: pos.id, data: { isOpen: !pos.isOpen } },
      { onSuccess: invalidate }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this position and all its applications?")) return;
    deleteMutation.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Positions</h1>
            <p className="text-[#B9BBBE] mt-1">Manage staff positions</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:brightness-110 transition-all"
            style={{ background: "#5865F2" }}
          >
            <Plus size={16} /> New Position
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: "#40444B" }} />)}
          </div>
        ) : !positions?.length ? (
          <div className="rounded-xl p-12 text-center border" style={{ background: "#40444B", borderColor: "#202225" }}>
            <p className="text-[#B9BBBE]">No positions yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((pos) => (
              <div key={pos.id} className="rounded-xl p-5 border" style={{ background: "#40444B", borderColor: "#202225" }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{pos.name}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: pos.isOpen ? "#3BA55C22" : "#ED424522",
                          color: pos.isOpen ? "#3BA55C" : "#ED4245",
                          border: `1px solid ${pos.isOpen ? "#3BA55C44" : "#ED424544"}`,
                        }}
                      >
                        {pos.isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p className="text-[#B9BBBE] text-sm">{pos.description}</p>
                    <p className="text-[#72767D] text-xs mt-1">{pos.applicationCount} application{pos.applicationCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(pos)}
                      className="p-2 rounded-lg transition-all hover:brightness-110"
                      style={{ background: pos.isOpen ? "#ED424522" : "#3BA55C22", color: pos.isOpen ? "#ED4245" : "#3BA55C" }}
                      title={pos.isOpen ? "Close position" : "Open position"}
                    >
                      {pos.isOpen ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button
                      onClick={() => setEditing(pos)}
                      className="p-2 rounded-lg transition-all hover:brightness-110"
                      style={{ background: "#5865F222", color: "#5865F2" }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(pos.id)}
                      className="p-2 rounded-lg transition-all hover:brightness-110"
                      style={{ background: "#ED424522", color: "#ED4245" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <PositionModal title="Create Position" onClose={() => setShowCreate(false)} onSave={handleCreate} isPending={createMutation.isPending} />
      )}
      {editing && (
        <PositionModal
          title="Edit Position"
          initial={{ name: editing.name, description: editing.description, discordRoleId: editing.discordRoleId || "", questions: editing.questions as string[], isOpen: editing.isOpen }}
          onClose={() => setEditing(null)}
          onSave={handleUpdate}
          isPending={updateMutation.isPending}
        />
      )}
    </Layout>
  );
}
