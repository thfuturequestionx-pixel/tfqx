import type { Metadata } from 'next';
import Link from 'next/link';
import OpeningsList from '@/components/OpeningsList';
import { getOpenings, type Opening } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Services — TFQX',
  description:
    'How TFQX works with companies and with students: real-world projects in Finance, Analytics, Strategy, and Market Intelligence.',
};

const AUDIENCES = [
  {
    title: 'For companies',
    intro:
      'Bring us a real question. A team of motivated students works on it with research, analysis and structured thinking.',
    points: [
      'Research and analysis across Finance, Analytics, Strategy and Market Intelligence',
      'Your question run as an Open Project, worked on collaboratively',
      'Fresh perspectives from students with different skill sets',
      'A chance to meet emerging talent through their work',
    ],
    cta: 'Talk to us',
    href: '/contact?for=company',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01" />
      </svg>
    ),
  },
  {
    title: 'For students',
    intro:
      'Learn by doing. Join Open Projects and work on meaningful, real-world problems with other students.',
    points: [
      'Work on real-world cases and projects',
      'Build practical skills beyond the classroom',
      'Collaborate with students from different backgrounds',
      'Create work that strengthens your professional portfolio',
    ],
    cta: 'See open positions',
    href: '#openings',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 9l10-5 10 5-10 5L2 9zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6" />
      </svg>
    ),
  },
];

export default async function Services() {
  // null = the API could not be reached (the rest of the page still works)
  const openings: Opening[] | null = await getOpenings().catch(() => null);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <span className="motion-in inline-block rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-start)]">
        Services
      </span>
      <h1
        style={{ '--delay': '0.1s' } as React.CSSProperties}
        className="motion-in mt-6 max-w-3xl text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl"
      >
        Real problems, <span className="text-gradient">worked on together</span>
      </h1>
      <p
        style={{ '--delay': '0.2s' } as React.CSSProperties}
        className="motion-in mt-4 max-w-2xl text-base text-[var(--muted)] sm:text-lg"
      >
        TFQX connects practical questions with students who want to solve them. Here is how we work
        with each side.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {AUDIENCES.map((audience, i) => (
          <div
            key={audience.title}
            style={{ '--d': `${i * 12}%` } as React.CSSProperties}
            className="reveal flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-8 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-start)]/40 hover:shadow-lg sm:p-10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] text-[var(--accent-start)]">
              {audience.icon}
            </div>
            <h2 className="mt-6 text-2xl font-bold text-[var(--foreground)]">{audience.title}</h2>
            <p className="mt-3 text-[var(--muted)]">{audience.intro}</p>

            <ul className="mt-6 space-y-3">
              {audience.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-[var(--foreground)] sm:text-base">
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-1 h-4 w-4 shrink-0 text-[var(--accent-start)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <Link
              href={audience.href}
              className="mt-8 inline-flex w-fit rounded-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] px-6 py-3 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
            >
              {audience.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Open positions: for students only */}
      <div id="openings" className="mt-24 scroll-mt-24">
        <div className="reveal flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">Open positions</h2>
          <span className="rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-start)]">
            For students
          </span>
        </div>
        <p className="reveal mt-3 max-w-2xl text-[var(--muted)]">
          Roles open to students. Open one to see what it involves, then apply through our Google Form.
        </p>

        <div className="mt-8">
          {openings === null ? (
            <p className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-[var(--muted)] backdrop-blur-sm">
              Open positions could not be loaded right now. Please try again in a moment.
            </p>
          ) : (
            <OpeningsList openings={openings} />
          )}
        </div>
      </div>
    </section>
  );
}