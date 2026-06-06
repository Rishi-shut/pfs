import { useState } from "react";
import type { HeatmapPoint } from "../../types";

const CELL = 16;
const GAP = 3;

function getEventColor(events?: { type: string; label: string }[]) {
  if (!events || events.length === 0) return "hsl(var(--muted))";
  if (events.some((e) => e.type === "anomaly")) return "#ef4444"; // Red
  if (events.some((e) => e.type === "payday")) return "#10b981"; // Green
  if (events.some((e) => e.type === "subscription")) return "#3b82f6"; // Blue
  return "hsl(var(--accent))";
}

export default function EventHeatmap({ points }: { points: HeatmapPoint[] }) {
  const [hover, setHover] = useState<HeatmapPoint | null>(null);
  if (!points.length) return null;

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
    <div className="relative mt-2">
      <svg
        width={maxLen * (CELL + GAP)}
        height={7 * (CELL + GAP)}
        className="overflow-visible"
      >
        {cells.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (!cell) return null;
            const fillColor = getEventColor(cell.events);
            const hasEvent = cell.events && cell.events.length > 0;
            return (
              <rect
                key={`${rowIdx}-${colIdx}`}
                x={`${(colIdx / maxLen) * 100}%`}
                y={rowIdx * (CELL + GAP)}
                width={`${(1 / maxLen) * 90}%`}
                height={CELL}
                rx={2}
                fill={fillColor}
                fillOpacity={hasEvent ? 1 : 0.3}
                onMouseEnter={() => setHover(cell)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer transition-all hover:stroke-foreground hover:stroke-1"
              />
            );
          }),
        )}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Payday
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Subscription
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Anomaly
          </div>
        </div>
      </div>

      {hover && hover.events && hover.events.length > 0 && (
        <div className="absolute top-0 right-0 -mt-8 rounded-md border border-border bg-background px-3 py-2 text-[10px] font-mono shadow-md z-10 max-w-[200px]">
          <div className="font-semibold text-foreground mb-1">{hover.date}</div>
          {hover.events.map((e, i) => (
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
