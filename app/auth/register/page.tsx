'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, User, Mail, Lock, CheckCircle, Scissors } from 'lucide-react';
import { api, type UserType } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType>('client');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(formData.name, formData.email, formData.password, userType);
      setAuth(res.token, res.user);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
          <p className="text-blue-100">Join the beauty community</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <h2 className="text-2xl font-black mb-6 text-center text-gray-900">Create Account</h2>

              {/* Role choice */}
              <p className="text-sm font-semibold mb-2">I want to join as a…</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setUserType('client')}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    userType === 'client'
                      ? 'border-accent bg-accent/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className={`w-6 h-6 mb-2 ${userType === 'client' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="block font-bold text-primary">Client</span>
                  <span className="block text-xs text-gray-500">I want to get my hair done</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('braider')}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    userType === 'braider'
                      ? 'border-accent bg-accent/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Scissors className={`w-6 h-6 mb-2 ${userType === 'braider' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="block font-bold text-primary">Braider</span>
                  <span className="block text-xs text-gray-500">I offer braiding services</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="input-base pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="input-base pl-10"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-3 font-bold">
                  Continue
                </button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <span className="h-px bg-gray-200 flex-1" />
                <span className="text-xs text-gray-400 font-semibold">OR</span>
                <span className="h-px bg-gray-200 flex-1" />
              </div>

              <GoogleSignInButton userType={userType} onError={setError} />
              <p className="text-center text-xs text-gray-400 mt-2">
                Continuing with Google creates a {userType} account.
              </p>
            </>
          ) : step === 2 ? (
            <>
              <h2 className="text-2xl font-black mb-6 text-center text-gray-900">Create Password</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="input-base pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <button
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="w-full mt-4 py-2 text-primary hover:underline"
              >
                ← Back
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-black mb-2">You&apos;re signed in{formData.name ? `, ${formData.name.split(' ')[0]}` : ''}!</h2>
              <p className="text-gray-600 mb-8">
                {userType === 'braider'
                  ? 'One more step — add your photo, specialty and starting price so clients can find and message you.'
                  : 'One more step — add your photo and details so braiders know who they are talking to.'}
              </p>

              {/* full reload so the navbar picks up the new session */}
              <a
                href="/profile"
                className="btn-primary w-full inline-block mb-3 py-3 font-bold"
              >
                Complete my profile
              </a>
              <a
                href={userType === 'braider' ? '/stylists' : '/salons'}
                className="block text-primary hover:underline text-sm"
              >
                {userType === 'braider' ? 'Skip for now — see the braider directory' : 'Skip for now — find a salon'}
              </a>
            </div>
          )}

          {step !== 3 && (
            <p className="text-center text-gray-600 mt-6 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
