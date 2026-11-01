'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Opening } from '@/lib/api';
import { APPLY_URL } from '@/lib/apply';

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'border-transparent bg-[var(--foreground)] text-[var(--background)]'
      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent-start)]/40 hover:text-[var(--foreground)]'
  }`;

/** Open positions for students: search, filter by team, and a card per role. */
export default function OpeningsList({ openings }: { openings: Opening[] }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);

  // Teams in the order they first appear, with how many positions each has
  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of openings) if (o.group) counts.set(o.group, (counts.get(o.group) ?? 0) + 1);
    return [...counts.entries()];
  }, [openings]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return openings.filter(
      (o) =>
        (group === null || o.group === group) &&
        (q === '' ||
          [o.title, o.group, o.summary, o.eligibility, o.commitment, o.duration].some((v) => v.toLowerCase().includes(q))),
    );
  }, [openings, query, group]);

  if (openings.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 backdrop-blur-sm">
        <p className="font-medium text-[var(--foreground)]">No positions are open right now.</p>
        <p className="mt-2 text-[var(--muted)]">
          New openings are posted here as they come up.{' '}
          <Link href="/contact?for=student" className="font-medium text-[var(--accent-start)] hover:underline">
            Send us a message
          </Link>{' '}
          if you would like to hear when they do.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search open positions"
          aria-label="Search open positions"
          className="w-full max-w-md rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] backdrop-blur-sm"
        />

        {groups.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by team">
            <button type="button" className={chip(group === null)} aria-pressed={group === null} onClick={() => setGroup(null)}>
              All <span className="opacity-70">{openings.length}</span>
            </button>
            {groups.map(([name, count]) => (
              <button
                key={name}
                type="button"
                className={chip(group === name)}
                aria-pressed={group === name}
                onClick={() => setGroup(group === name ? null : name)}
              >
                {name} <span className="opacity-70">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-[var(--muted)]" aria-live="polite">
        {visible.length === openings.length
          ? `${openings.length} ${openings.length === 1 ? 'position' : 'positions'} open`
          : `${visible.length} of ${openings.length} positions`}
      </p>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-[var(--muted)] backdrop-blur-sm">
          No positions match your search.
        </p>
      ) : (
        <ul className="mt-4 grid gap-6 md:grid-cols-2">
          {visible.map((o, i) => {
            const facts = [o.eligibility, o.commitment, o.duration].filter(Boolean);
            return (
              <li
                key={o.id}
                style={{ '--d': `${(i % 2) * 10}%` } as React.CSSProperties}
                className="reveal flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-start)]/40 hover:shadow-lg sm:p-7"
              >
                {o.group && (
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--accent-start)]">{o.group}</span>
                )}
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  <Link href={`/apply/${o.id}`} className="hover:underline">
                    {o.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">{o.summary}</p>

                {facts.length > 0 && (
                  <ul className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--foreground)]">
                    {facts.map((fact, k) => (
                      <li key={fact} className="flex items-center gap-3">
                        {k > 0 && <span aria-hidden="true" className="h-4 w-px bg-[var(--border)]" />}
                        {fact}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Applications are made in a Google Form (opens in a new tab) */}
                <a
                  href={APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Apply now for ${o.title} (opens the application form in a new tab)`}
                  className="mt-6 inline-flex w-fit rounded-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
                >
                  Apply now →
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}