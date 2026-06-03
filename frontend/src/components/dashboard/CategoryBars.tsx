import type { CategoryTotal } from "../../types";
import { formatINR } from "../../lib/utils";

export default function CategoryBars({ categories }: { categories: CategoryTotal[] }) {
  if (!categories.length) return null;
  const max = Math.max(...categories.map((c) => c.amount));
  const top = categories.slice(0, 6);
  return (
    <div className="space-y-2.5">
      {top.map((c) => (
        <div key={c.name}>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-foreground">{c.name}</span>
            <span className="text-muted-foreground">
              {formatINR(c.amount)} · {c.pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(c.amount / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
