import type { Metadata } from 'next';
import HostPanel from '@/components/HostPanel';

export const metadata: Metadata = {
  title: 'Host — TFQX',
  robots: { index: false, follow: false },
};

export default function HostPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">Host dashboard</h1>
      <p className="mt-3 text-[var(--muted)]">Publish and manage the projects shown on the Projects page.</p>
      <div className="mt-10">
        <HostPanel />
      </div>
    </section>
  );
}