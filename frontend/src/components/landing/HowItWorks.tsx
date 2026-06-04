import { motion } from "framer-motion";
import { UploadCloud, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UploadCloud,
    title: "1. Upload Statement",
    description: "Drag and drop any standard bank statement CSV. We securely parse transaction values, descriptions, and dates locally.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: ShieldAlert,
    title: "2. Audit & Detection",
    description: "Gemini audits the raw statement data to identify hidden recurring charges, price increases, and potential money leaks.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Sparkles,
    title: "3. Action & Resolve",
    description: "View automatically generated insights or converse directly with the agent to execute actions like cancelling subscriptions in one click.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-background relative z-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground"
          >
            How it works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-muted-foreground text-base md:text-lg"
          >
            A seamless three-step process combining deterministic rules with agentic AI intelligence to optimize your personal finance.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative group rounded-3xl border border-border/80 bg-secondary/30 p-8 hover:bg-secondary/50 hover:border-border transition-all duration-300 shadow-sm"
              >
                <div className={`h-12 w-12 rounded-2xl ${step.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className={`h-6 w-6 ${step.color}`} />
                </div>
                <h3 className="font-display text-xl font-medium text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
