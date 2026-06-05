import { useState } from "react";
import type { HeatmapPoint } from "../../types";
import { formatINR } from "../../lib/utils";

const CELL = 16;
const GAP = 3;

function intensity(amount: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, amount / max);
}

export default function CalendarHeatmap({ points }: { points: HeatmapPoint[] }) {
  const [hover, setHover] = useState<HeatmapPoint | null>(null);
  if (!points.length) return <div className="text-xs text-muted-foreground">No daily data.</div>;

  const max = Math.max(...points.map((p) => p.amount));

  // Group by week (Mon-Sun)
  const byDate = new Map(points.map((p) => [p.date, p]));
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date);
  const last = new Date(sorted[sorted.length - 1].date);

  // Build a 7-row (Mon-Sun) × N-col grid
  const cells: ({ date: string; amount: number; events?: any[] } | null)[][] = Array.from({ length: 7 }, () => []);
  const startDow = (first.getDay() + 6) % 7; // 0=Mon
  // Pad leading days
  for (let i = 0; i < startDow; i++) cells[i].push(null);

  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const point = byDate.get(iso);
    const dow = (d.getDay() + 6) % 7;
    cells[dow].push(point ? { date: iso, amount: point.amount, events: point.events } : { date: iso, amount: 0, events: [] });
  }
  // Pad trailing
  const maxLen = Math.max(...cells.map((r) => r.length));
  cells.forEach((r) => {
    while (r.length < maxLen) r.push(null);
  });

  return (
    <div className="relative">
      <svg
        width={maxLen * (CELL + GAP)}
        height={7 * (CELL + GAP)}
        className="overflow-visible"
      >
        {cells.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (!cell) return null;
            const op = intensity(cell.amount, max);
            return (
              <g key={`${rowIdx}-${colIdx}`}>
                <rect
                  x={`${(colIdx / maxLen) * 100}%`}
                  y={rowIdx * (CELL + GAP)}
                  width={`${(1 / maxLen) * 90}%`}
                  height={CELL}
                  rx={2}
                  fill="hsl(var(--accent))"
                  fillOpacity={0.05 + op * 0.9}
                  onMouseEnter={() => setHover(cell)}
                  onMouseLeave={() => setHover(null)}
                  className="cursor-pointer transition-all hover:stroke-foreground hover:stroke-1"
                />
                {cell.events && cell.events.length > 0 && (
                  <circle
                    cx={`${((colIdx + 0.7) / maxLen) * 100}%`}
                    cy={rowIdx * (CELL + GAP) + 4}
                    r={3}
                    fill={cell.events.some(e => e.type === 'payday') ? '#10b981' : cell.events.some(e => e.type === 'anomaly') ? '#ef4444' : '#3b82f6'}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          }),
        )}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{first.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {[0.1, 0.3, 0.6, 0.9].map((op) => (
            <div
              key={op}
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: `hsl(var(--accent) / ${op})` }}
            />
          ))}
          <span>More</span>
        </div>
        <span>{last.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
      </div>

      {hover && (
        <div className="absolute top-0 right-0 -mt-10 rounded-md border border-border bg-background px-3 py-2 text-[10px] font-mono shadow-md z-10 max-w-[200px]">
          <div className="font-semibold text-foreground mb-1">{hover.date} · {formatINR(hover.amount)}</div>
          {hover.events && hover.events.map((e, i) => (
            <div key={i} className="text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${e.type === 'payday' ? 'bg-emerald-500' : e.type === 'anomaly' ? 'bg-red-500' : 'bg-blue-500'}`} />
              {e.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
