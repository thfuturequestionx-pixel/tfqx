'use client';

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import EnquiriesPanel from '@/components/EnquiriesPanel';
import OpeningsManager from '@/components/OpeningsManager';
import {
  ApiError,
  AUTHOR_TYPES,
  CATEGORIES,
  assetUrl,
  deleteProject,
  errorMessage,
  getEnquiries,
  getProjects,
  login,
  saveProject,
  uploadFile,
  verifyToken,
  type AuthorType,
  type Category,
  type Project,
  type ProjectInput,
  type ProjectLink,
} from '@/lib/api';

const TOKEN_KEY = 'tfqx-host-token';

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70';
const labelCls = 'block text-sm font-medium text-[var(--foreground)]';
const hintCls = 'mt-1 text-xs text-[var(--muted)]';
const primaryBtn =
  'rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50';
const ghostBtn =
  'rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent-start)]/40 disabled:opacity-50';

const AUTHOR_TYPE_OPTION: Record<AuthorType, string> = {
  host: 'TFQX (the host)',
  group: 'A group',
  individual: 'An individual',
};

/* ---------------------------------------------------------------- shell */

export default function HostPanel() {
  // undefined = still checking for a saved login
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(TOKEN_KEY);
    } catch {
      // storage unavailable: just ask for login
    }
    if (!saved) {
      setToken(null);
      return;
    }
    verifyToken(saved)
      .then((ok) => setToken(ok ? saved : null))
      .catch(() => setToken(saved)); // API unreachable: keep the token, show errors later
  }, []);

  const handleLogin = useCallback((t: string) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, t);
    } catch {
      // ignore
    }
    setToken(t);
  }, []);

  const handleLogout = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    setToken(null);
  }, []);

  if (token === undefined) return null;
  if (!token) return <LoginForm onLogin={handleLogin} />;
  return <Dashboard token={token} onLogout={handleLogout} />;
}

/* ---------------------------------------------------------------- login */

function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin(await login(username, password));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-sm space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 backdrop-blur-sm"
    >
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Host login</h2>
      <label className={labelCls}>
        Username
        <input
          className={`${inputCls} mt-1 font-normal`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <label className={labelCls}>
        Password
        <input
          type="password"
          className={`${inputCls} mt-1 font-normal`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------ dashboard */

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<'projects' | 'enquiries' | 'openings'>('projects');
  const [newCount, setNewCount] = useState(0);

  // Know about unread messages right away, even before the Enquiries tab is opened
  useEffect(() => {
    getEnquiries(token, { limit: 1 })
      .then((d) => setNewCount(d.new_count))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) onLogout();
      });
  }, [token, onLogout]);

  const tabBtn = (value: 'projects' | 'enquiries' | 'openings', label: string, badge?: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      onClick={() => setTab(value)}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        tab === value
          ? 'border-transparent bg-[var(--foreground)] text-[var(--background)]'
          : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
      }`}
    >
      {label}
      {badge ? (
        <span className="ml-2 rounded-full bg-[var(--accent-start)] px-2 py-0.5 text-xs text-[var(--background)]">
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Dashboard sections" className="flex flex-wrap gap-2">
          {tabBtn('projects', 'Projects')}
          {tabBtn('enquiries', 'Enquiries', newCount)}
          {tabBtn('openings', 'Openings')}
        </div>
        <button type="button" className={ghostBtn} onClick={onLogout}>
          Sign out
        </button>
      </div>

      {tab === 'projects' ? (
        <ProjectsTab token={token} onLogout={onLogout} />
      ) : tab === 'enquiries' ? (
        <EnquiriesPanel token={token} onUnauthorized={onLogout} onNewCountChange={setNewCount} />
      ) : (
        <OpeningsManager token={token} onUnauthorized={onLogout} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------ projects tab */


function ProjectsTab({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        onLogout(); // token expired
        return;
      }
      setError(errorMessage(err));
    },
    [onLogout],
  );

  const reload = useCallback(async () => {
    try {
      setProjects((await getProjects({ limit: 50 })).items);
      setError('');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function remove(project: Project) {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      await deleteProject(token, project.id);
      setMessage('Project deleted.');
      await reload();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        {!showForm && (
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
              setMessage('');
            }}
          >
            + New project
          </button>
        )}
      </div>

      {message && (
        <p role="status" className="text-sm text-[var(--accent-start)]">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      {showForm && (
        <ProjectForm
          key={editing?.id ?? 'new'}
          token={token}
          initial={editing}
          onUnauthorized={onLogout}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async (saved) => {
            setMessage(editing ? `Updated "${saved.title}".` : `Published "${saved.title}".`);
            setShowForm(false);
            setEditing(null);
            await reload();
          }}
        />
      )}

      <section>
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Published projects</h2>
        {loading ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Nothing published yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--panel)] backdrop-blur-sm">
            {projects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--foreground)]">
                    {p.title}
                    {p.featured && <span className="ml-2 text-xs text-[var(--accent-start)]">Featured</span>}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {p.category} · {p.author_name} · {p.views} {p.views === 1 ? 'view' : 'views'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`/projects/${p.id}`} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
                    View
                  </a>
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => {
                      setEditing(p);
                      setShowForm(true);
                      setMessage('');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className={`${ghostBtn} text-red-500`} onClick={() => remove(p)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- form */

type FormState = {
  title: string;
  summary: string;
  description: string;
  category: Category;
  authorType: AuthorType;
  authorName: string;
  members: string;
  tags: string;
  coverImage: string;
  completedOn: string;
  featured: boolean;
  links: ProjectLink[];
};

function toState(p: Project | null): FormState {
  return {
    title: p?.title ?? '',
    summary: p?.summary ?? '',
    description: p?.description ?? '',
    category: p?.category ?? 'Finance',
    authorType: p?.author_type ?? 'host',
    authorName: p?.author_name ?? 'TFQX',
    members: p?.members.join(', ') ?? '',
    tags: p?.tags.join(', ') ?? '',
    coverImage: p?.cover_image ?? '',
    completedOn: p?.completed_on ?? '',
    featured: p?.featured ?? false,
    links: p?.links ?? [],
  };
}

const splitList = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

function ProjectForm({
  token,
  initial,
  onSaved,
  onCancel,
  onUnauthorized,
}: {
  token: string;
  initial: Project | null;
  onSaved: (project: Project) => void | Promise<void>;
  onCancel: () => void;
  onUnauthorized: () => void;
}) {
  const [f, setF] = useState<FormState>(() => toState(initial));
  const [busy, setBusy] = useState<'save' | 'cover' | 'file' | null>(null);
  const [error, setError] = useState('');

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  function fail(err: unknown) {
    if (err instanceof ApiError && err.status === 401) return onUnauthorized();
    setError(errorMessage(err));
  }

  async function onCoverFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('cover');
    setError('');
    try {
      set('coverImage', (await uploadFile(token, file)).url);
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }

  async function onAttachment(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('file');
    setError('');
    try {
      const { url, filename } = await uploadFile(token, file);
      setF((prev) => ({ ...prev, links: [...prev.links, { label: filename, url }] }));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }

  const updateLink = (i: number, patch: Partial<ProjectLink>) =>
    setF((prev) => ({ ...prev, links: prev.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy('save');
    setError('');
    const input: ProjectInput = {
      title: f.title.trim(),
      summary: f.summary.trim(),
      description: f.description.trim(),
      category: f.category,
      author_type: f.authorType,
      author_name: f.authorName.trim(),
      members: splitList(f.members),
      tags: splitList(f.tags),
      cover_image: f.coverImage.trim() || null,
      links: f.links
        .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
        .filter((l) => l.label || l.url),
      completed_on: f.completedOn || null,
      featured: f.featured,
    };
    try {
      await onSaved(await saveProject(token, input, initial?.id));
    } catch (err) {
      fail(err);
      setBusy(null);
    }
  }

  const cover = assetUrl(f.coverImage.trim() || null);

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 backdrop-blur-sm sm:p-8"
    >
      <h2 className="text-xl font-semibold text-[var(--foreground)]">
        {initial ? 'Edit project' : 'New project'}
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={`${labelCls} sm:col-span-2`}>
          Title
          <input
            className={`${inputCls} mt-1 font-normal`}
            value={f.title}
            onChange={(e) => set('title', e.target.value)}
            minLength={3}
            maxLength={120}
            required
          />
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          Short summary
          <textarea
            className={`${inputCls} mt-1 font-normal`}
            rows={2}
            value={f.summary}
            onChange={(e) => set('summary', e.target.value)}
            minLength={10}
            maxLength={300}
            required
          />
          <span className={hintCls}>Shown on the project card. 10–300 characters.</span>
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          Full description
          <textarea
            className={`${inputCls} mt-1 font-normal`}
            rows={8}
            value={f.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={10000}
          />
          <span className={hintCls}>Optional. Line breaks are kept.</span>
        </label>

        <label className={labelCls}>
          Category
          <select
            className={`${inputCls} mt-1 font-normal`}
            value={f.category}
            onChange={(e) => set('category', e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          Completed on
          <input
            type="date"
            className={`${inputCls} mt-1 font-normal`}
            value={f.completedOn}
            onChange={(e) => set('completedOn', e.target.value)}
          />
        </label>

        <label className={labelCls}>
          Project done by
          <select
            className={`${inputCls} mt-1 font-normal`}
            value={f.authorType}
            onChange={(e) => {
              const next = e.target.value as AuthorType;
              setF((prev) => ({
                ...prev,
                authorType: next,
                // keep the name sensible when switching to/from the host
                authorName: next === 'host' ? 'TFQX' : prev.authorName === 'TFQX' ? '' : prev.authorName,
              }));
            }}
          >
            {AUTHOR_TYPES.map((t) => (
              <option key={t} value={t}>
                {AUTHOR_TYPE_OPTION[t]}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          {f.authorType === 'group' ? 'Group name' : f.authorType === 'individual' ? 'Person name' : 'Name'}
          <input
            className={`${inputCls} mt-1 font-normal`}
            value={f.authorName}
            onChange={(e) => set('authorName', e.target.value)}
            maxLength={100}
            required
          />
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          Team members
          <input
            className={`${inputCls} mt-1 font-normal`}
            value={f.members}
            onChange={(e) => set('members', e.target.value)}
            placeholder="Asha, Ravi, Meera"
          />
          <span className={hintCls}>Optional. Separate names with commas.</span>
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          Tags
          <input
            className={`${inputCls} mt-1 font-normal`}
            value={f.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="fintech, valuation, case study"
          />
          <span className={hintCls}>Up to 8, separated by commas.</span>
        </label>
      </div>

      {/* Cover image */}
      <div className="space-y-3">
        <p className={labelCls}>Cover image</p>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- preview of an API-hosted image
          <img src={cover} alt="Cover preview" className="aspect-[16/9] w-full max-w-xs rounded-xl object-cover" />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className={`${ghostBtn} cursor-pointer`}>
            {busy === 'cover' ? 'Uploading…' : cover ? 'Replace image' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onCoverFile}
              disabled={busy !== null}
            />
          </label>
          {cover && (
            <button type="button" className={ghostBtn} onClick={() => set('coverImage', '')}>
              Remove
            </button>
          )}
        </div>
        <p className={hintCls}>JPG, PNG or WebP, up to 15 MB. A 16:9 image works best.</p>
      </div>

      {/* Links and files */}
      <div className="space-y-3">
        <p className={labelCls}>Links and files</p>
        {f.links.map((link, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <input
              className={`${inputCls} sm:w-48 sm:flex-none`}
              placeholder="Label"
              aria-label="Link label"
              value={link.label}
              onChange={(e) => updateLink(i, { label: e.target.value })}
              maxLength={60}
            />
            <input
              className={`${inputCls} min-w-0 flex-1`}
              placeholder="https://… or uploaded file"
              aria-label="Link address"
              value={link.url}
              onChange={(e) => updateLink(i, { url: e.target.value })}
            />
            <button
              type="button"
              className={ghostBtn}
              aria-label="Remove link"
              onClick={() => setF((prev) => ({ ...prev, links: prev.links.filter((_, idx) => idx !== i) }))}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={ghostBtn}
            disabled={f.links.length >= 8}
            onClick={() => setF((prev) => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }))}
          >
            + Add link
          </button>
          <label className={`${ghostBtn} cursor-pointer`}>
            {busy === 'file' ? 'Uploading…' : 'Upload PDF / image'}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onAttachment}
              disabled={busy !== null || f.links.length >= 8}
            />
          </label>
        </div>
        <p className={hintCls}>Reports, decks, repositories, dashboards. Up to 8.</p>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
        <input
          type="checkbox"
          checked={f.featured}
          onChange={(e) => set('featured', e.target.checked)}
          className="h-4 w-4 accent-[var(--accent-start)]"
        />
        Feature this project (shown first)
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy !== null} className={primaryBtn}>
          {busy === 'save' ? 'Saving…' : initial ? 'Save changes' : 'Publish project'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy === 'save'} className={ghostBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}