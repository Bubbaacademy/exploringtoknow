'use client';
import { useEffect } from 'react';

/** Privacy-light view ping for a published landing page (mirrors ViewTracker). */
export function LandingViewTracker({ id }: { id: string | number }) {
  useEffect(() => {
    const body = JSON.stringify({ id });
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/lp-track', new Blob([body], { type: 'application/json' }));
      } else {
        void fetch('/api/lp-track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
      }
    } catch { /* ignore */ }
  }, [id]);
  return null;
}
