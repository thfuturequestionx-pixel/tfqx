'use client';

import { useEffect, useState } from 'react';

type Segment = { text: string; className?: string };

type TypeWriterProps = {
  /** Pieces of text, each with optional classes (e.g. the gradient word). */
  segments: Segment[];
  /** Milliseconds per character. */
  speed?: number;
  /** Milliseconds to wait before typing starts. */
  startDelay?: number;
};

/**
 * Typing animation with a blinking cursor.
 *
 * - The text not typed yet is still in the page (hidden), so the layout never jumps and
 *   line breaks match the finished headline. Hidden text is a separate, plain span: letters
 *   hidden *inside* a gradient (background-clip: text) span can still show on some browsers.
 * - The server renders the headline hidden with data-typing="pending". If the page's
 *   JavaScript is slow to start (slow phone or connection), CSS reveals the full text after
 *   a few seconds so the headline is never left blank. Once JavaScript runs it flips to "on".
 * - Screen readers get the full text straight away; reduced-motion users see it finished.
 */
export default function TypeWriter({
  segments,
  speed = 75,
  startDelay = 400,
}: TypeWriterProps) {
  const full = segments.map((s) => s.text).join('');
  const total = full.length;
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false); // false until JavaScript is running

  useEffect(() => {
    setStarted(true);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(total);
      return;
    }

    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= total && interval) clearInterval(interval);
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [total, speed, startDelay]);

  let offset = 0;

  return (
    <>
      <span className="sr-only">{full}</span>
      <span aria-hidden="true" data-typing={started ? 'on' : 'pending'}>
        {segments.map((segment, si) => {
          const start = offset;
          const end = start + segment.text.length;
          offset = end;

          const typedLength = Math.min(Math.max(count - start, 0), segment.text.length);
          const typed = segment.text.slice(0, typedLength);
          const rest = segment.text.slice(typedLength);
          const isLast = si === segments.length - 1;
          const cursorHere = started && count >= start && (count < end || (isLast && count >= total));

          return (
            <span key={si}>
              <span className={segment.className}>{typed}</span>
              {cursorHere && <span className="typewriter-cursor" />}
              {rest && <span className="typewriter-rest">{rest}</span>}
            </span>
          );
        })}
      </span>
    </>
  );
}