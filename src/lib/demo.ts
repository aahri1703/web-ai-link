// Demo mode: set VITE_DEMO_MODE=true to run the studio with NO backend and NO
// AI keys. Asking for a house returns a fixed sample image (public/demo/), and
// the full confirm -> print flow works: "My printer" opens the device's real
// print dialog, "School printer" is simulated. Everything lives in memory and
// resets on reload. Turn it off once the backend and Gemini key are set up.
import type {
  DesignRequest,
  Health,
  PrinterStatus,
  PrintJob,
  PrintQuota,
  PrintSource,
  PrintDestination,
} from "@/lib/api";

export const DEMO_MODE = import.meta.env["VITE_DEMO_MODE"] === "true";

const HOUSE_IMAGE = "/demo/house.jpg";
const HOUSE_PDF = "/demo/house.pdf";
const DAILY_LIMIT = 20;

const designs = new Map<string, DesignRequest>();
const jobs = new Map<string, PrintJob & { confirmedAt?: number }>();

const uid = () => `demo-${Math.random().toString(36).slice(2, 10)}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();

function getDesign(id: string): DesignRequest {
  const d = designs.get(id);
  if (!d) throw new Error("Demo design not found — the page was probably reloaded.");
  return d;
}

function save(d: DesignRequest): DesignRequest {
  designs.set(d.id, d);
  return { ...d };
}

function understand(id: string, raw: string): DesignRequest {
  const wantsHouse = /\b(house|home|villa|bungalow|building|mansion|cottage)\b/i.test(raw);
  const base: DesignRequest = {
    id,
    raw_request: raw,
    status: "pending_clarification",
    structured_info: null,
    clarification_question: null,
    workflow_type: null,
    rejection_reason: null,
    output_type: null,
    preview_url: null,
    final_url: null,
    print_url: null,
    page_count: null,
    error_message: null,
    created_at: now(),
  };
  if (!wantsHouse) {
    return {
      ...base,
      clarification_question:
        "Demo mode can only make one thing right now: a house image. Try “create a house image”.",
    };
  }
  return {
    ...base,
    status: "ready_to_generate",
    workflow_type: "poster_artwork",
    structured_info: {
      purpose: "image",
      subject: "house",
      size: "A4",
      orientation: "portrait",
      style: "photo (demo sample)",
      workflow_type: "poster_artwork",
    },
  };
}

function liveStatus(j: PrintJob & { confirmedAt?: number }): PrintJob {
  if (j.destination !== "shared" || !j.confirmedAt || j.status === "cancelled") return { ...j };
  const age = Date.now() - j.confirmedAt;
  if (age < 3000) return { ...j, status: "queued" };
  if (age < 8000) return { ...j, status: "printing", printer_name: "Simulated school printer" };
  return {
    ...j,
    status: "completed",
    printer_name: "Simulated school printer",
    completed_at: new Date(j.confirmedAt + 8000).toISOString(),
  };
}

function usedPages(): number {
  return [...jobs.values()]
    .filter((j) => !["awaiting_confirmation", "cancelled", "failed"].includes(j.status))
    .reduce((n, j) => n + j.total_pages, 0);
}

const notInDemo = async (): Promise<never> => {
  throw new Error(
    "Mock papers need the backend and a Gemini API key, so they're off in demo mode.",
  );
};

export const demoApi = {
  health: async (): Promise<Health> => ({
    status: "ok",
    groq_configured: false,
    gemini_configured: false,
    auth_required: false,
    shared_printer: "mock",
    shared_printer_online: true,
  }),

  createDesign: async (raw: string) => {
    await wait(700);
    return save(understand(uid(), raw));
  },
  clarifyDesign: async (id: string, answer: string) => {
    await wait(500);
    return save(understand(id, answer));
  },
  generateDesign: async (id: string) => {
    const d = getDesign(id);
    await wait(2200);
    return save({ ...d, status: "preview_ready", output_type: "image", preview_url: HOUSE_IMAGE });
  },
  confirmDesign: async (id: string) => {
    const d = getDesign(id);
    await wait(800);
    return save({
      ...d,
      status: "confirmed",
      final_url: HOUSE_IMAGE,
      print_url: HOUSE_PDF,
      page_count: 1,
    });
  },
  rejectDesign: async (id: string) => save({ ...getDesign(id), status: "ready_to_generate" }),
  listDesigns: async () =>
    [...designs.values()].reverse().map((d) => ({ ...d })),

  listMaterials: async () => [],
  listPapers: async () => [],
  uploadMaterial: notInDemo,
  deleteMaterial: notInDemo,
  createPaper: notInDemo,
  getPaper: notInDemo,
  regeneratePaper: notInDemo,

  createPrintJob: async (input: {
    source_type: PrintSource;
    source_id: string;
    destination: PrintDestination;
    copies: number;
    color?: boolean;
    duplex?: boolean;
  }): Promise<PrintJob> => {
    const d = input.source_type === "design" ? designs.get(input.source_id) : undefined;
    const job: PrintJob = {
      id: uid(),
      source_type: input.source_type,
      source_id: input.source_id,
      destination: input.destination,
      title: d ? "House (demo)" : "Demo document",
      file_url: HOUSE_PDF,
      pages: 1,
      copies: input.copies,
      total_pages: input.copies,
      color: input.color ?? true,
      duplex: input.duplex ?? false,
      paper_size: "A4",
      status: "awaiting_confirmation",
      printer_name: null,
      error_message: null,
      created_at: now(),
      completed_at: null,
    };
    jobs.set(job.id, job);
    return { ...job };
  },
  confirmPrintJob: async (id: string): Promise<PrintJob> => {
    const j = jobs.get(id);
    if (!j) throw new Error("Demo print job not found.");
    if (j.total_pages > DAILY_LIMIT - usedPages()) throw new Error("Daily page limit reached.");
    const next =
      j.destination === "device"
        ? { ...j, status: "sent_to_device" as const, printer_name: "Your device" }
        : { ...j, status: "queued" as const, confirmedAt: Date.now() };
    jobs.set(id, next);
    return liveStatus(next);
  },
  cancelPrintJob: async (id: string): Promise<PrintJob> => {
    const j = jobs.get(id);
    if (!j) throw new Error("Demo print job not found.");
    const next = { ...j, status: "cancelled" as const };
    jobs.set(id, next);
    return { ...next };
  },
  listPrintJobs: async () =>
    [...jobs.values()]
      .filter((j) => j.status !== "awaiting_confirmation")
      .reverse()
      .map(liveStatus),
  quota: async (): Promise<PrintQuota> => {
    const used = usedPages();
    return {
      daily_limit: DAILY_LIMIT,
      used_today: used,
      reserved: 0,
      remaining: Math.max(0, DAILY_LIMIT - used),
      max_pages_per_job: 20,
      max_copies: 5,
    };
  },
  printer: async (): Promise<PrinterStatus> => ({
    shared_available: true,
    backend: "mock",
    printer_name: "Simulated school printer",
    online: true,
    detail: "Demo mode: nothing is really sent",
    queued_jobs: [...jobs.values()].map(liveStatus).filter((j) => j.status === "queued").length,
  }),
};
