import Link from 'next/link';
import TypeWriter from '@/components/TypeWriter';
import BackgroundVideo from '@/components/BackgroundVideo';
import ProjectCard from '@/components/ProjectCard';
import { getProjects, type Project } from '@/lib/api';

const FOCUS_AREAS = [
  {
    title: 'Finance',
    description: 'Practical financial questions, cases, and analysis.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h6v6" />
      </svg>
    ),
  },
  {
    title: 'Analytics',
    description: 'Turning data into clear, usable insight.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),
  },
  {
    title: 'Strategy',
    description: 'Structured thinking behind real decisions.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
      </svg>
    ),
  },
  {
    title: 'Market Intelligence',
    description: 'Understanding markets, competitors, and trends.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path strokeLinecap="round" d="M20 20l-4.35-4.35" />
      </svg>
    ),
  },
];

const OPEN_PROJECT_BENEFITS = [
  { title: 'Real-world cases', description: 'Work on actual problems, not textbook exercises.' },
  { title: 'Practical skills', description: 'Build skills by applying them, hands-on.' },
  { title: 'Peer collaboration', description: 'Team up with students from different backgrounds.' },
  { title: 'Portfolio-ready work', description: 'Create work you can show in your professional portfolio.' },
];

/** Top 3 by views. The homepage must still load if the API is down, so failures give []. */
async function getTopProjects(): Promise<Project[]> {
  try {
    return (await getProjects({ sort: 'views', limit: 3 })).items;
  } catch {
    return [];
  }
}

export default async function Home() {
  const topProjects = await getTopProjects();
  const hasViews = topProjects.some((p) => p.views > 0);

  return (
    <>
      {/* Background video: home page only */}
      <BackgroundVideo />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        {/* Drifts down and to the right as it leaves the screen (see .drift in globals.css) */}
        <div className="drift flex flex-col items-start [--drift-x:9vw] [--drift-y:14vh]">
        <span className="rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-start)]">
          Independent · Student-led community
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
          <TypeWriter
            segments={[
              { text: 'The Future Question ' },
              { text: 'Xplained', className: 'text-gradient' },
            ]}
          />
        </h1>
        <p className="mt-6 max-w-xl text-base text-[var(--muted)] sm:text-lg">
          An independent, student-led community exploring and solving practical, real-world
          problems across Finance, Analytics, Strategy, and Market Intelligence.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/projects"
            className="rounded-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] px-6 py-3 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Explore Open Projects
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent-start)]/40"
          >
            About TFQX
          </Link>
        </div>
        </div>
      </section>

      {/* Everything below the hero is stacked above it, so the drifting hero text never covers it */}
      <div className="relative z-[1]">

      {/* Focus areas */}
      <section id="focus" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="drift flex items-end justify-between">
          <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">What we focus on</h2>
          <Link href="/about" className="text-sm font-medium text-[var(--accent-start)] hover:opacity-80">
            Learn more →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FOCUS_AREAS.map((area) => (
            <div
              key={area.title}
              className="drift rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 backdrop-blur-sm transition-colors hover:border-[var(--accent-start)]/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] text-[var(--accent-start)]">
                {area.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[var(--foreground)]">{area.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{area.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Most viewed projects (hidden if there are none, or the API is unreachable) */}
      {topProjects.length > 0 && (
        <section id="top-projects" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="drift flex items-end justify-between">
            <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              {hasViews ? 'Most viewed projects' : 'Latest projects'}
            </h2>
            <Link href="/projects" className="text-sm font-medium text-[var(--accent-start)] hover:opacity-80">
              All projects →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {topProjects.map((project, i) => (
              <ProjectCard key={project.id} project={project} rank={hasViews ? i + 1 : undefined} className="drift" />
            ))}
          </div>
        </section>
      )}

      {/* Open Projects */}
      <section id="projects" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="drift max-w-2xl">
          <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">Open Projects</h2>
          <p className="mt-3 text-[var(--muted)]">
            Learn by doing: work on meaningful problems and gain practical exposure beyond the
            classroom.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OPEN_PROJECT_BENEFITS.map((item) => (
            <div
              key={item.title}
              className="drift rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="drift flex flex-col items-start gap-6 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-soft)] to-transparent p-10 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
              Ready to work on real problems?
            </h2>
            <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
              Join a community of students learning by doing.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Get in touch
          </Link>
        </div>
      </section>
      </div>
    </>
  );
}