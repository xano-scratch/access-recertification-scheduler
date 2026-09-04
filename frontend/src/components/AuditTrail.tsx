import { useEffect, useState } from "react";
import { api, type AuditRow } from "@/lib/api";
import { DecisionBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";
import { fmtDateTime } from "@/lib/format";
import { ScrollText } from "lucide-react";

export function AuditTrail({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setError(null);
    api
      .listAudit()
      .then((r) => live && setRows(r))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Failed to load audit trail"));
    return () => {
      live = false;
    };
  }, [refreshKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 font-semibold">
          <ScrollText className="size-4" /> Audit trail
        </h2>
        <p className="text-muted-foreground text-sm">
          Every sign-off and revocation, newest first. Append only: a decision is written once and never
          changed.
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {rows && rows.length === 0 && !error && (
        <Card className="text-muted-foreground p-10 text-center text-sm">
          No decisions recorded yet. Sign off or revoke a review to write the first audit entry.
        </Card>
      )}

      {rows && rows.length > 0 && (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-border/60 text-muted-foreground border-b text-left text-xs">
                <tr>
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">Decision</th>
                  <th className="px-4 py-2.5 font-medium">Reviewer</th>
                  <th className="px-4 py-2.5 font-medium">Access</th>
                  <th className="px-4 py-2.5 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-border/60 divide-y">
                {rows.map((r) => (
                  <tr key={r.id as number}>
                    <td className="text-muted-foreground px-4 py-2.5 whitespace-nowrap">
                      {fmtDateTime(r.acted_at as number)}
                    </td>
                    <td className="px-4 py-2.5">
                      <DecisionBadge decision={r.decision} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{r.reviewer_name}</span>
                      <span className="text-muted-foreground"> · {r.reviewer_role.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium">{r.employee_name}</span>
                      <span className="text-muted-foreground"> · {r.system_name}</span>
                    </td>
                    <td className="text-muted-foreground max-w-xs truncate px-4 py-2.5">{r.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
