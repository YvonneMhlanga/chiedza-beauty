'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Mail, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [resetPath, setResetPath] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSent(true);
      setResetPath(res.resetPath || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
          <p className="text-blue-100">Reset your password</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {sent ? (
            <div className="text-center">
              <h2 className="text-2xl font-black mb-3 text-gray-900">Check your reset link</h2>
              <p className="text-gray-600 text-sm mb-6">
                If an account exists for <span className="font-semibold">{email}</span>, a reset link
                has been created. It expires in 1 hour.
              </p>

              {resetPath ? (
                <>
                  <p className="text-xs text-gray-400 mb-2">
                    No email service is set up on this site, so use the link directly:
                  </p>
                  <Link
                    href={resetPath}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3 font-bold"
                  >
                    Set a new password <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  If that email is registered, the reset link is on its way.
                </p>
              )}

              <Link
                href="/auth/login"
                className="block text-primary hover:underline text-sm mt-6"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black mb-2 text-center text-gray-900">
                Forgot password
              </h2>
              <p className="text-gray-600 text-sm text-center mb-6">
                Enter the email you signed up with and we&apos;ll create a reset link.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? 'Creating link…' : 'Create reset link'}
                </button>
              </form>

              <Link
                href="/auth/login"
                className="block text-center text-primary hover:underline text-sm mt-6"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
