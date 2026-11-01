'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError,
  deleteOpening,
  errorMessage,
  getOpeningsToManage,
  saveOpening,
  type OpeningInput,
  type OpeningStatus,
  type OpeningWithCounts,
} from '@/lib/api';

const inputCls =
  'mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--foreground)] placeholder:text-[var(--muted)]/70';
const labelCls = 'block text-sm font-medium text-[var(--foreground)]';
const hintCls = 'mt-1 block text-xs font-normal text-[var(--muted)]';
const primaryBtn =
  'rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50';
const ghostBtn =
  'rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent-start)]/40 disabled:opacity-50';

const toInput = (o: OpeningWithCounts): OpeningInput => ({
  title: o.title,
  group: o.group,
  summary: o.summary,
  description: o.description,
  eligibility: o.eligibility,
  commitment: o.commitment,
  duration: o.duration,
  order: o.order,
  status: o.status,
});

/** Add, edit, open/close and delete the positions listed on the Services page. */
export default function OpeningsManager({ token, onUnauthorized }: { token: string; onUnauthorized: () => void }) {
  const [items, setItems] = useState<OpeningWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OpeningWithCounts | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) return onUnauthorized();
      setError(errorMessage(err));
    },
    [onUnauthorized],
  );

  const load = useCallback(async () => {
    try {
      setItems(await getOpeningsToManage(token));
      setError('');
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }, [token, fail]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(o: OpeningWithCounts) {
    const status: OpeningStatus = o.status === 'open' ? 'closed' : 'open';
    try {
      await saveOpening(token, { ...toInput(o), status }, o.id);
      setMessage(status === 'open' ? `"${o.title}" is open for applications.` : `"${o.title}" is closed.`);
      await load();
    } catch (err) {
      fail(err);
    }
  }

  async function remove(o: OpeningWithCounts) {
    if (!window.confirm(`Delete "${o.title}"? This cannot be undone.`)) return;
    try {
      await deleteOpening(token, o.id);
      setMessage('Opening deleted.');
      await load();
    } catch (err) {
      fail(err);
    }
  }

  const groups = [...new Set(items.map((o) => o.group).filter(Boolean))];

  return (
    <section aria-label="Openings" className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-[var(--muted)]">
          These appear under &ldquo;Open positions&rdquo; on the Services page. Only open ones are shown to visitors.
          Everyone applies through the Google Form set in <code>lib/apply.ts</code>.
        </p>
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
            + New opening
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
        <OpeningForm
          key={editing?.id ?? 'new'}
          token={token}
          initial={editing}
          groups={groups}
          onUnauthorized={onUnauthorized}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async (saved) => {
            setMessage(editing ? `Updated "${saved.title}".` : `Added "${saved.title}".`);
            setShowForm(false);
            setEditing(null);
            await load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-sm text-[var(--muted)] backdrop-blur-sm">
          No openings yet. Add one and it will appear on the Services page.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--panel)] backdrop-blur-sm">
          {items.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--foreground)]">
                  {o.title}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      o.status === 'open'
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-start)]'
                        : 'border border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    {o.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {[o.group, o.eligibility, o.commitment, o.duration].filter(Boolean).join(' · ') || 'No details yet'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`/apply/${o.id}`} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
                  View
                </a>
                <button
                  type="button"
                  className={ghostBtn}
                  onClick={() => {
                    setEditing(o);
                    setShowForm(true);
                    setMessage('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Edit
                </button>
                <button type="button" className={ghostBtn} onClick={() => toggleStatus(o)}>
                  {o.status === 'open' ? 'Close' : 'Reopen'}
                </button>
                <button type="button" className={`${ghostBtn} text-red-500`} onClick={() => remove(o)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ----------------------------------------------------------------- form */

function OpeningForm({
  token,
  initial,
  groups,
  onSaved,
  onCancel,
  onUnauthorized,
}: {
  token: string;
  initial: OpeningWithCounts | null;
  groups: string[];
  onSaved: (saved: { title: string }) => void | Promise<void>;
  onCancel: () => void;
  onUnauthorized: () => void;
}) {
  const [f, setF] = useState({
    title: initial?.title ?? '',
    group: initial?.group ?? '',
    summary: initial?.summary ?? '',
    description: initial?.description ?? '',
    eligibility: initial?.eligibility ?? '',
    commitment: initial?.commitment ?? '',
    duration: initial?.duration ?? '',
    order: String(initial?.order ?? 100),
    status: (initial?.status ?? 'open') as OpeningStatus,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((prev) => ({ ...prev, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const input: OpeningInput = {
      title: f.title.trim(),
      group: f.group.trim(),
      summary: f.summary.trim(),
      description: f.description.trim(),
      eligibility: f.eligibility.trim(),
      commitment: f.commitment.trim(),
      duration: f.duration.trim(),
      order: Number.isFinite(Number(f.order)) ? Math.round(Number(f.order)) : 100,
      status: f.status,
    };
    try {
      await onSaved(await saveOpening(token, input, initial?.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onUnauthorized();
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 backdrop-blur-sm sm:p-8"
    >
      <h2 className="text-xl font-semibold text-[var(--foreground)]">{initial ? 'Edit opening' : 'New opening'}</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelCls}>
          Role title
          <input
            className={inputCls}
            value={f.title}
            onChange={(e) => set('title', e.target.value)}
            minLength={3}
            maxLength={100}
            required
          />
        </label>

        <label className={labelCls}>
          Team
          <input
            className={inputCls}
            value={f.group}
            onChange={(e) => set('group', e.target.value)}
            list="opening-groups"
            maxLength={60}
          />
          <datalist id="opening-groups">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          <span className={hintCls}>Optional. Roles with the same team are grouped under one filter button.</span>
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          Short summary
          <textarea
            className={inputCls}
            rows={2}
            value={f.summary}
            onChange={(e) => set('summary', e.target.value)}
            minLength={10}
            maxLength={300}
            required
          />
          <span className={hintCls}>Shown on the role card. 10 to 300 characters.</span>
        </label>

        <label className={`${labelCls} sm:col-span-2`}>
          What the role involves
          <textarea
            className={inputCls}
            rows={6}
            value={f.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={5000}
          />
          <span className={hintCls}>Optional. Shown on the role&apos;s own page. Line breaks are kept.</span>
        </label>

        <label className={labelCls}>
          Who can apply
          <input
            className={inputCls}
            value={f.eligibility}
            onChange={(e) => set('eligibility', e.target.value)}
            placeholder="e.g. First year students"
            maxLength={80}
          />
        </label>
        <label className={labelCls}>
          Time commitment
          <input
            className={inputCls}
            value={f.commitment}
            onChange={(e) => set('commitment', e.target.value)}
            placeholder="e.g. Six to eight hours a week"
            maxLength={80}
          />
        </label>
        <label className={labelCls}>
          Duration
          <input
            className={inputCls}
            value={f.duration}
            onChange={(e) => set('duration', e.target.value)}
            placeholder="e.g. One academic year"
            maxLength={80}
          />
        </label>

        <label className={labelCls}>
          Position in the list
          <input
            type="number"
            className={inputCls}
            value={f.order}
            onChange={(e) => set('order', e.target.value)}
            min={0}
            max={10000}
          />
          <span className={hintCls}>Lower numbers are listed first.</span>
        </label>

        <label className={labelCls}>
          Status
          <select className={inputCls} value={f.status} onChange={(e) => set('status', e.target.value as OpeningStatus)}>
            <option value="open">Open: shown on the Services page</option>
            <option value="closed">Closed: hidden from the list</option>
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? 'Saving…' : initial ? 'Save changes' : 'Add opening'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className={ghostBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}