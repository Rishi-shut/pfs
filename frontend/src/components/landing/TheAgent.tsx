import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ShieldCheck, Database, BrainCircuit, Play, Sparkles, Terminal } from "lucide-react";

type SimStep = {
  type: "user" | "tool" | "assistant";
  text: string;
  delay: number;
};

const SIMULATIONS: Record<string, SimStep[]> = {
  leaks: [
    { type: "user", text: "Check for any subscription leaks or price hikes.", delay: 800 },
    { type: "tool", text: "🔧 Calling: list_recurring_transactions()", delay: 1000 },
    { type: "tool", text: "🔧 Calling: detect_price_hikes()", delay: 800 },
    { type: "assistant", text: "I found 2 leaks:\n\n• 🔴 **Netflix** price increased from $15.49 to $22.99/mo (48% hike).\n• 💤 **Cloud Storage** ($9.99/mo) has had 0.0 GB usage for 90 days.", delay: 1500 },
  ],
  dining: [
    { type: "user", text: "What if I cut Food & Dining spending by 25%?", delay: 800 },
    { type: "tool", text: "🔧 Calling: get_category_totals(category='Food')", delay: 900 },
    { type: "tool", text: "🔧 Calling: calculate_budget_scenarios(reduction=0.25)", delay: 800 },
    { type: "assistant", text: "You spent **$640** on Food & Dining last month.\n\nCutting this by 25% saves you **$160/month** ($1,920/year).", delay: 1200 },
  ],
  cancel: [
    { type: "user", text: "Cancel my duplicate music streaming account.", delay: 800 },
    { type: "tool", text: "🔧 Calling: find_duplicate_subscriptions()", delay: 1100 },
    { type: "assistant", text: "Found two Spotify Premium charges on different cards. I have proposed cancelling the one on your card ending in *4829.", delay: 1400 },
  ],
};

export default function TheAgent() {
  const [activeTab, setActiveTab] = useState<"leaks" | "dining" | "cancel">("leaks");
  const [simMessages, setSimMessages] = useState<SimStep[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    // Run simulation
    let active = true;
    const steps = SIMULATIONS[activeTab];
    setSimMessages([]);
    setIsThinking(false);

    const run = async () => {
      for (let i = 0; i < steps.length; i++) {
        if (!active) return;
        const step = steps[i];
        
        if (step.type === "tool" || step.type === "assistant") {
          setIsThinking(true);
          await new Promise((res) => setTimeout(res, 800));
          if (!active) return;
          setIsThinking(false);
        }

        setSimMessages((prev) => [...prev, step]);
        await new Promise((res) => setTimeout(res, step.delay));
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [activeTab]);

  return (
    <section id="agent" className="py-24 border-t border-border/40 bg-secondary/5 relative z-10 font-body">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Details */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs text-accent"
            >
              Interactive Playground 🕹️
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]"
            >
              Watch the agent think in real-time.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground leading-relaxed"
            >
              The Gemini-powered co-pilot doesn't just guess. It performs multi-step reasoning, runs database tools to look up transaction records, and synthesizes answers securely.
            </motion.p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <BrainCircuit className="h-6 w-6 text-accent shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Autonomous Reasoning</h4>
                  <p className="text-xs text-muted-foreground">Dynamically chooses tools based on user intent.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <ShieldCheck className="h-6 w-6 text-accent shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Deterministic Executions</h4>
                  <p className="text-xs text-muted-foreground">Only secure backend API functions can affect state.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Console */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border bg-background shadow-xl overflow-hidden flex flex-col h-[400px]">
              {/* Header Tab Selector */}
              <div className="border-b border-border bg-secondary/20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground">agent_sandbox_v1.0</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveTab("leaks")}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${
                      activeTab === "leaks"
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    🔍 Audit Leaks
                  </button>
                  <button
                    onClick={() => setActiveTab("dining")}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${
                      activeTab === "dining"
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    ☕ Save Food
                  </button>
                  <button
                    onClick={() => setActiveTab("cancel")}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition ${
                      activeTab === "cancel"
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    🎵 Cancel Duplicates
                  </button>
                </div>
              </div>

              {/* Chat Terminal Messages */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-3 bg-secondary/10">
                <AnimatePresence>
                  {simMessages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.type === "user" ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col ${m.type === "user" ? "items-end" : "items-start"}`}
                    >
                      {m.type === "user" && (
                        <div className="bg-accent text-accent-foreground px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%]">
                          {m.text}
                        </div>
                      )}
                      {m.type === "tool" && (
                        <div className="text-amber-500 bg-amber-500/5 border border-amber-500/20 px-2 py-1 rounded-md mb-1 font-mono text-[10px]">
                          {m.text}
                        </div>
                      )}
                      {m.type === "assistant" && (
                        <div className="bg-background border border-border text-foreground px-3 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] whitespace-pre-line leading-relaxed">
                          {m.text}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isThinking && (
                  <div className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-spin text-accent" /> Agent thinking / executing tools...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
