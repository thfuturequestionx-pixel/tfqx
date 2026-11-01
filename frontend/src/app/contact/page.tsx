import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import type { EnquiryType } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Contact — TFQX',
  description: 'Get in touch with TFQX: companies with a question, students who want to join, or anything else.',
};

type SearchParams = Promise<{ for?: string }>;

export default async function Contact({ searchParams }: { searchParams: SearchParams }) {
  // Links from the Services page arrive as /contact?for=company or /contact?for=student
  const { for: audience } = await searchParams;
  const initialType: EnquiryType = audience === 'student' ? 'student' : audience === 'other' ? 'other' : 'company';

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <span className="motion-in inline-block rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-start)]">
        Contact
      </span>
      <h1
        style={{ '--delay': '0.1s' } as React.CSSProperties}
        className="motion-in mt-6 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl"
      >
        Let&apos;s <span className="text-gradient">talk</span>
      </h1>
      <p
        style={{ '--delay': '0.2s' } as React.CSSProperties}
        className="motion-in mt-4 text-base text-[var(--muted)] sm:text-lg"
      >
        Tell us who you are and what you have in mind. A company with a question, a student who wants
        to join a project, or something else: we read every message.
      </p>

      <div style={{ '--delay': '0.3s' } as React.CSSProperties} className="motion-in mt-10">
        {/* key: switching the link's ?for= starts a fresh form with that audience selected */}
        <ContactForm key={initialType} initialType={initialType} />
      </div>
    </section>
  );
}