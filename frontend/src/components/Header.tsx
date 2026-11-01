'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Projects', href: '/projects' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

function LogoMark() {
  return (
    // The source image has its own black background, so it's given a fixed
    // rounded badge rather than relying on the page's theme colors — this
    // keeps the white ring visible whether the page is in light or dark mode.
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black">
      <Image src="/logo.jpeg" alt="TFQX logo" width={144} height={141} className="h-8 w-8 object-contain" priority />
    </span>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M20.354 15.354A9 9 0 118.646 3.646a9.003 9.003 0 0011.708 11.708z" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

const isActive = (pathname: string | null, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || !!pathname?.startsWith(`${href}/`);

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu after navigating, and when Escape is pressed
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // On mount, re-apply a previously saved explicit choice (if any) — the
  // very first paint already looks right via CSS @media (prefers-color-scheme),
  // this just restores a user override that differs from system preference.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tfqx-theme');
      if (stored === 'dark' || stored === 'light') {
        const root = document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(stored);
      }
    } catch {
      // Ignore — storage may be unavailable in some preview environments.
    }
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentlyDark = root.classList.contains('dark')
      ? true
      : root.classList.contains('light')
        ? false
        : prefersDark;

    const next = currentlyDark ? 'light' : 'dark';
    root.classList.remove('dark', 'light');
    root.classList.add(next);

    try {
      localStorage.setItem('tfqx-theme', next);
    } catch {
      // Some sandboxed/preview environments block storage access — theme
      // switching still works for the current session either way.
    }
  }

  return (
    <header className="w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur max-md:sticky max-md:top-0 max-md:z-40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <div className="flex flex-col leading-none">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                TFQX
              </span>
              <span className="rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-start)]">
                V1.0
              </span>
            </div>
            <span className="mt-1 text-[10px] font-medium tracking-wide text-[var(--muted)]">
              The Future Question Xplained
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? 'page' : undefined}
              className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
          >
            <span className="icon-moon">
              <MoonIcon />
            </span>
            <span className="icon-sun">
              <SunIcon />
            </span>
          </button>

          {/* Menu button: phones only */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-strong)] md:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-[var(--border)] md:hidden">
          <ul className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                      active
                        ? 'bg-[var(--accent-soft)] text-[var(--foreground)]'
                        : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}