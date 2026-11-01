import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ViewTracker from '@/components/ViewTracker';
import { assetUrl, getProject, type Project } from '@/lib/api';

const loadProject = cache(async (id: string): Promise<Project | null> => {
  try {
    return await getProject(id);
  } catch {
    return null;
  }
});

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) return { title: 'Project not found — TFQX' };
  return { title: `${project.title} — TFQX`, description: project.summary };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const AUTHOR_ROLE = {
  host: 'Project by TFQX',
  group: 'Group project',
  individual: 'Individual project',
} as const;

export default async function ProjectPage({ params }: { params: Params }) {
  const { id } = await params;
  const project = await loadProject(id);
  if (!project) notFound();

  const cover = assetUrl(project.cover_image);

  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <ViewTracker id={project.id} />
      <Link href="/projects" className="text-sm font-medium text-[var(--accent-start)] hover:opacity-80">
        ← All projects
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent-start)]">
          {project.category}
        </span>
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted)]">
          {AUTHOR_ROLE[project.author_type]}
        </span>
        {project.featured && (
          <span className="rounded-full bg-[var(--foreground)] px-3 py-1 text-[var(--background)]">Featured</span>
        )}
        {project.views > 0 && (
          <span className="text-[var(--muted)]">
            {project.views.toLocaleString('en-IN')} {project.views === 1 ? 'view' : 'views'}
          </span>
        )}
      </div>

      <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
        {project.title}
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">{project.summary}</p>

      {cover && (
        <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- images come from the API host */}
          <img src={cover} alt={project.title} className="aspect-[16/9] w-full object-cover" />
        </div>
      )}

      <dl className="mt-8 grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-sm backdrop-blur-sm sm:grid-cols-3">
        <div>
          <dt className="text-[var(--muted)]">{project.author_type === 'individual' ? 'Author' : 'By'}</dt>
          <dd className="mt-1 font-semibold text-[var(--foreground)]">{project.author_name}</dd>
        </div>
        {project.members.length > 0 && (
          <div>
            <dt className="text-[var(--muted)]">Team</dt>
            <dd className="mt-1 font-semibold text-[var(--foreground)]">{project.members.join(', ')}</dd>
          </div>
        )}
        {project.completed_on && (
          <div>
            <dt className="text-[var(--muted)]">Completed</dt>
            <dd className="mt-1 font-semibold text-[var(--foreground)]">{formatDate(project.completed_on)}</dd>
          </div>
        )}
      </dl>

      {project.description && (
        <div className="mt-10 whitespace-pre-line text-base leading-relaxed text-[var(--foreground)]/90 sm:text-lg">
          {project.description}
        </div>
      )}

      {project.links.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Links and files</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {project.links.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={assetUrl(link.url) ?? link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {project.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Link
              key={tag}
              href={`/projects?q=${encodeURIComponent(tag)}`}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent-start)]/40 hover:text-[var(--foreground)]"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}