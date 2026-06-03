import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { session } from "../lib/session";
import { Button } from "../components/ui/button";

export default function Try() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await api.createSession(name.trim());
      session.set(r.session_id, r.name);
      nav("/upload");
    } catch (e: any) {
      setErr(e.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <h1 className="font-display text-5xl md:text-6xl tracking-tight text-foreground text-center">
          What should I <em className="italic">call</em> you?
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground font-body">
          Just a first name. No account, no email — this is a stateless demo.
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-base font-body outline-none focus:ring-2 focus:ring-ring transition"
          />
          <Button
            type="submit"
            disabled={!name.trim() || loading}
            className="rounded-full py-5 text-sm font-medium h-auto"
          >
            {loading ? "Starting…" : "Continue →"}
          </Button>
          {err && <p className="text-xs text-red-500 text-center">{err}</p>}
        </form>
      </motion.div>
    </div>
  );
}
