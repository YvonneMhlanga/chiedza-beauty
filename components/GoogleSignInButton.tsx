'use client';

import { useEffect, useRef, useState } from 'react';
import { api, type UserType } from '@/lib/api';
import { setAuth } from '@/lib/auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// Inject the Google Identity Services script once, then wait until its API is
// actually available on `window` (the <script> tag can exist before it runs).
function ensureGis(): Promise<NonNullable<Window['google']>> {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onerror = () => reject(new Error('Could not load Google (check your connection).'));
      document.head.appendChild(s);
    }

    const started = Date.now();
    const tick = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google);
      } else if (Date.now() - started > 8000) {
        reject(new Error('Google sign-in did not load. Refresh and try again.'));
      } else {
        setTimeout(tick, 100);
      }
    };
    tick();
  });
}

interface Props {
  /** Role to use if this Google sign-in creates a brand new account. */
  userType?: UserType;
  onError?: (message: string) => void;
}

export default function GoogleSignInButton({ userType = 'client', onError }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'busy' | 'failed'>('loading');

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    ensureGis()
      .then((google) => {
        if (cancelled || !holderRef.current) return;

        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: 'popup',
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;
            setState('busy');
            try {
              const res = await api.googleAuth(response.credential, userType);
              setAuth(res.token, res.user);
              // Send everyone to their profile so it can be completed before use.
              window.location.href = '/profile';
            } catch (err) {
              setState('ready');
              onError?.(err instanceof Error ? err.message : 'Google sign-in failed');
            }
          },
        });

        holderRef.current.innerHTML = '';
        google.accounts.id.renderButton(holderRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: userType === 'braider' ? 'signup_with' : 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 300,
        });
        setState('ready');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState('failed');
        onError?.(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [userType, onError]);

  // Not configured yet — the site owner still needs to add a Google OAuth
  // Client ID. Link out to where they create it instead of a dead button.
  if (!CLIENT_ID) {
    return (
      <a
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noopener noreferrer"
        title="Create an OAuth Client ID, then put it in .env.local as NEXT_PUBLIC_GOOGLE_CLIENT_ID and restart the dev server"
        className="w-full flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg py-3 font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition"
      >
        <GoogleGlyph />
        Set up &ldquo;Continue with Google&rdquo;
      </a>
    );
  }

  return (
    <div className="relative min-h-[44px]">
      {/* Google renders its own button in here */}
      <div ref={holderRef} className="flex justify-center [color-scheme:light]" />

      {state === 'loading' && (
        <div className="flex items-center justify-center gap-3 border-2 border-gray-200 rounded-lg py-3 font-semibold text-gray-400">
          <GoogleGlyph />
          Loading Google…
        </div>
      )}

      {state === 'failed' && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-300 rounded-lg py-3 font-semibold text-primary hover:bg-gray-50"
        >
          <GoogleGlyph />
          Retry Google sign-in
        </button>
      )}

      {state === 'busy' && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-sm text-gray-600">
          Signing you in…
        </div>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.1 2.8 12S6.9 22 12 22c6.9 0 9.6-4.8 9.6-7.3 0-.5-.05-.9-.12-1.3H12z"
      />
    </svg>
  );
}
