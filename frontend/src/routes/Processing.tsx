import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { api } from "../lib/api";
import { session } from "../lib/session";
import type { ProcessStage } from "../types";

export default function Processing() {
  const nav = useNavigate();
  const [stages, setStages] = useState<ProcessStage[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!session.id) {
      nav("/try");
      return;
    }
    const es = api.processSSE(session.id);

    es.onmessage = (ev) => {
      try {
        const data: ProcessStage = JSON.parse(ev.data);
        setStages((s) => [...s, data]);
        if (data.stage === "done") {
          setDone(true);
          es.close();
          setTimeout(() => nav("/dashboard"), 800);
        }
        if (data.stage === "error") {
          es.close();
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl md:text-5xl tracking-tight text-foreground text-center"
        >
          <em className="italic">Reading</em> your spend.
        </motion.h1>
        <p className="mt-3 text-center text-sm text-muted-foreground font-body">
          The LLM is bounded — detection itself is deterministic and auditable.
        </p>

        <div className="mt-10 space-y-2 font-mono text-sm">
          <AnimatePresence initial={false}>
            {stages.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-2 text-foreground"
              >
                <Check
                  className={`h-4 w-4 mt-0.5 shrink-0 ${
                    s.stage === "error" ? "text-red-500" : "text-emerald-600"
                  }`}
                />
                <span className="text-[13px] leading-relaxed">{s.detail}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {!done && stages.length > 0 && (
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-xs text-muted-foreground mt-4"
            >
              ▸ thinking…
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
