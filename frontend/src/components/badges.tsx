import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

// Risk tiers get a controlled color scale so the queue reads at a glance; this
// is data visualization, not theming, so a small explicit palette is used.
const TIER: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/15 text-red-300",
  high: "border-orange-500/30 bg-orange-500/15 text-orange-300",
  medium: "border-amber-500/30 bg-amber-500/15 text-amber-200",
  low: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
};

export function RiskBadge({ tier }: { tier: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", TIER[tier] ?? "")}>
      {tier}
    </Badge>
  );
}

const REVIEW_STATUS: Record<string, string> = {
  open: "border-sky-500/30 bg-sky-500/15 text-sky-300",
  signed_off: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  revoked: "border-red-500/30 bg-red-500/15 text-red-300",
};

export function ReviewStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", REVIEW_STATUS[status] ?? "")}>
      {titleCase(status)}
    </Badge>
  );
}

export function DecisionBadge({ decision }: { decision: string }) {
  const cls =
    decision === "revoked"
      ? "border-red-500/30 bg-red-500/15 text-red-300"
      : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  return (
    <Badge variant="outline" className={cn("font-medium", cls)}>
      {titleCase(decision)}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant="secondary" className="font-medium">
      {titleCase(role)}
    </Badge>
  );
}

export function EmployeeStatusBadge({ status }: { status: string }) {
  const cls =
    status === "terminated"
      ? "border-red-500/30 bg-red-500/15 text-red-300"
      : "border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", cls)}>
      {status}
    </Badge>
  );
}
