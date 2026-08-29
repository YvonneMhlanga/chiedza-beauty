'use client';

import { useEffect, useState } from 'react';
import type { AuthUser } from './api';

// One place that owns the logged-in user. Every write fires `chiedza-auth`
// so the navbar and any page using useAuth() update immediately — no reload.
const EVENT = 'chiedza-auth';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event(EVENT));
}

export function patchStoredUser(patch: Partial<AuthUser>) {
  const current = getStoredUser();
  if (!current) return;
  localStorage.setItem('user', JSON.stringify({ ...current, ...patch }));
  window.dispatchEvent(new Event(EVENT));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event(EVENT));
}

export function useAuth() {
  const [state, setState] = useState<{
    user: AuthUser | null;
    token: string | null;
    ready: boolean;
  }>({ user: null, token: null, ready: false });

  useEffect(() => {
    const sync = () =>
      setState({ user: getStoredUser(), token: getToken(), ready: true });
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync); // other tabs
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return state;
}
