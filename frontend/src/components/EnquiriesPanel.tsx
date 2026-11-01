'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  deleteEnquiry,
  errorMessage,
  getEnquiries,
  setEnquiryStatus,
  type Enquiry,
  type EnquiryStatus,
  type EnquiryType,
} from '@/lib/api';

const ghostBtn =
  'rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent-start)]/40 disabled:opacity-50';

const TYPE_LABEL: Record<EnquiryType, string> = {
  company: 'Company',
  student: 'Student',
  other: 'Other',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** The host's inbox: messages sent through the Contact form. */
export default function EnquiriesPanel({
  token,
  onUnauthorized,
  onNewCountChange,
}: {
  token: string;
  onUnauthorized: () => void;
  /** Lets the tab bar show how many are unread */
  onNewCountChange: (count: number) => void;
}) {
  const [filter, setFilter] = useState<EnquiryStatus | 'all'>('new');
  const [items, setItems] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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
      const data = await getEnquiries(token, { status: filter === 'all' ? undefined : filter, limit: 100 });
      setItems(data.items);
      setTotal(data.total);
      onNewCountChange(data.new_count);
      setError('');
    } catch (err) {
      fail(err);
    } finally {
      setLoading(false);
    }
  }, [token, filter, fail, onNewCountChange]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function toggle(enquiry: Enquiry) {
    const next: EnquiryStatus = enquiry.status === 'new' ? 'handled' : 'new';
    try {
      await setEnquiryStatus(token, enquiry.id, next);
      await load();
    } catch (err) {
      fail(err);
    }
  }

  async function remove(enquiry: Enquiry) {
    if (!window.confirm(`Delete the message from ${enquiry.name}? This cannot be undone.`)) return;
    try {
      await deleteEnquiry(token, enquiry.id);
      await load();
    } catch (err) {
      fail(err);
    }
  }

  const tab = (value: EnquiryStatus | 'all', label: string) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        filter === value
          ? 'border-transparent bg-[var(--foreground)] text-[var(--background)]'
          : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section aria-label="Enquiries" className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tab('new', 'New')}
        {tab('handled', 'Handled')}
        {tab('all', 'All')}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-sm text-[var(--muted)] backdrop-blur-sm">
          {filter === 'new' ? 'No new messages.' : filter === 'handled' ? 'Nothing marked as handled yet.' : 'No messages yet.'}
        </p>
      ) : (
        <>
          <p className="text-sm text-[var(--muted)]">
            {total} {total === 1 ? 'message' : 'messages'}
          </p>
          <ul className="space-y-4">
            {items.map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 backdrop-blur-sm sm:p-6"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-2.5 py-1 text-[var(--accent-start)]">
                    {TYPE_LABEL[e.type]}
                  </span>
                  {e.status === 'new' && (
                    <span className="rounded-full bg-[var(--foreground)] px-2.5 py-1 text-[var(--background)]">New</span>
                  )}
                  <span className="text-[var(--muted)]">{formatDate(e.created_at)}</span>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">{e.name}</h3>
                <p className="text-sm text-[var(--muted)]">
                  <a href={`mailto:${e.email}`} className="text-[var(--accent-start)] hover:underline">
                    {e.email}
                  </a>
                  {e.organization && <> · {e.organization}</>}
                </p>

                <p className="mt-4 whitespace-pre-line break-words text-[var(--foreground)]">{e.message}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${e.email}?subject=${encodeURIComponent('Re: your message to TFQX')}`}
                    className={ghostBtn}
                  >
                    Reply
                  </a>
                  <button type="button" className={ghostBtn} onClick={() => toggle(e)}>
                    {e.status === 'new' ? 'Mark as handled' : 'Mark as new'}
                  </button>
                  <button type="button" className={`${ghostBtn} text-red-500`} onClick={() => remove(e)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}