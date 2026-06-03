import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, MessageSquare, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { session } from "../lib/session";
import type { DashboardData, Insight } from "../types";
import { Button } from "../components/ui/button";
import InsightFeed from "../components/dashboard/InsightFeed";
import SankeyChart from "../components/dashboard/SankeyChart";
import CalendarHeatmap from "../components/dashboard/CalendarHeatmap";
import CategoryBars from "../components/dashboard/CategoryBars";
import WhatIfSimulator from "../components/dashboard/WhatIfSimulator";
import AgentPanel from "../components/dashboard/AgentPanel";
import ReportPreviewModal from "../components/dashboard/ReportPreviewModal";

export default function Dashboard() {
  const nav = useNavigate();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [whatIf, setWhatIf] = useState(false);
  const [agent, setAgent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const sid = session.id;
    if (!sid) {
      nav("/try");
      return;
    }
    Promise.all([api.insights(sid), api.dashboard(sid)])
      .then(([ins, d]) => {
        setInsights(ins);
        setDash(d);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [nav]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const [reportOpen, setReportOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (err) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-sm text-red-500">{err}</p>
        <Button onClick={() => nav("/try")}>Start over</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Top bar */}
      <header className="bg-background border-b border-border px-6 lg:px-12 py-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          ✦ Fiserv Agent
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Hi, {session.name}</span>
          <Button
            variant="ghost"
            onClick={() => {
              session.clear();
              nav("/");
            }}
            className="text-xs h-8 rounded-full px-3"
          >
            <LogOut className="h-3 w-3 mr-1" /> Sign out
          </Button>
        </div>
      </header>

      <main className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {/* Insights — 2/5 */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl tracking-tight">
              Your <em className="italic">ranked</em> insights
            </h2>
            <Button
              onClick={() => setReportOpen(true)}
              variant="outline"
              className="text-xs rounded-full h-8 px-3 shrink-0"
            >
              Download PDF
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ordered by impact × confidence × actionability.
          </p>
          <InsightFeed
            insights={insights}
            onAction={(i) => showToast(`Proposal sent: ${i.action_type} → ${i.action_target}`)}
          />
        </section>

        {/* Charts — 3/5 */}
        <section className="lg:col-span-3 space-y-6">
          {dash && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl">Where your money flowed</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Income → categories · 30-day window
                    </p>
                  </div>
                  <Button
                    onClick={() => setWhatIf(true)}
                    variant="outline"
                    className="text-xs rounded-full"
                  >
                    What if…
                  </Button>
                </div>
                <div className="mt-3">
                  <SankeyChart data={dash.sankey} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <h3 className="font-display text-xl">Daily spend density</h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                  Darker = higher spend. Notice the payday cliff.
                </p>
                <CalendarHeatmap points={dash.heatmap} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-2xl border border-border bg-background p-5"
              >
                <h3 className="font-display text-xl">Top categories</h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                  Horizontal bars beat pie charts on perceptual accuracy.
                </p>
                <CategoryBars categories={dash.categories} />
              </motion.div>
            </>
          )}
        </section>
      </main>

      {/* Floating Agent button */}
      <button
        onClick={() => setAgent(true)}
        className="fixed bottom-6 right-6 z-30 rounded-full bg-foreground text-background h-12 px-5 shadow-lg hover:opacity-90 flex items-center gap-2 text-sm font-medium"
      >
        <MessageSquare className="h-4 w-4" />
        Ask Fiserv Agent
        <Sparkles className="h-3 w-3 text-accent" />
      </button>

      {/* What-if modal */}
      <WhatIfSimulator
        open={whatIf}
        categories={dash?.categories || []}
        onClose={() => setWhatIf(false)}
      />

      {/* Report Preview modal */}
      <ReportPreviewModal
        open={reportOpen}
        insights={insights}
        onClose={() => setReportOpen(false)}
      />

      {/* Agent panel */}
      <AgentPanel open={agent} onClose={() => setAgent(false)} />

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-6 z-30 rounded-lg bg-foreground text-background px-4 py-2 text-xs shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
