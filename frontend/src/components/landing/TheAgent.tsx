import { motion } from "framer-motion";
import { MessageSquare, ShieldCheck, Database, BrainCircuit } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Gemini Reasoning Engine",
    description: "Uses Google's Gemini models to understand context, identify anomalies, and plan search queries over your financial histories.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Audited Logic",
    description: "The agent works inside a deterministic sandbox. It cannot execute actions on its own—all modifications require a verified backend pipeline.",
  },
  {
    icon: Database,
    title: "Sliding Memory Database",
    description: "Equipped with context-aware chat history to follow up on your questions naturally, remembering past insights and filters.",
  },
  {
    icon: MessageSquare,
    title: "Conversational Interface",
    description: "Ask natural questions like 'Where am I leaking money?' or 'What if I cut eating out by 20%?' and get styled, interactive replies.",
  },
];

export default function TheAgent() {
  return (
    <section id="agent" className="py-24 border-t border-border/40 bg-secondary/10 relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs text-accent font-body"
            >
              Intelligent Co-Pilot 🧠
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.05]"
            >
              Meet your digital financial analyst.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground leading-relaxed"
            >
              Pulse PFS includes an embedded, conversational LLM orchestrator. It executes multi-turn thinking loops, invokes backend transaction queries dynamically, and drafts clear spending audits.
            </motion.p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-6 rounded-3xl border border-border/60 bg-background/50 hover:bg-background hover:shadow-md transition-all duration-300"
                >
                  <Icon className="h-6 w-6 text-accent mb-4" />
                  <h3 className="font-display text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
