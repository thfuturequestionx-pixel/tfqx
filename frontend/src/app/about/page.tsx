import type { Metadata } from 'next';

import TeamAvatar from '@/components/TeamAvatar';

export const metadata: Metadata = {
  title: 'About — TFQX',
  description:
    'TFQX is an independent, student-led community solving practical, real-world problems across Finance, Analytics, Strategy, and Market Intelligence.',
};

const TEAM = [
  {
    name: 'Saumya Singh',
    image: '/team/saumya-singh.jpg',
    position: '50% 0%',
    zoom: 1.9,
    origin: '50% 24%',
    role: 'Business Development Head',
    linkedin: 'https://www.linkedin.com/in/-saumyasingh-',
  },
  {
    name: 'Dwarika Verma',
    image: '/team/dwarika-verma.jpg',
    position: '50% 0%',
    role: 'Founding Member',
    linkedin: 'https://www.linkedin.com/in/dwarika-verma1706',
  },
  {
    name: 'Kartikey Kumar',
    image: '/team/kartikey-kumar.jpg',
    position: '50% 0%',
    zoom: 1.2,
    origin: '50% 100%',
    role: 'Founding Member',
    linkedin: 'https://www.linkedin.com/in/ikartikyy',
  },
  {
    name: 'Radhika Rao',
    image: '/team/radhika-rao.jpg',
    position: '50% 0%',
    role: 'Corporate Relations Head',
    linkedin: 'https://www.linkedin.com/in/radhika-rao-44ab0a304',
  },
];

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export default function About() {
  return (
    <>
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <span className="motion-in inline-block rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-start)]">
        About
      </span>
      <h1 style={{ '--delay': '0.1s' } as React.CSSProperties} className="motion-in mt-6 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
        About TFQX — <span className="text-gradient">The Future Question Xplained</span>
      </h1>

      <div style={{ '--delay': '0.25s' } as React.CSSProperties} className="motion-in mt-10 space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-8 text-base leading-relaxed text-[var(--muted)] backdrop-blur-sm sm:p-10 sm:text-lg">
        <p style={{ '--delay': '0.42s' } as React.CSSProperties} className="motion-in">
          TFQX is an independent, student-led community focused on exploring and solving
          practical, real-world problems across Finance, Analytics, Strategy, and Market
          Intelligence.
        </p>
        <p style={{ '--delay': '0.54s' } as React.CSSProperties} className="motion-in">
          We bring together students with different skill sets and interests to work
          collaboratively on questions that require research, analysis, critical thinking,
          and strategic decision-making.
        </p>
        <p style={{ '--delay': '0.66s' } as React.CSSProperties} className="motion-in">
          Through our initiatives and Open Projects, members get the opportunity to work on
          real-world cases and projects, develop practical skills, collaborate with other
          students, and create work that can contribute to their professional portfolios.
        </p>
        <p style={{ '--delay': '0.78s' } as React.CSSProperties} className="motion-in font-medium text-[var(--foreground)]">
          Our aim is to build a community where students can learn by doing, work on
          meaningful problems, and gain practical exposure beyond the classroom.
        </p>
      </div>
    </section>

    {/* Team */}
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <h2 className="reveal text-2xl font-bold text-[var(--foreground)] sm:text-3xl">Meet the team</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((member, i) => (
          <div
            key={member.name}
            style={{ '--d': `${(i % 4) * 10}%` } as React.CSSProperties}
            className="reveal flex flex-col items-start rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-start)]/40 hover:shadow-lg"
          >
            <TeamAvatar
              name={member.name}
              image={member.image}
              position={member.position}
              zoom={member.zoom}
              origin={member.origin}
            />
            <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">{member.name}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{member.role}</p>
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} on LinkedIn`}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--accent-start)] transition-colors hover:border-[var(--accent-start)]/40"
            >
              <LinkedInIcon />
              LinkedIn
            </a>
          </div>
        ))}
      </div>
    </section>
    </>
  );
}