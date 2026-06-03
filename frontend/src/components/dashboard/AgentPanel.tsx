import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, X, Wrench } from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../ui/button";
import type { ChatToolCall } from "../../types";

type Message =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: ChatToolCall[]; proposalIds?: string[] };

const SUGGESTIONS = [
  "Where am I leaking money?",
  "What if I cut Food by 30%?",
  "Cancel my dormant subscriptions",
  "Why is this month different?",
];

export default function AgentPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(msg: string) {
    if (!msg.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setInput("");
    setLoading(true);
    try {
      const r = await api.chat(msg);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: r.reply,
          toolCalls: r.tool_calls,
          proposalIds: r.proposal_ids,
        },
      ]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `I hit an error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h2 className="font-semibold">Fiserv Agent</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-display text-lg mb-1">
                    Ask me <em className="italic">anything</em> about your money.
                  </p>
                  <p className="text-xs">I'll explain. The deterministic backend decides.</p>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="bg-accent text-accent-foreground rounded-2xl rounded-br-sm px-3 py-2 text-sm max-w-[85%]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="space-y-2">
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.toolCalls.map((tc, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1 text-[10px] bg-secondary text-muted-foreground rounded-full px-2 py-0.5"
                          >
                            <Wrench className="h-2.5 w-2.5" />
                            {tc.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="bg-secondary text-foreground rounded-2xl rounded-bl-sm px-3 py-2 text-sm max-w-[85%]">
                      {m.content}
                    </div>
                    {m.proposalIds && m.proposalIds.length > 0 && (
                      <div className="border border-accent/30 bg-accent/5 rounded-xl p-3 max-w-[85%]">
                        <p className="text-xs text-muted-foreground mb-2">
                          Proposal awaiting confirmation:
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => m.proposalIds && m.proposalIds[0] && api.confirmProposal(m.proposalIds[0])}
                            className="text-xs h-7 rounded-full px-3"
                          >
                            Confirm
                          </Button>
                          <Button variant="ghost" className="text-xs h-7 rounded-full px-3">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ),
              )}

              {loading && (
                <div className="text-xs text-muted-foreground italic">thinking…</div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-border flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your spend…"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" className="rounded-full px-3 h-9" disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
