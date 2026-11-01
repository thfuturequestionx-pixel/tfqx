import Link from 'next/link';
import { assetUrl, type Project } from '@/lib/api';
import { authorLabel } from '@/components/ProjectCard';

/** Each set of cards must be wider than the screen, or the loop would show a gap. */
const MIN_CARDS_PER_SET = 8;

function MarqueeCard({ project, hidden }: { project: Project; hidden: boolean }) {
  const cover = assetUrl(project.cover_image);

  return (
    <Link
      href={`/projects/${project.id}`}
      // The second copy of the strip is only there to make the loop seamless:
      // keep it out of screen readers and the keyboard tab order.
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="marquee-card group relative block h-80 w-72 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-start)]/40 to-[var(--accent-end)]/40"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- images come from the API host
        <img
          src={cover}
          alt=""
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[var(--foreground)]/70">
          {project.category}
        </div>
      )}

      {/* Resting state: just the category and title (mouse devices) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-14 transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0 [@media(hover:none)]:hidden">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">{project.category}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-white">{project.title}</h3>
      </div>

      {/* Hover / keyboard focus: the text. Touch screens have no hover, so it is always shown there. */}
      <div className="absolute inset-0 flex translate-y-4 flex-col justify-end bg-black/80 p-5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:bg-gradient-to-t [@media(hover:none)]:from-black/90 [@media(hover:none)]:via-black/60 [@media(hover:none)]:to-black/10 [@media(hover:none)]:opacity-100">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">{project.category}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-white">{project.title}</h3>
        <p className="mt-2 line-clamp-4 text-sm text-white/85">{project.summary}</p>

        {project.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border border-white/25 px-2 py-0.5 text-[11px] text-white/80">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-white">{authorLabel(project)}</span>
          <span className="shrink-0 font-semibold text-white">View project →</span>
        </div>
      </div>
    </Link>
  );
}

/** Project cards that drift to the right on their own. Hover (or focus) one to pause the strip and read about it. */
export default function ProjectMarquee({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  const copies = Math.ceil(MIN_CARDS_PER_SET / projects.length);
  const set = Array.from({ length: copies }, () => projects).flat();
  // Constant, unhurried speed no matter how many cards there are (about 45px per second)
  const duration = Math.max(40, set.length * 7);

  return (
    <div className="marquee">
      <div className="marquee-track" style={{ animationDuration: `${duration}s` }}>
        {[false, true].map((isCopy) =>
          set.map((project, i) => (
            <MarqueeCard key={`${isCopy ? 'copy' : 'main'}-${i}`} project={project} hidden={isCopy} />
          )),
        )}
      </div>
    </div>
  );
}