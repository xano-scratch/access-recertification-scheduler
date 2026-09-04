import { useCallback, useEffect, useState } from "react";
import { api, setToken, getToken, type Me, type ScanResult } from "@/lib/api";
import { Login } from "@/components/Login";
import { ReviewsQueue } from "@/components/ReviewsQueue";
import { ReviewDetail } from "@/components/ReviewDetail";
import { AuditTrail } from "@/components/AuditTrail";
import { RoleBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Play, RotateCcw, LogOut, ScrollText, ListChecks, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_EMAIL: Record<string, string> = {
  admin: "alice@bank.example",
  reviewer: "ravi@bank.example",
  viewer: "val@bank.example",
};
const DEMO_PASSWORD = "recert-demo";

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<"queue" | "audit">("queue");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    const m = await api.me();
    setMe(m);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Deep-link a pre-selected review: ?review=<id> (used by demo links).
    const reviewParam = params.get("review");
    if (reviewParam && /^\d+$/.test(reviewParam)) setSelectedId(Number(reviewParam));
    (async () => {
      try {
        if (getToken()) {
          await loadMe();
          return;
        }
        // One-click demo links: ?demo=admin | reviewer | viewer
        const demo = params.get("demo");
        if (demo && DEMO_EMAIL[demo]) {
          const res = await api.login({ email: DEMO_EMAIL[demo], password: DEMO_PASSWORD });
          setToken(res.token as string);
          await loadMe();
        }
      } catch {
        setToken(null);
      } finally {
        setBooting(false);
      }
    })();
  }, [loadMe]);

  const refresh = () => setRefreshKey((k) => k + 1);

  function logout() {
    setToken(null);
    setMe(null);
    setSelectedId(null);
    setScan(null);
    setNotice(null);
  }

  async function runScan() {
    setBusy("scan");
    setNotice(null);
    try {
      const r = await api.runScan();
      setScan(r);
      setNotice(`Scan complete: ${r.flagged} newly flagged, ${r.already_open} already open, ${r.scanned} active entitlements checked.`);
      refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(null);
    }
  }

  async function resetDemo() {
    setBusy("seed");
    setNotice(null);
    try {
      await api.seed();
      setSelectedId(null);
      setScan(null);
      setNotice("Demo data reset. Run the recertification scan to flag overdue access.");
      refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(null);
    }
  }

  if (booting) {
    return (
      <main className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
        Loading…
      </main>
    );
  }

  if (!me) return <Login onAuthed={() => { setBooting(true); loadMe().finally(() => setBooting(false)); }} />;

  const isAdmin = me.role === "compliance_admin";

  return (
    <div className="min-h-screen">
      <header className="border-border/60 bg-card/50 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="mr-auto">
            <h1 className="text-sm leading-tight font-semibold">Access Recertification Scheduler</h1>
            <p className="text-muted-foreground text-xs leading-tight">Governed periodic access review</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm">{me.name}</span>
            <RoleBadge role={me.role} />
          </div>
          <Button size="sm" variant="ghost" onClick={logout}>
            <LogOut /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="bg-muted flex rounded-lg p-1">
            <button
              onClick={() => setTab("queue")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === "queue" ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              <ListChecks className="size-4" /> Review queue
            </button>
            <button
              onClick={() => setTab("audit")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === "audit" ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              <ScrollText className="size-4" /> Audit trail
            </button>
          </div>

          {isAdmin && tab === "queue" && (
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={busy !== null} onClick={resetDemo}>
                <RotateCcw /> {busy === "seed" ? "Resetting…" : "Reset demo data"}
              </Button>
              <Button size="sm" disabled={busy !== null} onClick={runScan}>
                <Play /> {busy === "scan" ? "Running…" : "Run recertification now"}
              </Button>
            </div>
          )}
        </div>

        {notice && (
          <div className="border-border/60 bg-muted/40 mb-4 rounded-md border px-3 py-2 text-sm">{notice}</div>
        )}

        {tab === "queue" ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <ReviewsQueue me={me} selectedId={selectedId} onSelect={setSelectedId} refreshKey={refreshKey} />
            <div>
              {selectedId != null ? (
                <ReviewDetail
                  reviewId={selectedId}
                  me={me}
                  refreshKey={refreshKey}
                  onActioned={() => refresh()}
                />
              ) : (
                <div className="border-border/60 text-muted-foreground flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm">
                  <MousePointerClick className="size-5" />
                  Select a review to see its context and act on it.
                </div>
              )}
            </div>
          </div>
        ) : (
          <AuditTrail refreshKey={refreshKey} />
        )}
      </main>
    </div>
  );
}
