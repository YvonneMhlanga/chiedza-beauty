'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, Lock, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

function ResetInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-secondary mb-2">CHIEDZA</h1>
          <p className="text-blue-100">Set a new password</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {!token ? (
            <div className="text-center">
              <h2 className="text-xl font-black mb-2 text-gray-900">Missing reset link</h2>
              <p className="text-gray-600 text-sm mb-6">
                Open the reset link from the “Forgot password” step, or request a new one.
              </p>
              <Link href="/auth/forgot" className="btn-primary inline-block">
                Request a reset link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-black mb-2 text-gray-900">Password updated</h2>
              <p className="text-gray-600 text-sm mb-6">You can now sign in with your new password.</p>
              <Link href="/auth/login" className="btn-primary inline-block">
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black mb-6 text-center text-gray-900">New password</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-base pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className="input-base pl-10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 font-bold disabled:opacity-50"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-primary flex items-center justify-center">
          <p className="text-blue-100">Loading…</p>
        </div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
