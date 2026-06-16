'use client';

import { useEffect } from 'react';

/**
 * Sends one lightweight, privacy-light view ping per article render. Uses
 * sendBeacon when available (non-blocking), falling back to keepalive fetch.
 * Renders nothing and never affects page paint.
 */
export function ViewTracker({ id }: { id: string | number }) {
  useEffect(() => {
    const body = JSON.stringify({ id });
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      } else {
        void fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
      }
    } catch {
      /* ignore */
    }
  }, [id]);
  return null;
}
