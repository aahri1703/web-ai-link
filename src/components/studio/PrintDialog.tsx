import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Building2, Laptop, Loader2, Minus, Plus, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { api, fileUrl, type PrintDestination, type PrintJob, type PrintSource } from "@/lib/api";
import { printPdf, reservePrintTab } from "@/lib/print";

/**
 * Print queue entry point shared by both flows.
 *
 * Step 1 (options): where to print + copies -> POST /api/print-jobs creates the
 *   job as `awaiting_confirmation` and returns the real page count.
 * Step 2 (confirm): shows pages x copies against today's remaining quota ->
 *   POST /confirm. "My printer" then opens the device's print dialog (any
 *   printer the device is connected to); "School printer" queues it on the
 *   shared printer. Closing the dialog before confirming cancels the job.
 */
export function PrintDialog({
  open,
  onOpenChange,
  sourceType,
  sourceId,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: PrintSource;
  sourceId: string;
  title: string;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [destination, setDestination] = useState<PrintDestination>("device");
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState(sourceType === "design");
  const [duplex, setDuplex] = useState(sourceType !== "design");
  const [job, setJob] = useState<PrintJob | null>(null);

  const quota = useQuery({ queryKey: ["quota"], queryFn: api.quota, enabled: open });
  const printer = useQuery({ queryKey: ["printer"], queryFn: api.printer, enabled: open });

  const create = useMutation({
    mutationFn: () =>
      api.createPrintJob({
        source_type: sourceType,
        source_id: sourceId,
        destination,
        copies,
        color,
        duplex,
      }),
    onSuccess: setJob,
    onError: (e: Error) => toast.error(e.message),
  });

  const confirm = useMutation({
    mutationFn: async ({ id, tab }: { id: string; tab: Window | null }) => {
      try {
        const j = await api.confirmPrintJob(id);
        const how = j.destination === "device" ? await printPdf(fileUrl(j.file_url)!, tab) : null;
        return { j, how };
      } catch (e) {
        tab?.close();
        throw e;
      }
    },
    onSuccess: ({ j, how }) => {
      if (j.destination === "device") {
        toast.success(
          how === "tab"
            ? "Your document opened in a new tab — tap Share / Print there."
            : "Choose your printer in the print window.",
          {
            description:
              j.copies > 1 ? `Set copies to ${j.copies} in the print window.` : undefined,
          },
        );
      } else {
        toast.success(`Sent to the school printer — ${j.total_pages} pages`, {
          action: { label: "View queue", onClick: () => navigate({ to: "/studio/print" }) },
        });
      }
      qc.invalidateQueries({ queryKey: ["print-jobs"] });
      qc.invalidateQueries({ queryKey: ["quota"] });
      setJob(null);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const close = (next: boolean) => {
    if (!next && job?.status === "awaiting_confirmation") {
      api.cancelPrintJob(job.id).catch(() => {});
    }
    if (!next) setJob(null);
    onOpenChange(next);
  };

  const q = quota.data;
  const pr = printer.data;
  const overQuota = job && q ? job.total_pages > q.remaining : false;
  const maxCopies = q?.max_copies ?? 5;
  const shared = destination === "shared";

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="glass-panel border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Printer className="h-5 w-5 text-cyan" /> Print
          </DialogTitle>
          <DialogDescription className="truncate">{title}</DialogDescription>
        </DialogHeader>

        {!job ? (
          <div className="space-y-5 py-2">
            {pr?.shared_available && (
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["device", Laptop, "My printer", "Any printer this device uses"],
                    ["shared", Building2, "School printer", pr.online ? "Online" : "Offline"],
                  ] as const
                ).map(([value, Icon, label, sub]) => (
                  <button
                    key={value}
                    onClick={() => setDestination(value)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      destination === value
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-secondary/30 hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-cyan" />
                    <p className="mt-1.5 text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Copies</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                  disabled={copies <= 1}
                  aria-label="Fewer copies"
                >
                  <Minus />
                </Button>
                <span className="w-6 text-center font-semibold tabular-nums">{copies}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setCopies((c) => Math.min(maxCopies, c + 1))}
                  disabled={copies >= maxCopies}
                  aria-label="More copies"
                >
                  <Plus />
                </Button>
              </div>
            </div>

            {shared ? (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="color">Colour</Label>
                  <Switch id="color" checked={color} onCheckedChange={setColor} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="duplex">Double-sided</Label>
                  <Switch id="duplex" checked={duplex} onCheckedChange={setDuplex} />
                </div>
              </>
            ) : (
              <p className="rounded-lg border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                Next, your device's print window opens. Pick your printer there — Wi-Fi, USB or
                Bluetooth all work — and choose colour or double-sided if you want.
              </p>
            )}

            {q && (
              <p className="text-xs text-muted-foreground">
                {q.remaining} of {q.daily_limit} pages left today · max {q.max_pages_per_job} per
                job
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <dl className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Pages", job.pages],
                ["Copies", job.copies],
                ["Total", job.total_pages],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-secondary/40 p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-display text-2xl font-bold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">
              {job.destination === "device"
                ? `${job.paper_size} · on your printer`
                : `${job.paper_size} · school printer · ${job.color ? "Colour" : "Black & white"} · ${
                    job.duplex ? "Double-sided" : "Single-sided"
                  }`}
            </p>
            {q && (
              <p className={`text-sm ${overQuota ? "text-destructive" : "text-muted-foreground"}`}>
                Uses {job.total_pages} of your {q.remaining} remaining pages today.
              </p>
            )}
            {job.destination === "shared" && pr && !pr.online && (
              <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                School printer is offline ({pr.detail}). The job will wait in the queue.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            Cancel
          </Button>
          {!job ? (
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />} Review
            </Button>
          ) : (
            <Button
              // reservePrintTab must run synchronously in the click (pop-up blockers).
              onClick={() =>
                confirm.mutate({
                  id: job.id,
                  tab: job.destination === "device" ? reservePrintTab() : null,
                })
              }
              disabled={confirm.isPending || overQuota}
              className="bg-[image:var(--gradient-brand)]"
            >
              {confirm.isPending ? <Loader2 className="animate-spin" /> : <Printer />} Confirm &
              print
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
