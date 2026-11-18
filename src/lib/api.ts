// Typed client for the FastAPI backend (../backend).
// Base URL comes from VITE_API_URL (see .env.example); defaults to local dev.
// With VITE_DEMO_MODE=true the design + print endpoints are served from memory
// by lib/demo.ts instead, so the site works without a backend.
import { DEMO_MODE, demoApi } from "@/lib/demo";

export const API_URL = (import.meta.env["VITE_API_URL"] ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

/** Turns a backend-relative asset path (/files/...) into an absolute URL. */
export function fileUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("/demo/")) return path; // bundled demo assets (public/demo)
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

// Auth: once a student signs in (see lib/auth.tsx) every request carries their
// Firebase ID token. X-Student-Id is the dev fallback when the backend runs
// without FIREBASE_PROJECT_ID.
let tokenGetter: () => Promise<string | null> = async () => null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

function devStudentId(): string {
  if (typeof window === "undefined") return "demo-student";
  try {
    let id = localStorage.getItem("student-id");
    if (!id) {
      id = `student-${crypto.randomUUID().slice(0, 8)}`;
      localStorage.setItem("student-id", id);
    }
    return id;
  } catch {
    return "demo-student";
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = await tokenGetter();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  else headers.set("X-Student-Id", devStudentId());
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, `Can't reach the backend at ${API_URL}. Is it running?`);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    const msg = Array.isArray(detail)
      ? detail.map((d: { msg: string }) => d.msg).join("; ")
      : (detail ?? `Request failed (${res.status})`);
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(
    path,
    body === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(body) },
  );

// ---------------------------------------------------------------------------
// Types (mirror backend/app/schemas.py)
// ---------------------------------------------------------------------------

export type DesignStatus =
  | "parsing"
  | "pending_clarification"
  | "ready_to_generate"
  | "moderating_request"
  | "generating"
  | "moderating_output"
  | "preview_ready"
  | "rejected"
  | "confirmed"
  | "failed";

export interface DesignRequest {
  id: string;
  status: DesignStatus;
  raw_request: string;
  structured_info: {
    subject?: string;
    purpose?: string;
    size?: string;
    orientation?: string;
    style?: string;
    workflow_type?: string;
  } | null;
  clarification_question: string | null;
  workflow_type: string | null;
  rejection_reason: string | null;
  output_type: "image" | "pdf" | null;
  preview_url: string | null;
  final_url: string | null;
  print_url: string | null;
  page_count: number | null;
  error_message: string | null;
  created_at: string;
}

export type MaterialKind = "worksheet" | "past_paper" | "notes";

export interface Material {
  id: string;
  filename: string;
  kind: MaterialKind;
  file_url: string;
  char_count: number;
  page_count: number | null;
  created_at: string;
}

export type PaperStatus =
  | "queued"
  | "blueprinting"
  | "writing"
  | "verifying"
  | "rendering"
  | "ready"
  | "failed"
  | "confirmed";

export interface BlueprintSection {
  id: string;
  title: string;
  question_type: string;
  num_questions: number;
  marks_each: number;
  instructions: string;
}

export interface Question {
  number: number;
  section: string;
  type: string;
  marks: number;
  topic?: string;
  difficulty?: string;
  question: string;
  options?: string[];
  answer: string;
  marking_scheme?: string;
}

export interface Verification {
  passed: boolean;
  total_marks_expected: number;
  total_marks_actual: number;
  question_count: number;
  section_totals: Record<string, number>;
  auto_fixes: string[];
  issues: string[];
  repaired?: string[];
  answer_audit?: { number: number; issue: string }[];
}

export interface MockPaper {
  id: string;
  status: PaperStatus;
  title: string;
  subject: string;
  grade: string | null;
  board: string | null;
  total_marks: number;
  duration_minutes: number;
  difficulty: string;
  material_ids: string[];
  blueprint: { topics: string[]; sections: BlueprintSection[] } | null;
  questions: Question[] | null;
  verification: Verification | null;
  source: "gemini" | "stub" | null;
  paper_url: string | null;
  answer_key_url: string | null;
  page_count: number | null;
  answer_key_page_count: number | null;
  error_message: string | null;
  created_at: string;
}

export interface CreatePaperInput {
  subject: string;
  title?: string;
  grade?: string;
  board?: string;
  total_marks: number;
  duration_minutes: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  instructions?: string;
  material_ids: string[];
}

export type PrintSource = "design" | "paper" | "answer_key";
export type PrintDestination = "device" | "shared";
export type PrintStatus =
  | "awaiting_confirmation"
  | "sent_to_device"
  | "queued"
  | "printing"
  | "completed"
  | "failed"
  | "cancelled";

export interface PrintJob {
  id: string;
  source_type: PrintSource;
  source_id: string;
  destination: PrintDestination;
  title: string;
  file_url: string;
  pages: number;
  copies: number;
  total_pages: number;
  color: boolean;
  duplex: boolean;
  paper_size: string;
  status: PrintStatus;
  printer_name: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PrintQuota {
  daily_limit: number;
  used_today: number;
  reserved: number;
  remaining: number;
  max_pages_per_job: number;
  max_copies: number;
}

export interface PrinterStatus {
  shared_available: boolean;
  backend: "none" | "mock" | "cups" | "agent";
  printer_name: string | null;
  online: boolean;
  detail: string;
  queued_jobs: number;
}

export interface Health {
  status: string;
  groq_configured: boolean;
  gemini_configured: boolean;
  auth_required: boolean;
  shared_printer: string;
  shared_printer_online: boolean;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const realApi = {
  health: () => request<Health>("/health"),

  // Design flow
  createDesign: (raw_request: string) => post<DesignRequest>("/api/requests", { raw_request }),
  clarifyDesign: (id: string, answer: string) =>
    post<DesignRequest>(`/api/requests/${id}/clarify`, { answer }),
  generateDesign: (id: string) => post<DesignRequest>(`/api/requests/${id}/generate`),
  confirmDesign: (id: string) => post<DesignRequest>(`/api/requests/${id}/confirm`),
  rejectDesign: (id: string) => post<DesignRequest>(`/api/requests/${id}/reject`),
  listDesigns: () => request<DesignRequest[]>("/api/requests"),

  // Mock paper flow
  uploadMaterial: (file: File, kind: MaterialKind) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    return request<Material>("/api/materials", { method: "POST", body: form });
  },
  listMaterials: () => request<Material[]>("/api/materials"),
  deleteMaterial: (id: string) => request<void>(`/api/materials/${id}`, { method: "DELETE" }),
  createPaper: (input: CreatePaperInput) => post<MockPaper>("/api/papers", input),
  getPaper: (id: string) => request<MockPaper>(`/api/papers/${id}`),
  listPapers: () => request<MockPaper[]>("/api/papers"),
  regeneratePaper: (id: string) => post<MockPaper>(`/api/papers/${id}/regenerate`),

  // Print queue
  createPrintJob: (input: {
    source_type: PrintSource;
    source_id: string;
    destination: PrintDestination;
    copies: number;
    color?: boolean;
    duplex?: boolean;
  }) => post<PrintJob>("/api/print-jobs", input),
  confirmPrintJob: (id: string) => post<PrintJob>(`/api/print-jobs/${id}/confirm`),
  cancelPrintJob: (id: string) => post<PrintJob>(`/api/print-jobs/${id}/cancel`),
  listPrintJobs: () => request<PrintJob[]>("/api/print-jobs"),
  quota: () => request<PrintQuota>("/api/print-quota"),
  printer: () => request<PrinterStatus>("/api/printer"),
};

export const api: typeof realApi = DEMO_MODE ? { ...realApi, ...demoApi } : realApi;
