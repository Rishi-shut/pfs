import { DragEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload as UploadIcon, FileText, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { session } from "../lib/session";

interface SampleMeta {
  key: string;
  label: string;
  description: string;
  available: boolean;
}

export default function Upload() {
  const nav = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleMeta[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.listSamples().then(setSamples).catch(() => setSamples([]));
  }, []);

  if (!session.id) {
    nav("/try");
    return null;
  }

  async function handleFile(file: File) {
    setErr(null);
    setLoading(true);
    setFilename(file.name);
    try {
      await api.uploadCsv(file);
      nav("/processing");
    } catch (e: any) {
      setErr(e.message || "Upload failed");
      setLoading(false);
    }
  }

  async function useSample(key: string) {
    setErr(null);
    setLoading(true);
    setLoadingKey(key);
    setFilename(samples.find((s) => s.key === key)?.label ?? key);
    try {
      await api.uploadNamedSample(key);
      nav("/processing");
    } catch (e: any) {
      setErr(e.message || "Sample load failed");
      setLoading(false);
      setLoadingKey(null);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-foreground text-center">
          Hi {session.name}. <em className="italic">Drop</em> your transactions.
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground font-body">
          Any CSV with <code className="bg-secondary px-1 rounded">Date, Merchant, Amount, Category</code>.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`mt-8 rounded-2xl border-2 border-dashed cursor-pointer transition px-8 py-10 flex flex-col items-center text-center
            ${dragging ? "border-accent bg-accent/5" : "border-border bg-secondary/30 hover:bg-secondary/50"}`}
        >
          {filename && !loadingKey ? (
            <>
              <FileText className="h-8 w-8 text-accent" />
              <p className="mt-3 text-sm font-medium">{filename}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {loading ? "Uploading…" : "Ready"}
              </p>
            </>
          ) : (
            <>
              <UploadIcon className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Drop a CSV or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Up to 5 MB</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {samples.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-center gap-2 mb-4 text-xs text-muted-foreground uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-accent" />
              <span>or try a built-in sample</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samples.map((s) => {
                const isLoading = loadingKey === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => useSample(s.key)}
                    disabled={loading || !s.available}
                    className={`text-left rounded-xl border border-border bg-background p-3 hover:border-accent hover:bg-accent/5 transition
                      ${isLoading ? "border-accent bg-accent/5" : ""}
                      ${!s.available ? "opacity-40 cursor-not-allowed" : ""}
                      ${loading && !isLoading ? "opacity-50 cursor-wait" : ""}
                    `}
                  >
                    <div className="text-sm font-medium text-foreground flex items-center gap-2">
                      {s.label}
                      {isLoading && <span className="text-[10px] text-accent">loading…</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {s.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {err && <p className="text-xs text-red-500 text-center mt-4">{err}</p>}
      </motion.div>
    </div>
  );
}
