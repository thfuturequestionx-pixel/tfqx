'use client';

import { useState, type FormEvent } from 'react';
import { ENQUIRY_TYPES, errorMessage, submitEnquiry, type EnquiryType } from '@/lib/api';

const TYPE_OPTIONS: Record<EnquiryType, { label: string; hint: string; org: string; placeholder: string }> = {
  company: {
    label: 'A company',
    hint: 'I have a question or project for students',
    org: 'Company name',
    placeholder: 'Your company',
  },
  student: {
    label: 'A student',
    hint: 'I want to join or work on projects',
    org: 'College / university',
    placeholder: 'Where you study',
  },
  other: {
    label: 'Something else',
    hint: 'Anything else you want to ask',
    org: 'Organisation (optional)',
    placeholder: 'Optional',
  },
};

const inputCls =
  'mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70';
const labelCls = 'block text-sm font-medium text-[var(--foreground)]';

export default function ContactForm({ initialType = 'company' }: { initialType?: EnquiryType }) {
  const [type, setType] = useState<EnquiryType>(initialType);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await submitEnquiry({ type, name, email, organization, message, website });
      setSentTo(email.trim());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div
        role="status"
        className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-8 backdrop-blur-sm sm:p-10"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent-start)]/40 bg-[var(--accent-soft)] text-[var(--accent-start)]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-[var(--foreground)]">Message sent</h2>
        <p className="mt-2 text-[var(--muted)]">
          Thank you, {name.trim().split(' ')[0]}. We have received your message and will reply to{' '}
          <span className="font-medium text-[var(--foreground)]">{sentTo}</span>.
        </p>
      </div>
    );
  }

  const option = TYPE_OPTIONS[type];

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 backdrop-blur-sm sm:p-10"
    >
      <fieldset>
        <legend className={labelCls}>I am…</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {ENQUIRY_TYPES.map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                type === t
                  ? 'border-[var(--accent-start)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border)] hover:border-[var(--accent-start)]/40'
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-[var(--foreground)]">{TYPE_OPTIONS[t].label}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">{TYPE_OPTIONS[t].hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelCls}>
          Your name
          <input
            className={`${inputCls} font-normal`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label className={labelCls}>
          Email
          <input
            type="email"
            className={`${inputCls} font-normal`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>
          {option.org}
          <input
            className={`${inputCls} font-normal`}
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={option.placeholder}
            autoComplete="organization"
            maxLength={150}
          />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>
          Message
          <textarea
            className={`${inputCls} font-normal`}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minLength={10}
            maxLength={3000}
            required
          />
          <span className="mt-1 block text-xs font-normal text-[var(--muted)]">{message.length} / 3000</span>
        </label>
      </div>

      {/* Honeypot: invisible to people, tempting to bots. Real visitors never fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input
            tabIndex={-1}
            autoComplete="off"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)] px-7 py-3 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}