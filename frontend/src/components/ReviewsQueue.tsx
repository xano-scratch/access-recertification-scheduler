import { useEffect, useState } from "react";
import { api, ApiError, type Me, type Review } from "@/lib/api";
import { RiskBadge, ReviewStatusBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtDate, dueLabel, daysFromNow } from "@/lib/format";
import { Lock, Inbox, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "open", label: "Open" },
  { key: "signed_off", label: "Signed off" },
  { key: "revoked", label: "Revoked" },
];

export function ReviewsQueue({
  me,
  selectedId,
  onSelect,
  refreshKey,
}: {
  me: Me;
  selectedId: number | null;
  onSelect: (id: number) => void;
  refreshKey: number;
}) {
  const [rows, setRows] = useState<Review[] | null>(null);
  const [filter, setFilter] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    setForbidden(false);
    api
      .listReviews(filter || undefined)
      .then((r) => live && setRows(r))
      .catch((e) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 403) setForbidden(true);
        else setError(e instanceof Error ? e.message : "Failed to load reviews");
      });
    return () => {
      live = false;
    };
  }, [filter, refreshKey]);

  if (forbidden) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
          <Lock className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Reviewer role required</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Your role ({me.role.replace(/_/g, " ")}) is read only. The review queue is limited to
            reviewers and compliance admins. Open the Audit trail to read every decision.
          </p>
        </div>
      </Card>
    );
  }

  const openCount = rows?.filter((r) => r.status === "open").length ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key || "all"}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
        <span className="text-muted-foreground ml-auto text-xs">
          {openCount} open{rows ? ` · ${rows.length} shown` : ""}
        </span>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {rows && rows.length === 0 && !error && (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <Inbox className="text-muted-foreground size-6" />
          <p className="font-medium">No review items{filter ? " in this state" : " yet"}</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            {me.role === "compliance_admin"
              ? "Run the recertification scan to flag entitlements past their review interval."
              : "A compliance admin can run the scan to flag overdue access."}
          </p>
        </Card>
      )}

      {rows && rows.length > 0 && (
        <Card className="divide-border/60 divide-y overflow-hidden py-0">
          {rows.map((r) => {
            const overdue = r.status === "open" && (daysFromNow(r.due_at as number) ?? 0) < 0;
            return (
              <button
                key={r.id as number}
                onClick={() => onSelect(r.id as number)}
                className={cn(
                  "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors",
                  selectedId === r.id ? "bg-accent" : "hover:bg-accent/50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{r.employee_name}</span>
                    <RiskBadge tier={r.risk_tier} />
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {r.system_name} · {r.access_level}
                  </p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">{r.reason}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <ReviewStatusBadge status={r.status} />
                  <span className={cn("text-xs", overdue ? "text-red-400" : "text-muted-foreground")}>
                    {r.status === "open" ? dueLabel(r.due_at as number) : fmtDate(r.due_at as number)}
                  </span>
                </div>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
