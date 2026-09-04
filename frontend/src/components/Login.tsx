import { useState } from "react";
import { api, setToken, ApiError, type Role } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleBadge } from "@/components/badges";
import { ShieldCheck, Database, ArrowRight } from "lucide-react";

const DEMO: { role: Role; name: string; email: string; blurb: string }[] = [
  { role: "compliance_admin", name: "Alice Nguyen", email: "alice@bank.example", blurb: "Runs the scan, reviews access, reads the audit trail." },
  { role: "reviewer", name: "Ravi Patel", email: "ravi@bank.example", blurb: "Signs off and revokes access, reads the audit trail." },
  { role: "viewer", name: "Val Ortiz", email: "val@bank.example", blurb: "Read only: can audit decisions, cannot act on them." },
];
const DEMO_PASSWORD = "recert-demo";

export function Login({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState<string | null>(null);

  async function doLogin(em: string, pw: string, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await api.login({ email: em, password: pw });
      setToken(res.token as string);
      onAuthed();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401)
        setError("Invalid credentials. If this is a fresh deploy, load the demo data first.");
      else setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(null);
    }
  }

  async function loadDemo() {
    setBusy("seed");
    setError(null);
    try {
      await api.seed();
      setSeeded("Demo data loaded. Pick a user below to sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load demo data");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-8 p-6">
      <div className="space-y-3 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Access Recertification Scheduler</h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-sm">
          A governed backend for periodic access recertification. Sign in as a seeded user to see the
          role-gated review workflow and the audit trail.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {DEMO.map((d) => (
          <Card key={d.email} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{d.name}</span>
              <RoleBadge role={d.role} />
            </div>
            <p className="text-muted-foreground min-h-10 text-xs">{d.blurb}</p>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy !== null}
              onClick={() => doLogin(d.email, DEMO_PASSWORD, d.email)}
            >
              {busy === d.email ? "Signing in…" : "Sign in"} <ArrowRight />
            </Button>
          </Card>
        ))}
      </div>

      <Card className="space-y-4 p-5">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            doLogin(email, password, "manual");
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alice@bank.example" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="recert-demo" />
          </div>
          <Button type="submit" disabled={busy !== null}>
            {busy === "manual" ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="border-border/60 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            First run on a fresh deploy? Load the sample users, employees, and entitlements.
          </p>
          <Button size="sm" variant="outline" disabled={busy !== null} onClick={loadDemo}>
            <Database /> {busy === "seed" ? "Loading…" : "Load demo data"}
          </Button>
        </div>
        {seeded && <p className="text-xs text-emerald-400">{seeded}</p>}
        {error && <p className="text-destructive text-xs">{error}</p>}
      </Card>
    </main>
  );
}
