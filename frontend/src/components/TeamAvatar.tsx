'use client';

import { useState } from 'react';
import Image from 'next/image';

type TeamAvatarProps = {
  name: string;
  /** Path under /public, e.g. /team/saumya-singh.jpg */
  image: string;
  /** CSS object-position: which part of the photo stays visible, e.g. '50% 0%'. */
  position?: string;
  /** Zoom factor (1 = no zoom). Useful for full-body photos. */
  zoom?: number;
  /** CSS transform-origin for the zoom: the point that stays put, e.g. '50% 6%'. */
  origin?: string;
};

function initials(name: string) {
  const parts = name.split(' ');
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Round photo; falls back to gradient initials if the image is missing. */
export default function TeamAvatar({
  name,
  image,
  position = '50% 0%',
  zoom = 1,
  origin = '50% 0%',
}: TeamAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-start)] to-[var(--accent-end)] text-2xl font-bold text-[var(--background)]">
        {initials(name)}
      </div>
    );
  }

  return (
    <div className="h-24 w-24 overflow-hidden rounded-full border border-[var(--border)]">
      <Image
        src={image}
        alt={name}
        width={192}
        height={192}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
        style={{
          objectPosition: position,
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: origin,
        }}
      />
    </div>
  );
}