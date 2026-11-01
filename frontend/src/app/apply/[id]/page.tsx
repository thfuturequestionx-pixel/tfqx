import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOpening, type Opening } from '@/lib/api';
import { APPLY_URL } from '@/lib/apply';

type Params = Promise<{ id: string }>;

const load = cache(async (id: string): Promise<{ opening: Opening | null; failed: boolean }> => {
  try {
    return { opening: await getOpening(id), failed: false };
  } catch {
    return { opening: null, failed: true };
  }
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const { opening } = await load(id);
  return opening
    ? { title: `${opening.title}: apply — TFQX`, description: opening.summary }
    : { title: 'Open position — TFQX' };
}

export default async function ApplyPage({ params }: { params: Params }) {
  const { id } = await params;
  const { opening, failed } = await load(id);

  const back = (
    <Link href="/services#openings" className="text-sm font-medium text-[var(--accent-start)] hover:opacity-80">
      ← All open positions
    </Link>
  );

  if (failed) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        {back}
        <p className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-[var(--muted)] backdrop-blur-sm">
          This position could not be loaded right now. Please try again in a moment.
        </p>
      </section>
    );
  }
  if (!opening) notFound();

  const facts = [opening.eligibility, opening.commitment, opening.duration].filter(Boolean);
  const isOpen = opening.status === 'open';

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="motion-in">{back}</div>

      {opening.group && (
        <p
          style={{ '--delay': '0.05s' } as React.CSSProperties}
          className="motion-in mt-8 text-xs font-medium uppercase tracking-wide text-[var(--accent-start)]"
        >
          {opening.group}
        </p>
      )}
      <h1
        style={{ '--delay': '0.1s' } as React.CSSProperties}
        className="motion-in mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl"
      >
        {opening.title}
      </h1>
      <p style={{ '--delay': '0.18s' } as React.CSSProperties} className="motion-in mt-4 text-lg text-[var(--muted)]">
        {opening.summary}
      </p>

      {facts.length > 0 && (
        <ul
          style={{ '--delay': '0.26s' } as React.CSSProperties}
          className="motion-in mt-6 flex flex-wrap gap-2 text-sm"
        >
          {facts.map((fact) => (
            <li key={fact} className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-[var(--foreground)] backdrop-blur-sm">
              {fact}
            </li>
          ))}
        </ul>
      )}

      {opening.description && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">What the role involves</h2>
          <div className="mt-3 whitespace-pre-line text-base leading-relaxed text-[var(--foreground)]/90 sm:text-lg">
            {opening.description}
          </div>
        </div>
      )}

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-[var(--foreground)]">Apply</h2>
        {isOpen ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 backdrop-blur-sm">
            <p className="text-[var(--foreground)]">
              Applications for all positions use one Google Form. It opens in a new tab.
            </p>
            <p className="mt-2 text-[var(--muted)]">
              Mention that you are applying for <span className="font-medium text-[var(--foreground)]">{opening.title}</span>.
            </p>
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] px-6 py-3 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
            >
              Open the application form →
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 backdrop-blur-sm">
            <p className="font-medium text-[var(--foreground)]">Applications for this position are closed.</p>
            <p className="mt-2 text-[var(--muted)]">
              <Link href="/services#openings" className="font-medium text-[var(--accent-start)] hover:underline">
                See what is open now
              </Link>
              , or{' '}
              <Link href="/contact?for=student" className="font-medium text-[var(--accent-start)] hover:underline">
                send us a message
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </article>
  );
}