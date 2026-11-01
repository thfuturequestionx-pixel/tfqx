'use client';

import { useEffect } from 'react';
import { recordView } from '@/lib/api';

/** Invisible. Reports one view per project per browser tab session. */
export default function ViewTracker({ id }: { id: string }) {
  useEffect(() => {
    const key = `tfqx-viewed-${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // storage blocked: the API's own repeat-visit window still applies
    }
    recordView(id);
  }, [id]);

  return null;
}