interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "status-pending" },
  under_review: { label: "Under Review", className: "status-under_review" },
  accepted: { label: "Accepted", className: "status-accepted" },
  denied: { label: "Denied", className: "status-denied" },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: "status-pending" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
