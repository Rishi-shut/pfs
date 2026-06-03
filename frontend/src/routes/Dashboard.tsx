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

  function downloadInsightsPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const formattedDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const formatAudit = (audit: Record<string, any>) => {
      if (!audit) return "";
      const keyLabels: Record<string, string> = {
        cluster_size: "Number of Transactions",
        cv: "Delta Variation (CV)",
        median_delta_days: "Average Interval (Days)",
        amount_variance_pct: "Amount Variance",
        merchant: "Merchant",
        cadence: "Cadence",
        dormancy: "Dormant Status",
        bucket: "Analysis Category/Day",
        bucket_size: "Compared Transactions Count",
        median: "Typical Spend (Median)",
        method: "Statistical Standard",
        prior_inr: "Spend in First Half",
        recent_inr: "Spend in Second Half",
        window_midpoint: "Comparison Date",
        category: "Category",
        delta_pp: "Percentage Point Shift",
        threshold_inr: "Micro-spend Limit",
        ratio_threshold_pct: "Leakage Target",
        total_spend_inr: "Total Spend Analyzed",
        tx_count: "Micro-charge Count",
        leak_ratio_pct: "Share of Budget",
        sample_merchants: "Top Merchants Involved",
        salary_inr: "Detected Income Amount",
        post_days_window: "Spike Window Tracked",
        baseline_days_count: "Baseline Days Measured",
        post_daily_avg_inr: "Post-Payday Daily Average",
      };

      const formatValue = (k: string, v: any) => {
        if (k.endsWith("_inr") || k === "median" || k === "prior_inr" || k === "recent_inr" || k === "salary_inr" || k === "post_daily_avg_inr") {
          return Number(v).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
        }
        if (k.endsWith("_pct") || k === "delta_pp" || k === "ratio_threshold_pct") {
          return `${v}%`;
        }
        if (Array.isArray(v)) {
          return v.join(", ");
        }
        if (typeof v === "boolean") {
          return v ? "Yes" : "No";
        }
        return String(v);
      };

      return Object.entries(audit)
        .filter(([k]) => k !== "rule_version" && k !== "method")
        .map(([k, v]) => {
          const label = keyLabels[k] || k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          const val = formatValue(k, v);
          return `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px;">
              <span style="color: #64748b; font-weight: 500;">${label}</span>
              <span style="color: #334155; font-weight: 600;">${val}</span>
            </div>
          `;
        })
        .join("");
    };

    const insightsHTML = insights.map((i, idx) => {
      const formattedAmt = Number(i.impact_monthly_inr).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      });
      return `
        <div class="insight-card">
          <div class="card-header">
            <h3 class="title">${idx + 1}. ${i.title}</h3>
            <span class="badge ${i.confidence}">${i.confidence} Confidence</span>
          </div>
          <div class="impact-row">
            <span class="impact-val">${formattedAmt}</span>
            <span class="impact-lbl">/mo projected impact</span>
          </div>
          <p class="detail">${i.detail}</p>
          <div class="audit-section">
            <div class="audit-title">Metrics & Verification</div>
            <div class="audit-list">
              ${formatAudit(i.audit)}
            </div>
          </div>
        </div>
      `;
    }).join("");

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pulse PFS — Personal Financial Insights Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              color: #0f172a;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.5;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .brand {
              font-family: 'Outfit', sans-serif;
              font-size: 26px;
              font-weight: 700;
              color: #0f172a;
              letter-spacing: -0.025em;
            }
            .date-badge {
              font-size: 12px;
              color: #64748b;
              background-color: #f1f5f9;
              padding: 6px 12px;
              border-radius: 9999px;
              font-weight: 500;
            }
            .user-info {
              margin-bottom: 30px;
              font-size: 15px;
              color: #475569;
            }
            .user-info strong {
              color: #0f172a;
            }
            .insight-card {
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 24px;
              margin-bottom: 20px;
              background-color: #ffffff;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              page-break-inside: avoid;
            }
            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 12px;
            }
            .title {
              font-family: 'Outfit', sans-serif;
              font-size: 18px;
              font-weight: 600;
              margin: 0;
              color: #0f172a;
            }
            .badge {
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 4px 10px;
              border-radius: 9999px;
              white-space: nowrap;
            }
            .badge.high {
              background-color: #d1fae5;
              color: #065f46;
            }
            .badge.med {
              background-color: #fef3c7;
              color: #92400e;
            }
            .badge.low {
              background-color: #f1f5f9;
              color: #475569;
            }
            .impact-row {
              margin-top: 12px;
              display: flex;
              align-items: baseline;
              gap: 6px;
            }
            .impact-val {
              font-family: 'Outfit', sans-serif;
              font-size: 28px;
              font-weight: 700;
              color: #2563eb;
            }
            .impact-lbl {
              font-size: 12px;
              color: #64748b;
              font-weight: 500;
            }
            .detail {
              font-size: 14px;
              color: #334155;
              margin: 14px 0 0 0;
              line-height: 1.6;
            }
            .audit-section {
              margin-top: 20px;
              border-top: 1px solid #f1f5f9;
              padding-top: 16px;
            }
            .audit-title {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              margin-bottom: 8px;
            }
            .audit-list {
              background-color: #f8fafc;
              border: 1px solid #f1f5f9;
              padding: 12px 18px;
              border-radius: 12px;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 24px;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="brand">✦ Pulse PFS Report</div>
            <div class="date-badge">${formattedDate}</div>
          </div>
          <div class="user-info">
            Financial Insights Report generated for <strong>${session.name || "User"}</strong>.
          </div>
          <div class="insights-container">
            ${insightsHTML || '<p>No insights found.</p>'}
          </div>
          <div class="footer">
            Pulse Personal Finance Suite (PFS) • Confidential Financial Document
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  }

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
              onClick={downloadInsightsPDF}
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
