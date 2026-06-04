import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import DashboardPreview from "./DashboardPreview";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4";

export default function Hero() {
  const nav = useNavigate();
  return (
    <section className="relative flex-1 flex flex-col items-center justify-start overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={VIDEO_SRC}
      />
      <div className="absolute inset-0 bg-background/40 z-0" />

      <div className="relative z-10 flex flex-col items-center w-full px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground font-body"
        >
          Powered by Groq ✨
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center font-display text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight text-foreground max-w-2xl"
        >
          Your bank's <em className="italic font-display">smarter</em> spending brain
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-center text-base md:text-lg text-muted-foreground max-w-[650px] leading-relaxed font-body"
        >
          Drop a CSV. Get a ranked, audited, action-linked insight feed in 30 seconds —
          built to embed inside any bank app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-5 flex items-center gap-3"
        >
          <Button
            onClick={() => nav("/try")}
            className="rounded-full px-6 py-5 text-sm font-medium font-body h-auto"
          >
            Try it →
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-11 rounded-full border-0 bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-background/80 p-0"
            aria-label="Play"
          >
            <Play className="h-4 w-4 fill-foreground text-foreground" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 w-full flex justify-center"
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}
