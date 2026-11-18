import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
  Trash2,
  Upload,
  Wand2,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PrintDialog } from "@/components/studio/PrintDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  api,
  fileUrl,
  type CreatePaperInput,
  type MaterialKind,
  type MockPaper,
  type PaperStatus,
  type PrintSource,
} from "@/lib/api";

export const Route = createFileRoute("/studio/papers")({
  component: MockPaperPage,
});

const KINDS: { value: MaterialKind; label: string }[] = [
  { value: "worksheet", label: "Worksheet" },
  { value: "past_paper", label: "Past paper" },
  { value: "notes", label: "Notes" },
];
const DIFFICULTIES = ["easy", "medium", "hard", "mixed"] as const;
const IN_PROGRESS: PaperStatus[] = ["queued", "blueprinting", "writing", "verifying", "rendering"];

function MockPaperPage() {
  const [paperId, setPaperId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
      <div className="space-y-6">
        <PaperForm onCreated={setPaperId} />
        <PastPapers selected={paperId} onSelect={setPaperId} />
      </div>
      {paperId ? (
        <PaperView id={paperId} />
      ) : (
        <section className="glass-panel grid min-h-[420px] place-items-center rounded-2xl p-8 text-center">
          <div className="max-w-sm">
            <FileText className="mx-auto h-10 w-10 text-cyan" strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-xl font-semibold">Build a mock paper</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload worksheets, notes or past papers, choose marks and duration, and get a verified
              question paper plus answer key — ready to print.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Materials + settings form
// ---------------------------------------------------------------------------

function PaperForm({ onCreated }: { onCreated: (id: string) => void }) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<MaterialKind>("worksheet");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(0);
  const [form, setForm] = useState<CreatePaperInput>({
    subject: "",
    total_marks: 50,
    duration_minutes: 90,
    difficulty: "mixed",
    material_ids: [],
  });

  const materials = useQuery({ queryKey: ["materials"], queryFn: api.listMaterials, retry: false });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(files.length);
    for (const file of Array.from(files)) {
      try {
        const m = await api.uploadMaterial(file, kind);
        setSelected((s) => new Set(s).add(m.id));
        if (m.char_count === 0) {
          toast.warning(`${m.filename}: no readable text found`, {
            description: "Scanned pages and photos need GEMINI_API_KEY on the backend to be read.",
          });
        }
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
      setUploading((n) => n - 1);
    }
    qc.invalidateQueries({ queryKey: ["materials"] });
  };

  const remove = useMutation({
    mutationFn: api.deleteMaterial,
    onSuccess: (_, id) => {
      setSelected((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  const create = useMutation({
    mutationFn: () => api.createPaper({ ...form, material_ids: [...selected] }),
    onSuccess: (p) => {
      onCreated(p.id);
      qc.invalidateQueries({ queryKey: ["papers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof CreatePaperInput>(k: K, v: CreatePaperInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <section className="glass-panel space-y-5 rounded-2xl p-5">
      <div>
        <h2 className="font-display font-semibold">1. Upload material</h2>
        <div className="mt-3 flex gap-1 rounded-lg border border-border bg-background/40 p-1">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
                kind === k.value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files);
          }}
          className="mt-3 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background/30 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-cyan" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          {uploading ? `Uploading ${uploading}…` : "Drop files or click to upload"}
          <span className="text-xs">PDF, DOCX, TXT, or photos · max 15 MB</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = "";
          }}
        />

        {!!materials.data?.length && (
          <ul className="mt-3 max-h-52 space-y-1.5 overflow-y-auto">
            {materials.data.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-2.5 py-2"
              >
                <input
                  type="checkbox"
                  checked={selected.has(m.id)}
                  onChange={(e) =>
                    setSelected((s) => {
                      const n = new Set(s);
                      if (e.target.checked) n.add(m.id);
                      else n.delete(m.id);
                      return n;
                    })
                  }
                  className="accent-[var(--primary)]"
                  aria-label={`Use ${m.filename}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{m.filename}</p>
                  <p
                    className={`text-xs ${m.char_count ? "text-muted-foreground" : "text-amber-400"}`}
                  >
                    {KINDS.find((k) => k.value === m.kind)?.label} ·{" "}
                    {m.char_count ? `${m.char_count.toLocaleString()} chars` : "no text extracted"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => remove.mutate(m.id)}
                  aria-label={`Delete ${m.filename}`}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <h2 className="font-display font-semibold">2. Paper settings</h2>
        <Field label="Subject *">
          <Input
            required
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder="e.g. Biology"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Class / grade">
            <Input
              value={form.grade ?? ""}
              onChange={(e) => set("grade", e.target.value)}
              placeholder="Class 9"
            />
          </Field>
          <Field label="Board">
            <Input
              value={form.board ?? ""}
              onChange={(e) => set("board", e.target.value)}
              placeholder="CBSE"
            />
          </Field>
          <Field label="Total marks">
            <Input
              type="number"
              min={10}
              max={200}
              value={form.total_marks}
              onChange={(e) => set("total_marks", Number(e.target.value))}
            />
          </Field>
          <Field label="Duration (min)">
            <Input
              type="number"
              min={15}
              max={240}
              step={15}
              value={form.duration_minutes}
              onChange={(e) => set("duration_minutes", Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Difficulty">
          <div className="flex gap-1 rounded-lg border border-border bg-background/40 p-1">
            {DIFFICULTIES.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => set("difficulty", d)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs capitalize transition-colors ${
                  form.difficulty === d
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Anything else?">
          <Textarea
            rows={2}
            value={form.instructions ?? ""}
            onChange={(e) => set("instructions", e.target.value)}
            placeholder="e.g. focus on chapters 3–5, include one diagram-based question"
          />
        </Field>
        <Button
          type="submit"
          disabled={!form.subject.trim() || create.isPending || uploading > 0}
          className="w-full bg-[image:var(--gradient-brand)]"
        >
          {create.isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
          Generate mock paper
          {selected.size > 0 && ` from ${selected.size} file${selected.size === 1 ? "" : "s"}`}
        </Button>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paper progress + result
// ---------------------------------------------------------------------------

const STAGES: { status: PaperStatus; label: string; detail: string }[] = [
  { status: "blueprinting", label: "Blueprint", detail: "Sections, question types, marks" },
  { status: "writing", label: "Questions & answers", detail: "Gemini text model" },
  { status: "verifying", label: "Verify", detail: "Marks check, answer audit" },
  { status: "rendering", label: "Render", detail: "HTML → PDF" },
];

function PaperView({ id }: { id: string }) {
  const qc = useQueryClient();
  const [printing, setPrinting] = useState<PrintSource | null>(null);
  const paper = useQuery({
    queryKey: ["paper", id],
    queryFn: () => api.getPaper(id),
    refetchInterval: (q) =>
      q.state.data && !IN_PROGRESS.includes(q.state.data.status) ? false : 1500,
  });

  const regenerate = useMutation({
    mutationFn: () => api.regeneratePaper(id),
    onSuccess: (p) => {
      qc.setQueryData(["paper", id], p);
      qc.invalidateQueries({ queryKey: ["papers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const p = paper.data;
  if (!p) {
    return (
      <section className="glass-panel grid min-h-[420px] place-items-center rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-cyan" />
      </section>
    );
  }

  const v = p.verification;
  return (
    <section className="glass-panel min-w-0 space-y-6 rounded-2xl p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-semibold">{p.title}</h2>
          <p className="text-sm text-muted-foreground">
            {[p.subject, p.grade, p.board].filter(Boolean).join(" · ")} · {p.total_marks} marks ·{" "}
            {p.duration_minutes} min
            {p.source === "stub" && (
              <span className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-xs text-amber-300">
                offline generator — set GEMINI_API_KEY
              </span>
            )}
          </p>
        </div>
        {(p.status === "ready" || p.status === "failed") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
          >
            <RotateCcw /> Regenerate
          </Button>
        )}
      </header>

      <Stepper status={p.status} />

      {p.status === "failed" && (
        <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          {p.error_message ?? "Generation failed."}
        </p>
      )}

      {v && <VerificationCard paper={p} />}

      {p.status === "ready" && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPrinting("paper")}
              className="bg-[image:var(--gradient-brand)]"
            >
              <Printer /> Print paper ({p.page_count} pages)
            </Button>
            <Button variant="outline" onClick={() => setPrinting("answer_key")}>
              <Printer /> Print answer key ({p.answer_key_page_count})
            </Button>
          </div>

          <Tabs defaultValue="paper">
            <TabsList>
              <TabsTrigger value="paper">Question paper</TabsTrigger>
              <TabsTrigger value="key">Answer key</TabsTrigger>
              <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
            </TabsList>
            <TabsContent value="paper">
              <PdfPreview url={p.paper_url} />
            </TabsContent>
            <TabsContent value="key">
              <PdfPreview url={p.answer_key_url} />
            </TabsContent>
            <TabsContent value="blueprint">
              <Blueprint paper={p} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {printing && (
        <PrintDialog
          open
          onOpenChange={(o) => !o && setPrinting(null)}
          sourceType={printing}
          sourceId={p.id}
          title={printing === "answer_key" ? `${p.title} — Answer Key` : p.title}
        />
      )}
    </section>
  );
}

function Stepper({ status }: { status: PaperStatus }) {
  const order = STAGES.map((s) => s.status);
  const current = order.indexOf(status);
  const done = status === "ready" || status === "confirmed";
  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {STAGES.map((s, i) => {
        const state = done || i < current ? "done" : i === current ? "active" : "idle";
        return (
          <li
            key={s.status}
            className={`rounded-xl border p-3 ${
              state === "active"
                ? "border-primary/60 bg-primary/10"
                : "border-border bg-secondary/30"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {state === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : state === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin text-cyan" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              {s.label}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
          </li>
        );
      })}
    </ol>
  );
}

function VerificationCard({ paper }: { paper: MockPaper }) {
  const v = paper.verification!;
  const audit = v.answer_audit ?? [];
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          {v.passed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          Marks check: {v.total_marks_actual}/{v.total_marks_expected}
        </span>
        <span className="text-muted-foreground">{v.question_count} questions</span>
        {paper.blueprint?.sections.map((s) => (
          <span key={s.id} className="text-muted-foreground">
            {s.id}: {v.section_totals[s.id] ?? 0}
          </span>
        ))}
      </div>
      {[...v.issues, ...audit.map((a) => `Q${a.number}: ${a.issue}`)].length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {v.issues.map((i) => (
            <li key={i} className="flex gap-1.5 text-destructive">
              <XCircle className="h-3.5 w-3.5 shrink-0" /> {i}
            </li>
          ))}
          {audit.map((a) => (
            <li key={a.number} className="flex gap-1.5 text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Q{a.number}: {a.issue}
            </li>
          ))}
        </ul>
      )}
      {v.auto_fixes.length > 0 && (
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer">{v.auto_fixes.length} automatic fix(es)</summary>
          <ul className="mt-1 list-disc pl-5">
            {v.auto_fixes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function PdfPreview({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <iframe src={fileUrl(url)} title="PDF preview" className="h-[640px] w-full bg-white" />
      <a
        href={fileUrl(url)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1.5 border-t border-border bg-secondary/30 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5" /> Open / download PDF
      </a>
    </div>
  );
}

function Blueprint({ paper }: { paper: MockPaper }) {
  const bp = paper.blueprint;
  if (!bp) return null;
  return (
    <div className="space-y-3">
      {bp.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bp.topics.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Section</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Questions</th>
              <th className="p-3 text-right">Marks each</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {bp.sections.map((s) => (
              <tr key={s.id} className="border-t border-border/60">
                <td className="p-3">{s.title}</td>
                <td className="p-3 text-muted-foreground">{s.question_type.replace("_", " ")}</td>
                <td className="p-3 text-right tabular-nums">{s.num_questions}</td>
                <td className="p-3 text-right tabular-nums">{s.marks_each}</td>
                <td className="p-3 text-right font-medium tabular-nums">
                  {s.num_questions * s.marks_each}
                </td>
              </tr>
            ))}
            <tr className="border-t border-border bg-secondary/30 font-semibold">
              <td className="p-3" colSpan={4}>
                Total
              </td>
              <td className="p-3 text-right tabular-nums">
                {bp.sections.reduce((a, s) => a + s.num_questions * s.marks_each, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PastPapers({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const papers = useQuery({
    queryKey: ["papers"],
    queryFn: api.listPapers,
    retry: false,
    refetchInterval: (q) =>
      q.state.data?.some((p) => IN_PROGRESS.includes(p.status)) ? 2000 : false,
  });
  if (!papers.data?.length) return null;
  return (
    <section className="glass-panel rounded-2xl p-5">
      <h2 className="font-display text-sm font-semibold">Your papers</h2>
      <ul className="mt-3 space-y-1.5">
        {papers.data.slice(0, 10).map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelect(p.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                selected === p.id
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-secondary/30 hover:border-primary/40"
              }`}
            >
              <span className="truncate">{p.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {IN_PROGRESS.includes(p.status) ? "generating…" : p.status}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
