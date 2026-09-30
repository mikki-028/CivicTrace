import { cn } from "@/lib/utils";
import type { StatusLevel } from "@/lib/civic/types";

const MAP: Record<StatusLevel, { label: string; className: string; dot: string }> = {
  normal: {
    label: "Normal",
    className: "bg-normal-soft text-normal border-normal/25",
    dot: "bg-normal",
  },
  pending: {
    label: "Pending",
    className: "bg-pending-soft text-pending border-pending/30",
    dot: "bg-pending",
  },
  attention: {
    label: "Requires Attention",
    className: "bg-attention-soft text-attention border-attention/30",
    dot: "bg-attention",
  },
  priority: {
    label: "Priority Review",
    className: "bg-priority-soft text-priority border-priority/30",
    dot: "bg-priority",
  },
  verification: {
    label: "Verification Required",
    className: "bg-verification-soft text-verification border-verification/25",
    dot: "bg-verification",
  },
  maintenance: {
    label: "Maintenance Required",
    className: "bg-attention-soft text-attention border-attention/30",
    dot: "bg-attention",
  },
};

export function StatusBadge({
  status,
  label,
  className,
  size = "md",
}: {
  status: StatusLevel;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const conf = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        conf.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", conf.dot)} />
      {label ?? conf.label}
    </span>
  );
}

export const statusLabel = (status: StatusLevel) => MAP[status].label;
