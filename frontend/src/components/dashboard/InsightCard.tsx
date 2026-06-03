import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { Insight } from "../../types";
import { formatINR } from "../../lib/utils";
import { Button } from "../ui/button";

const ACTION_LABELS: Record<string, string> = {
  cancel_sub: "Cancel subscription",
  auto_sweep: "Auto-sweep on payday",
  set_cap: "Set spending cap",
  awareness: "Acknowledge",
};

const CONF_STYLES: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700",
  med: "bg-amber-100 text-amber-700",
  low: "bg-secondary text-muted-foreground",
};

function highlightVerb(title: string): React.ReactNode {
  const verbs = ["Cancel", "Auto-sweep", "Plug", "Set", "Reduce"];
  for (const v of verbs) {
    if (title.startsWith(v)) {
      const rest = title.slice(v.length);
      return (
        <>
          <em className="italic font-display">{v}</em>
          <span className="font-body">{rest}</span>
        </>
      );
    }
  }
  return title;
}

export default function InsightCard({
  insight,
  index,
  onAction,
}: {
  insight: Insight;
  index: number;
  onAction?: (i: Insight) => void;
}) {
  const [open, setOpen] = useState(false);
  const [actioned, setActioned] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-2xl border border-border bg-background p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg leading-snug text-foreground">{highlightVerb(insight.title)}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CONF_STYLES[insight.confidence] || ""}`}>
          {insight.confidence}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-3xl text-accent">
          {formatINR(insight.impact_monthly_inr)}
        </span>
        <span className="text-xs text-muted-foreground">/mo impact</span>
      </div>

      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{insight.detail}</p>

      <div className="mt-4 flex items-center gap-2">
        {insight.action_type && (
          <Button
            onClick={() => {
              setActioned(true);
              onAction?.(insight);
            }}
            disabled={actioned}
            className="rounded-full px-4 text-xs h-8"
          >
            {actioned ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Proposal sent</span>
            ) : (
              ACTION_LABELS[insight.action_type] || "Take action"
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => setOpen(!open)}
          className="rounded-full px-3 text-xs h-8 text-muted-foreground"
        >
          {open ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          Why?
        </Button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-border"
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Audit trail · rule_id <code className="text-foreground">{insight.rule_id}</code>
          </div>
          <pre className="text-[10px] bg-secondary/40 rounded p-2 overflow-x-auto font-mono text-foreground">
{JSON.stringify(insight.audit, null, 2)}
          </pre>
          <p className="mt-2 text-[10px] text-muted-foreground italic">
            Every recommendation is auditable. That's how a Fiserv-grade PFM ships to regulators.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
