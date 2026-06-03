import type { Insight } from "../../types";
import InsightCard from "./InsightCard";

export default function InsightFeed({
  insights,
  onAction,
}: {
  insights: Insight[];
  onAction?: (i: Insight) => void;
}) {
  if (!insights.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">No insights yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {insights.map((i, idx) => (
        <InsightCard key={i.id} insight={i} index={idx} onAction={onAction} />
      ))}
    </div>
  );
}
