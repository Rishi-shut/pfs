import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ShieldCheck, Activity } from "lucide-react";
// @ts-ignore
import html2pdf from "html2pdf.js";
import { session } from "../../lib/session";
import { formatINR } from "../../lib/utils";
import { Button } from "../ui/button";
import type { Insight } from "../../types";

const KEY_LABELS: Record<string, string> = {
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

export default function ReportPreviewModal({
  open,
  insights,
  onClose,
}: {
  open: boolean;
  insights: Insight[];
  onClose: () => void;
}) {
  const formattedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formatValue = (k: string, v: any) => {
    if (k.endsWith("_inr") || k === "median" || k === "prior_inr" || k === "recent_inr" || k === "salary_inr" || k === "post_daily_avg_inr") {
      return formatINR(Number(v));
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

  const handleDownload = () => {
    const element = document.getElementById("report-sheet");
    if (!element) return;

    const opt = {
      margin: 0.3,
      filename: `Pulse_PFS_Report_${session.name || "User"}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "in" as const, format: "letter" as const, orientation: "portrait" as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 35, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 35, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-secondary rounded-2xl border border-border shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">Report Export Preview</h2>
              <p className="text-xs text-muted-foreground">Verify the generated report below before saving as PDF.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownload} className="rounded-full px-4 py-2 text-xs font-semibold gap-1.5 h-9">
                <Download className="h-3.5 w-3.5" /> Download PDF
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sheet Preview Container (scrollable) */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-muted/40">
            {/* The Sheet */}
            <div id="report-sheet" className="w-full max-w-[800px] bg-background border border-border rounded-xl shadow-lg p-10 text-left text-foreground select-text font-body leading-relaxed flex flex-col min-h-[1050px]">
              {/* Header inside sheet */}
              <div className="flex justify-between items-center border-b-2 border-muted pb-4 mb-6">
                <div className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Activity className="h-6 w-6 text-accent" /> Pulse PFS Report
                </div>
                <div className="text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                  {formattedDate}
                </div>
              </div>

              {/* User info inside sheet */}
              <div className="text-sm text-muted-foreground mb-8">
                Financial Insights Report generated for <strong className="text-foreground">{session.name || "User"}</strong>.
              </div>

              {/* Insights list */}
              <div className="space-y-6 flex-1">
                {insights.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No insights found.</p>
                ) : (
                  insights.map((i, idx) => (
                    <div key={i.id} className="border border-border rounded-xl p-6 bg-background space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {idx + 1}. {i.title}
                        </h3>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${i.confidence === "high" ? "bg-emerald-100 text-emerald-700" :
                            i.confidence === "med" ? "bg-amber-100 text-amber-700" :
                              "bg-secondary text-muted-foreground"
                          }`}>
                          {i.confidence} Confidence
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-2xl font-bold text-accent">
                          {formatINR(Number(i.impact_monthly_inr))}
                        </span>
                        <span className="text-xs text-muted-foreground">/mo projected impact</span>
                      </div>

                      <p className="text-sm text-muted-foreground">{i.detail}</p>

                      <div className="border-t border-border pt-4 mt-2 space-y-3">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Metrics & Verification
                        </h4>
                        <div className="bg-secondary/40 border border-border/50 rounded-xl px-4 py-2 text-xs">
                          {Object.entries(i.audit)
                            .filter(([k]) => k !== "rule_version" && k !== "method")
                            .map(([k, v]) => (
                              <div key={k} className="flex justify-between py-2 border-b border-border/30 last:border-b-0">
                                <span className="text-muted-foreground font-medium">{KEY_LABELS[k] || k}</span>
                                <span className="text-foreground font-semibold">{formatValue(k, v)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer inside sheet */}
              <div className="mt-12 pt-6 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> Pulse Personal Finance Suite
                </span>
                <span>Confidential Document</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
