import Link from 'next/link';
import { assetUrl, type Project } from '@/lib/api';

export function authorLabel(project: Pick<Project, 'author_type' | 'author_name'>) {
  if (project.author_type === 'host') return 'By TFQX';
  if (project.author_type === 'group') return `Group · ${project.author_name}`;
  return project.author_name;
}

export default function ProjectCard({
  project,
  rank,
  className = '',
}: {
  project: Project;
  rank?: number;
  className?: string;
}) {
  const cover = assetUrl(project.cover_image);

  return (
    <Link
      href={`/projects/${project.id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] backdrop-blur-sm transition-colors hover:border-[var(--accent-start)]/40 ${className}`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[var(--accent-start)]/30 to-[var(--accent-end)]/30">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- images come from the API host
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-[var(--foreground)]/70">
            {project.category}
          </div>
        )}
        {rank !== undefined && (
          <span className="absolute right-3 top-3 rounded-full bg-[var(--background)]/90 px-2.5 py-1 text-xs font-bold text-[var(--accent-start)] backdrop-blur-sm">
            #{rank}
          </span>
        )}
        {project.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--foreground)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--background)]">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--accent-start)]">
          {project.category}
        </span>
        <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">{project.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">{project.summary}</p>

        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs">
          <p className="font-medium text-[var(--foreground)]">{authorLabel(project)}</p>
          {project.views > 0 && (
            <p className="shrink-0 text-[var(--muted)]">
              {project.views.toLocaleString('en-IN')} {project.views === 1 ? 'view' : 'views'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}