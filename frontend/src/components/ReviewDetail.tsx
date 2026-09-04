import { useEffect, useState } from "react";
import { api, ApiError, type Me, type ReviewDetailResult } from "@/lib/api";
import { RiskBadge, ReviewStatusBadge, DecisionBadge, EmployeeStatusBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtDate, fmtDateTime, dueLabel } from "@/lib/format";
import { Check, Ban, Lock, ClipboardList } from "lucide-react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function ReviewDetail({
  reviewId,
  me,
  refreshKey,
  onActioned,
}: {
  reviewId: number;
  me: Me;
  refreshKey: number;
  onActioned: () => void;
}) {
  const [data, setData] = useState<ReviewDetailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setData(null);
    setError(null);
    setActionError(null);
    setNote("");
    api
      .getReview(reviewId)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Failed to load review"));
    return () => {
      live = false;
    };
  }, [reviewId, refreshKey]);

  async function act(kind: "signoff" | "revoke") {
    setBusy(kind);
    setActionError(null);
    try {
      if (kind === "signoff") await api.signoff(reviewId, note || undefined);
      else await api.revoke(reviewId, note || undefined);
      onActioned();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (error)
    return (
      <Card className="p-6 text-sm">
        <p className="text-destructive">{error}</p>
      </Card>
    );
  if (!data || !data.review) return <Card className="text-muted-foreground p-6 text-sm">Loading review…</Card>;

  const { review, policy, employee, entitlement, history } = data;
  const canAct = me.role === "reviewer" || me.role === "compliance_admin";
  const isOpen = review.status === "open";

  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{review.employee_name}</span>
            {employee && <EmployeeStatusBadge status={employee.status} />}
          </div>
          <p className="text-muted-foreground text-sm">
            {review.system_name} · {review.access_level}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ReviewStatusBadge status={review.status} />
          <RiskBadge tier={review.risk_tier} />
        </div>
      </div>

      <div className="border-border/60 bg-muted/30 rounded-md border px-3 py-2 text-sm">
        <span className="text-muted-foreground">Why flagged: </span>
        {review.reason}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {employee && <Field label="Department">{employee.department}</Field>}
        {policy && (
          <Field label="Review interval">
            {policy.interval_days} days
            {policy.require_dual_signoff ? " · dual sign-off" : ""}
          </Field>
        )}
        <Field label="Opened">{fmtDate(review.opened_at as number)}</Field>
        <Field label="Due">
          {fmtDate(review.due_at as number)}
          {isOpen && <span className="text-muted-foreground"> ({dueLabel(review.due_at as number)})</span>}
        </Field>
        {entitlement && (
          <Field label="Entitlement status">
            <span className="capitalize">{entitlement.status}</span>
          </Field>
        )}
        {entitlement && (
          <Field label="Last recertified">{fmtDate(entitlement.last_recertified_at as number | null)}</Field>
        )}
      </div>

      {isOpen && canAct && (
        <div className="border-border/60 flex flex-col gap-3 border-t pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="note">Decision note (optional)</Label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Confirmed still required for role" />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy !== null} onClick={() => act("signoff")}>
              <Check /> {busy === "signoff" ? "Signing off…" : "Sign off"}
            </Button>
            <Button className="flex-1" variant="destructive" disabled={busy !== null} onClick={() => act("revoke")}>
              <Ban /> {busy === "revoke" ? "Revoking…" : "Revoke access"}
            </Button>
          </div>
          {actionError && <p className="text-destructive text-xs">{actionError}</p>}
        </div>
      )}

      {isOpen && !canAct && (
        <div className="border-border/60 text-muted-foreground flex items-center gap-2 border-t pt-4 text-sm">
          <Lock className="size-4" /> Read-only role: viewers can audit decisions but not act on them.
        </div>
      )}

      {!isOpen && (
        <div className="border-border/60 border-t pt-4 text-sm">
          This review was {review.status === "signed_off" ? "signed off" : "revoked"} and cannot be actioned again.
        </div>
      )}

      <div className="space-y-2">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <ClipboardList className="size-3.5" /> Decision history
        </p>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">No decisions recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id as number} className="border-border/60 rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <DecisionBadge decision={h.decision} />
                  <span className="text-muted-foreground text-xs">{fmtDateTime(h.acted_at as number)}</span>
                </div>
                <p className="mt-1">
                  <span className="font-medium">{h.reviewer_name}</span>{" "}
                  <span className="text-muted-foreground">({h.reviewer_role.replace(/_/g, " ")})</span>
                </p>
                {h.note && <p className="text-muted-foreground mt-0.5">{h.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
