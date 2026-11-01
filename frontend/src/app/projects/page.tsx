import type { Metadata } from 'next';
import Link from 'next/link';
import ProjectCard from '@/components/ProjectCard';
import ProjectMarquee from '@/components/ProjectMarquee';
import {
  AUTHOR_TYPES,
  AUTHOR_TYPE_LABEL,
  CATEGORIES,
  getProjects,
  type AuthorType,
  type Category,
  type Project,
  type ProjectList,
} from '@/lib/api';

export const metadata: Metadata = {
  title: 'Projects — TFQX',
  description:
    'Projects completed by TFQX and by groups and individuals from our network across Finance, Analytics, Strategy, and Market Intelligence.',
};

const PAGE_SIZE = 12;

type SearchParams = Promise<{ category?: string; type?: string; q?: string; page?: string }>;

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'border-transparent bg-[var(--foreground)] text-[var(--background)]'
      : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent-start)]/40 hover:text-[var(--foreground)]'
  }`;

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const category = CATEGORIES.find((c) => c === sp.category) as Category | undefined;
  const authorType = AUTHOR_TYPES.find((t) => t === sp.type) as AuthorType | undefined;
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  // The moving showcase strip only appears on the plain, unfiltered first page
  const showShowcase = !category && !authorType && !q && page === 1;

  const [data, showcase] = await Promise.all([
    getProjects({
      category,
      author_type: authorType,
      q,
      limit: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }).catch((): ProjectList | null => null),
    showShowcase
      ? getProjects({ sort: 'views', limit: 12 })
          .then((r) => r.items)
          .catch((): Project[] => [])
      : Promise.resolve<Project[]>([]),
  ]);

  /** Link to this page with some filters changed, keeping the rest. */
  const href = (changes: { category?: string | null; type?: string | null; page?: number }) => {
    const params = new URLSearchParams();
    const next = {
      category: 'category' in changes ? changes.category : category,
      type: 'type' in changes ? changes.type : authorType,
    };
    if (next.category) params.set('category', next.category);
    if (next.type) params.set('type', next.type);
    if (q) params.set('q', q);
    if (changes.page && changes.page > 1) params.set('page', String(changes.page));
    const qs = params.toString();
    return qs ? `/projects?${qs}` : '/projects';
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <span className="motion-in inline-block rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-start)]">
        Projects
      </span>
      <h1 style={{ '--delay': '0.1s' } as React.CSSProperties} className="motion-in mt-6 max-w-3xl text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
        Work done by TFQX and <span className="text-gradient">our network</span>
      </h1>
      <p style={{ '--delay': '0.2s' } as React.CSSProperties} className="motion-in mt-4 max-w-2xl text-base text-[var(--muted)] sm:text-lg">
        A showcase of projects completed by TFQX itself and by groups and individuals from our
        community.
      </p>

      {/* Moving showcase: cards drift to the right; hover one to pause and read about it */}
      {showcase.length >= 3 && (
        <div className="reveal mt-12">
          <ProjectMarquee projects={showcase} />
          <p className="mt-3 text-xs text-[var(--muted)]">Hover a card to pause and read more.</p>
        </div>
      )}

      {/* Filters */}
      <div className="mt-12 space-y-4">
        <form action="/projects" className="flex max-w-md gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {authorType && <input type="hidden" name="type" value={authorType} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search projects, people, tags"
            aria-label="Search projects"
            className="w-full rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] backdrop-blur-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2" aria-label="Filter by category">
          <Link href={href({ category: null })} className={chip(!category)}>
            All categories
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={href({ category: c })} className={chip(category === c)}>
              {c}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Filter by author">
          <Link href={href({ type: null })} className={chip(!authorType)}>
            Everyone
          </Link>
          {AUTHOR_TYPES.map((t) => (
            <Link key={t} href={href({ type: t })} className={chip(authorType === t)}>
              {AUTHOR_TYPE_LABEL[t]}
            </Link>
          ))}
        </div>
      </div>

      {/* Results */}
      {data === null ? (
        <p className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-[var(--muted)] backdrop-blur-sm">
          Projects could not be loaded right now. Please try again in a moment.
        </p>
      ) : data.items.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-[var(--muted)] backdrop-blur-sm">
          {category || authorType || q
            ? 'No projects match these filters.'
            : 'No projects have been published yet. Check back soon.'}
        </p>
      ) : (
        <>
          <p className="mt-10 text-sm text-[var(--muted)]">
            {data.total} {data.total === 1 ? 'project' : 'projects'}
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-between text-sm" aria-label="Pagination">
              {page > 1 ? (
                <Link href={href({ page: page - 1 })} className={chip(false)}>
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-[var(--muted)]">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={href({ page: page + 1 })} className={chip(false)}>
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </section>
  );
}