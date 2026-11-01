/**
 * Where requests go.
 *  - On the server (rendering pages) we call the API directly, using API_URL.
 *  - In the browser we call this site's own address (/api/..., /files/...). next.config.ts
 *    forwards those to the API. So it works from any device (a phone can't reach "localhost"
 *    on your computer) and no CORS setup is needed.
 */
const SERVER_API_URL = (process.env.API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const apiBase = () => (typeof window === 'undefined' ? SERVER_API_URL : '');

export const CATEGORIES = ['Finance', 'Analytics', 'Strategy', 'Market Intelligence', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const AUTHOR_TYPES = ['host', 'group', 'individual'] as const;
export type AuthorType = (typeof AUTHOR_TYPES)[number];

/** Label used in filters and form dropdowns. */
export const AUTHOR_TYPE_LABEL: Record<AuthorType, string> = {
  host: 'TFQX',
  group: 'Groups',
  individual: 'Individuals',
};

export interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectInput {
  title: string;
  summary: string;
  description: string;
  category: Category;
  author_type: AuthorType;
  author_name: string;
  members: string[];
  tags: string[];
  cover_image: string | null;
  links: ProjectLink[];
  completed_on: string | null; // YYYY-MM-DD
  featured: boolean;
}

export interface Project extends ProjectInput {
  id: string;
  created_at: string;
  updated_at: string;
  views: number;
}

export interface ProjectList {
  items: Project[];
  total: number;
}

export const ENQUIRY_TYPES = ['company', 'student', 'other'] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];
export type EnquiryStatus = 'new' | 'handled';

export interface EnquiryInput {
  type: EnquiryType;
  name: string;
  email: string;
  organization: string;
  message: string;
  /** Honeypot: always empty for real people */
  website: string;
}

export interface Enquiry {
  id: string;
  type: EnquiryType;
  name: string;
  email: string;
  organization: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
}

export interface EnquiryList {
  items: Enquiry[];
  total: number;
  new_count: number;
}

export const STUDY_YEARS = ['First year', 'Second year', 'Third year', 'Fourth year', 'Postgraduate', 'Other'] as const;
export type StudyYear = (typeof STUDY_YEARS)[number];
export type OpeningStatus = 'open' | 'closed';
export type ApplicationStatus = 'new' | 'shortlisted' | 'declined';

export interface OpeningInput {
  title: string;
  group: string;
  summary: string;
  description: string;
  eligibility: string;
  commitment: string;
  duration: string;
  order: number;
  status: OpeningStatus;
}

export interface Opening extends OpeningInput {
  id: string;
  created_at: string;
  updated_at: string;
}

/** What the host sees: an opening plus how many applications it has. */
export interface OpeningWithCounts extends Opening {
  applications: number;
  new_applications: number;
}

export interface ApplicationInput {
  name: string;
  email: string;
  college: string;
  year: StudyYear;
  message: string;
  link: string | null;
  /** Honeypot: always empty for real people */
  website: string;
}

export interface Application {
  id: string;
  opening_id: string;
  opening_title: string;
  name: string;
  email: string;
  college: string;
  year: StudyYear;
  message: string;
  link: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface ApplicationList {
  items: Application[];
  total: number;
  new_count: number;
}

/** Uploaded files are stored as /files/... paths, which this site forwards to the API. */
export function assetUrl(path: string | null | undefined): string | null {
  return path || null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (typeof body.detail === 'string') {
      message = body.detail;
    } else if (Array.isArray(body.detail) && body.detail.length > 0) {
      const first = body.detail[0];
      const field = Array.isArray(first.loc)
        ? first.loc.filter((p: unknown) => p !== 'body').join(' → ')
        : '';
      message = field ? `${field}: ${first.msg}` : String(first.msg);
    }
  } catch {
    // response had no JSON body
  }
  return new ApiError(res.status, message);
}

/** Human-readable text for anything thrown by the helpers below. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return 'Could not reach the server. Is the API running?';
  return 'Something went wrong. Please try again.';
}

// ---------- Public reads (used by server components) ----------

export async function getProjects(params: {
  category?: Category;
  author_type?: AuthorType;
  q?: string;
  sort?: 'recent' | 'views';
  limit?: number;
  skip?: number;
}): Promise<ProjectList> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const res = await fetch(`${apiBase()}/api/projects?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function getProject(id: string): Promise<Project | null> {
  const res = await fetch(`${apiBase()}/api/projects/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

/** Tells the API that someone opened a project page (the API ignores repeat visits). */
export function recordView(id: string): void {
  fetch(`${apiBase()}/api/projects/${encodeURIComponent(id)}/view`, { method: 'POST', keepalive: true }).catch(() => {
    // view counting must never get in the visitor's way
  });
}

// ---------- Host actions (used by the /host page, in the browser) ----------

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${apiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()).access_token;
}

export async function verifyToken(token: string): Promise<boolean> {
  const res = await fetch(`${apiBase()}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok;
}

export async function saveProject(token: string, input: ProjectInput, id?: string): Promise<Project> {
  const res = await fetch(`${apiBase()}/api/projects${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function deleteProject(token: string, id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/projects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await toApiError(res);
}

export async function uploadFile(token: string, file: File): Promise<{ url: string; filename: string }> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${apiBase()}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

// ---------- Enquiries ----------

/** Public: anyone can send one. */
export async function submitEnquiry(input: EnquiryInput): Promise<void> {
  const res = await fetch(`${apiBase()}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toApiError(res);
}

/** Host only. */
export async function getEnquiries(
  token: string,
  params: { status?: EnquiryStatus; limit?: number; skip?: number } = {},
): Promise<EnquiryList> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) qs.set(key, String(value));
  }
  const res = await fetch(`${apiBase()}/api/enquiries?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function setEnquiryStatus(token: string, id: string, status: EnquiryStatus): Promise<Enquiry> {
  const res = await fetch(`${apiBase()}/api/enquiries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function deleteEnquiry(token: string, id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/enquiries/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await toApiError(res);
}

// ---------- Openings (open positions for students) ----------

/** Public: the positions that are open right now. */
export async function getOpenings(): Promise<Opening[]> {
  const res = await fetch(`${apiBase()}/api/openings`, { cache: 'no-store' });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()).items;
}

/** Public: one opening (closed ones too, so a shared link can say "applications are closed"). */
export async function getOpening(id: string): Promise<Opening | null> {
  const res = await fetch(`${apiBase()}/api/openings/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

/** Public: apply for a position. */
export async function applyToOpening(id: string, input: ApplicationInput): Promise<void> {
  const res = await fetch(`${apiBase()}/api/openings/${encodeURIComponent(id)}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toApiError(res);
}

/** Host only. */
export async function getOpeningsToManage(token: string): Promise<OpeningWithCounts[]> {
  const res = await fetch(`${apiBase()}/api/openings/manage`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()).items;
}

export async function saveOpening(token: string, input: OpeningInput, id?: string): Promise<Opening> {
  const res = await fetch(`${apiBase()}/api/openings${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function deleteOpening(token: string, id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/openings/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await toApiError(res);
}

export async function getApplications(
  token: string,
  params: { opening_id?: string; status?: ApplicationStatus; limit?: number; skip?: number } = {},
): Promise<ApplicationList> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, String(value));
  }
  const res = await fetch(`${apiBase()}/api/applications?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function setApplicationStatus(token: string, id: string, status: ApplicationStatus): Promise<Application> {
  const res = await fetch(`${apiBase()}/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function deleteApplication(token: string, id: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/applications/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await toApiError(res);
}