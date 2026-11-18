import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUp,
  Check,
  Download,
  ImageIcon,
  Loader2,
  Printer,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PrintDialog } from "@/components/studio/PrintDialog";
import { Button } from "@/components/ui/button";
import { api, fileUrl, type DesignRequest } from "@/lib/api";
import { DEMO_MODE } from "@/lib/demo";

export const Route = createFileRoute("/studio/")({
  component: DesignChat,
});

type Msg =
  | { id: string; role: "student"; text: string }
  | {
      id: string;
      role: "agent";
      text: string;
      job?: DesignRequest;
      card?: "parsed" | "preview" | "confirmed" | "error";
    };

const SUGGESTIONS = [
  ...(DEMO_MODE ? ["Create a house image"] : []),
  "A colourful A3 poster about the solar system",
  "A logo for our school eco club, minimal style",
  "A worksheet on fractions for class 5",
  "Notes on the French Revolution",
];

const uid = () => Math.random().toString(36).slice(2);

function DesignChat() {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "hello",
      role: "agent",
      text: "Hi! Tell me what you'd like to make — a poster, flyer, worksheet, logo or notes. Include the topic, and optionally size (A3/A4), orientation and style.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [active, setActive] = useState<DesignRequest | null>(null);
  const [printing, setPrinting] = useState<DesignRequest | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  const say = (m: Omit<Extract<Msg, { role: "agent" }>, "id" | "role">) =>
    setMessages((ms) => [...ms, { id: uid(), role: "agent", ...m }]);

  const run = async <T,>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(label);
    try {
      return await fn();
    } catch (e) {
      say({ text: (e as Error).message, card: "error" });
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const generate = async (job: DesignRequest) => {
    const out = await run("Generating your design and running the safety check…", () =>
      api.generateDesign(job.id),
    );
    if (!out) return;
    setActive(out);
    qc.invalidateQueries({ queryKey: ["designs"] });
    if (out.status === "preview_ready") {
      say({ text: "Here's a preview. Happy with it?", job: out, card: "preview" });
    } else if (out.status === "rejected") {
      say({
        text: out.rejection_reason ?? "That request didn't pass the safety check.",
        card: "error",
      });
      setActive(null);
    } else {
      say({ text: out.error_message ?? "Generation failed — please try again.", card: "error" });
    }
  };

  const handleParsed = async (job: DesignRequest) => {
    setActive(job);
    if (job.status === "pending_clarification") {
      say({ text: job.clarification_question ?? "Could you tell me a bit more?" });
      return;
    }
    say({ text: "Got it — here's what I understood:", job, card: "parsed" });
    await generate(job);
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    setMessages((ms) => [...ms, { id: uid(), role: "student", text: t }]);
    const job =
      active?.status === "pending_clarification"
        ? await run("Thinking…", () => api.clarifyDesign(active.id, t))
        : await run("Understanding your request…", () => api.createDesign(t));
    if (job) await handleParsed(job);
  };

  const confirm = async (job: DesignRequest) => {
    const out = await run("Preparing a print-ready PDF…", () => api.confirmDesign(job.id));
    if (!out) return;
    setActive(null);
    qc.invalidateQueries({ queryKey: ["designs"] });
    say({ text: "Confirmed! Your print-ready file is ready.", job: out, card: "confirmed" });
  };

  const retry = async (job: DesignRequest) => {
    const out = await run("Starting over…", () => api.rejectDesign(job.id));
    if (out) await generate(out);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="glass-panel flex h-[calc(100vh-9rem)] min-h-[520px] flex-col rounded-2xl">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((m) =>
            m.role === "student" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[80%] rounded-2xl rounded-br-md bg-[image:var(--gradient-brand)] px-4 py-2.5 text-sm text-primary-foreground">
                  {m.text}
                </p>
              </div>
            ) : (
              <AgentMessage
                key={m.id}
                msg={m}
                activeId={active?.id}
                busy={!!busy}
                onConfirm={confirm}
                onRetry={retry}
                onPrint={setPrinting}
              />
            ),
          )}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-cyan" /> {busy}
            </div>
          )}
          <div ref={bottom} />
        </div>

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-glass px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 border-t border-border/60 p-3 sm:p-4"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={
              active?.status === "pending_clarification"
                ? "Type your answer…"
                : "Describe what you want to make…"
            }
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || !!busy}
            className="h-11 w-11 rounded-xl bg-[image:var(--gradient-brand)]"
            aria-label="Send"
          >
            <ArrowUp />
          </Button>
        </form>
      </section>

      <RecentDesigns onPrint={setPrinting} />

      {printing && (
        <PrintDialog
          open
          onOpenChange={(o) => !o && setPrinting(null)}
          sourceType="design"
          sourceId={printing.id}
          title={designTitle(printing)}
        />
      )}
    </div>
  );
}

function designTitle(job: DesignRequest) {
  const i = job.structured_info ?? {};
  return `${(i.subject ?? "Design").replace(/\b\w/g, (c) => c.toUpperCase())} ${i.purpose ?? ""}`.trim();
}

function AgentMessage({
  msg,
  activeId,
  busy,
  onConfirm,
  onRetry,
  onPrint,
}: {
  msg: Extract<Msg, { role: "agent" }>;
  activeId: string | undefined;
  busy: boolean;
  onConfirm: (j: DesignRequest) => void;
  onRetry: (j: DesignRequest) => void;
  onPrint: (j: DesignRequest) => void;
}) {
  const job = msg.job;
  const isError = msg.card === "error";
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary/60">
        {isError ? (
          <ShieldAlert className="h-4 w-4 text-destructive" />
        ) : (
          <Sparkles className="h-4 w-4 text-cyan" />
        )}
      </span>
      <div className="min-w-0 max-w-[85%] space-y-3">
        <p className={`text-sm leading-relaxed ${isError ? "text-destructive" : ""}`}>{msg.text}</p>

        {msg.card === "parsed" && job?.structured_info && (
          <div className="flex flex-wrap gap-1.5">
            {(["purpose", "subject", "size", "orientation", "style"] as const).map(
              (k) =>
                job.structured_info?.[k] && (
                  <span
                    key={k}
                    className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs"
                  >
                    <span className="text-muted-foreground">{k}:</span> {job.structured_info[k]}
                  </span>
                ),
            )}
          </div>
        )}

        {(msg.card === "preview" || msg.card === "confirmed") && job && (
          <div className="overflow-hidden rounded-xl border border-border bg-background/40">
            {job.output_type === "image" ? (
              <img
                src={fileUrl(job.final_url ?? job.preview_url)}
                alt="Generated design preview"
                className="max-h-[420px] w-full bg-white object-contain"
              />
            ) : (
              <iframe
                src={fileUrl(job.final_url ?? job.preview_url)}
                title="Document preview"
                className="h-[420px] w-full bg-white"
              />
            )}
            <div className="flex flex-wrap gap-2 border-t border-border/60 p-3">
              {msg.card === "preview" && job.id === activeId && (
                <>
                  <Button size="sm" onClick={() => onConfirm(job)} disabled={busy}>
                    <Check /> Confirm design
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onRetry(job)} disabled={busy}>
                    <RotateCcw /> Try another
                  </Button>
                </>
              )}
              {msg.card === "confirmed" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => onPrint(job)}
                    className="bg-[image:var(--gradient-brand)]"
                  >
                    <Printer /> Send to printer
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={fileUrl(job.print_url)} target="_blank" rel="noreferrer">
                      <Download /> Print-ready PDF
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentDesigns({ onPrint }: { onPrint: (j: DesignRequest) => void }) {
  const designs = useQuery({ queryKey: ["designs"], queryFn: api.listDesigns, retry: false });
  const confirmed = (designs.data ?? []).filter((d) => d.status === "confirmed").slice(0, 8);

  return (
    <aside className="glass-panel hidden h-fit rounded-2xl p-4 lg:block">
      <h2 className="font-display text-sm font-semibold">Your designs</h2>
      {designs.isError && (
        <p className="mt-3 text-xs text-destructive">{(designs.error as Error).message}</p>
      )}
      {confirmed.length === 0 && !designs.isError && (
        <p className="mt-3 text-xs text-muted-foreground">
          Confirmed designs show up here, ready to print.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {confirmed.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-2"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white">
              {d.output_type === "image" ? (
                <img src={fileUrl(d.final_url)} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4 text-slate-500" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{designTitle(d)}</p>
              <p className="text-xs text-muted-foreground">
                {d.structured_info?.size ?? "A4"} · {d.page_count ?? 1} page
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onPrint(d)}
              aria-label="Print"
            >
              <Printer />
            </Button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
