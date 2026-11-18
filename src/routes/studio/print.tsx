import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Check,
  ExternalLink,
  Laptop,
  Loader2,
  Printer,
  Server,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, fileUrl, type PrintJob, type PrintStatus } from "@/lib/api";
import { printPdf, printTestPage, reservePrintTab } from "@/lib/print";

export const Route = createFileRoute("/studio/print")({
  component: PrintQueuePage,
});

const STATUS_STYLE: Record<PrintStatus, { label: string; cls: string }> = {
  awaiting_confirmation: {
    label: "Needs confirmation",
    cls: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  },
  sent_to_device: {
    label: "Sent to your printer",
    cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  queued: { label: "Queued", cls: "border-primary/40 bg-primary/10 text-primary" },
  printing: { label: "Printing", cls: "border-cyan/40 bg-cyan/10 text-cyan" },
  completed: {
    label: "Printed",
    cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  failed: { label: "Failed", cls: "border-destructive/40 bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelled", cls: "border-border bg-secondary/40 text-muted-foreground" },
};
const ACTIVE: PrintStatus[] = ["awaiting_confirmation", "queued", "printing"];

const SHARED_EXPLAINER = {
  none: "",
  mock: "Simulated school printer for testing — confirmed jobs are saved on the server instead of printed.",
  cups: "The school server prints directly to its printer.",
  agent: "A computer at school collects confirmed jobs and prints them on the school printer.",
};

function PrintQueuePage() {
  const qc = useQueryClient();
  const [testing, setTesting] = useState(false);
  const jobs = useQuery({
    queryKey: ["print-jobs"],
    queryFn: api.listPrintJobs,
    refetchInterval: (q) => (q.state.data?.some((j) => ACTIVE.includes(j.status)) ? 2000 : 15_000),
  });
  const quota = useQuery({ queryKey: ["quota"], queryFn: api.quota, refetchInterval: 5000 });
  const printer = useQuery({ queryKey: ["printer"], queryFn: api.printer, refetchInterval: 5000 });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["print-jobs"] });
    qc.invalidateQueries({ queryKey: ["quota"] });
  };
  const confirm = useMutation({
    mutationFn: async ({ id, tab }: { id: string; tab: Window | null }) => {
      try {
        const j = await api.confirmPrintJob(id);
        if (j.destination === "device") await printPdf(fileUrl(j.file_url)!, tab);
        return j;
      } catch (e) {
        tab?.close();
        throw e;
      }
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const cancel = useMutation({
    mutationFn: api.cancelPrintJob,
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const testPage = async () => {
    setTesting(true);
    try {
      await printTestPage();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const q = quota.data;
  const pr = printer.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="glass-panel min-w-0 rounded-2xl p-5 sm:p-6">
        <h1 className="font-display text-xl font-semibold">Print history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you've printed today counts towards your daily page limit.
        </p>

        {jobs.isLoading && <Loader2 className="mt-8 h-5 w-5 animate-spin text-cyan" />}
        {jobs.isError && (
          <p className="mt-6 text-sm text-destructive">{(jobs.error as Error).message}</p>
        )}
        {jobs.data?.length === 0 && (
          <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Confirm a design or generate a mock paper, then hit Print.
          </p>
        )}

        <ul className="mt-5 space-y-2">
          {jobs.data?.map((j) => (
            <JobRow
              key={j.id}
              job={j}
              onConfirm={() =>
                confirm.mutate({
                  id: j.id,
                  tab: j.destination === "device" ? reservePrintTab() : null,
                })
              }
              onCancel={() => cancel.mutate(j.id)}
              busy={confirm.isPending || cancel.isPending}
            />
          ))}
        </ul>
      </section>

      <aside className="space-y-6">
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="font-display text-sm font-semibold">Today's pages</h2>
          {q && (
            <>
              <p className="mt-3 font-display text-3xl font-bold tabular-nums">
                {q.used_today}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {q.daily_limit}
                </span>
              </p>
              <Progress value={(q.used_today / q.daily_limit) * 100} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {q.remaining} left · up to {q.max_pages_per_job} pages and {q.max_copies} copies per
                job
              </p>
            </>
          )}
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
            <Laptop className="h-4 w-4 text-cyan" /> Your printer
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Prints go through your device's own print window, so any printer your laptop, tablet or
            phone is connected to works — Wi-Fi, USB, Bluetooth or AirPrint. No setup needed here.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={testPage}
            disabled={testing}
          >
            {testing ? <Loader2 className="animate-spin" /> : <Printer />} Print a test page
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Free — doesn't count towards your pages.
          </p>
        </section>

        {pr?.shared_available && (
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
              <Building2 className="h-4 w-4 text-cyan" /> School printer
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              <p className="flex items-center gap-2">
                {pr.online ? (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-400" />
                )}
                {pr.online ? "Online" : "Offline"}
                <span className="text-xs text-muted-foreground">
                  · {pr.queued_jobs} job(s) waiting
                </span>
              </p>
              <p className="flex gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                <Server className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {SHARED_EXPLAINER[pr.backend] || pr.detail}
              </p>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}

function JobRow({
  job,
  onConfirm,
  onCancel,
  busy,
}: {
  job: PrintJob;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const s = STATUS_STYLE[job.status];
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/25 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{job.title}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {job.pages} page{job.pages === 1 ? "" : "s"} × {job.copies} = {job.total_pages} ·{" "}
          {job.destination === "device" ? "my printer" : "school printer"} ·{" "}
          {new Date(job.created_at + "Z").toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {job.error_message && <p className="mt-1 text-xs text-destructive">{job.error_message}</p>}
      </div>
      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${s.cls}`}>
        {job.status === "printing" && <Loader2 className="h-3 w-3 animate-spin" />}
        {s.label}
      </span>
      <div className="flex gap-1">
        {job.status === "awaiting_confirmation" && (
          <Button size="sm" onClick={onConfirm} disabled={busy}>
            <Check /> Confirm & print
          </Button>
        )}
        {(job.status === "awaiting_confirmation" || job.status === "queued") && (
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
            <X /> Cancel
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
          <a href={fileUrl(job.file_url)} target="_blank" rel="noreferrer" aria-label="Open file">
            <ExternalLink />
          </a>
        </Button>
      </div>
    </li>
  );
}
