import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "../../lib/api";
import { session } from "../../lib/session";
import { formatINR } from "../../lib/utils";
import { Button } from "../ui/button";
import type { CategoryTotal, SimulateResult } from "../../types";

export default function WhatIfSimulator({
  open,
  categories,
  onClose,
}: {
  open: boolean;
  categories: CategoryTotal[];
  onClose: () => void;
}) {
  const [deltas, setDeltas] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SimulateResult | null>(null);

  const topCats = useMemo(() => categories.slice(0, 5), [categories]);

  useEffect(() => {
    if (!open) return;
    const sid = session.id;
    if (!sid) return;
    const t = setTimeout(() => {
      api.simulate(sid, deltas).then(setResult).catch(() => setResult(null));
    }, 200);
    return () => clearTimeout(t);
  }, [deltas, open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/40 z-40 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display text-2xl">
              <em className="italic">What if</em> you cut these?
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {topCats.map((c) => {
              const val = deltas[c.name] ?? 0;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">
                      {formatINR(c.amount)} · cut {val}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={5}
                    value={val}
                    onChange={(e) =>
                      setDeltas({ ...deltas, [c.name]: Number(e.target.value) })
                    }
                    className="w-full accent-[hsl(var(--accent))]"
                  />
                </div>
              );
            })}

            <div className="rounded-xl bg-accent/5 border border-accent/20 p-5 mt-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Projected impact
              </div>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Monthly</div>
                  <div className="font-display text-2xl text-accent">
                    {formatINR(result?.monthly_savings_inr || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Annual</div>
                  <div className="font-display text-2xl text-foreground">
                    {formatINR(result?.annual_savings_inr || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">5 years @ 8%</div>
                  <div className="font-display text-2xl text-foreground">
                    {formatINR(result?.five_year_compounded_inr || 0, { compact: true })}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground italic">
                Compounded monthly at 8% annual return — the framing that beats present bias.
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={onClose} className="rounded-full px-5">Close</Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
