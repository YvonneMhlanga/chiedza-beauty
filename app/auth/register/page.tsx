'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, User, Mail, Lock, CheckCircle, Scissors } from 'lucide-react';
import { api, type UserType, type RegisterExtras } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const HAIR_TYPES = [
  'Natural',
  'Relaxed',
  'Locs',
  'Currently braided',
  'Transitioning',
  'Not sure',
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType>('client');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    // client
    dateOfBirth: '',
    occupation: '',
    hairType: '',
    hairProducts: '',
    // braider
    location: '',
    experience: '',
    serviceTime: '',
    startingPrice: '',
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const looksStudent = /\.ac\.zw$|\.edu(\.|$)/i.test(form.email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const extras: RegisterExtras =
      userType === 'braider'
        ? {
            location: form.location,
            experience: form.experience,
            serviceTime: form.serviceTime,
            startingPrice: form.startingPrice,
            dateOfBirth: form.dateOfBirth,
          }
        : {
            username: form.username,
            dateOfBirth: form.dateOfBirth,
            occupation: form.occupation,
            hairType: form.hairType,
            hairProducts: form.hairProducts,
          };

    setLoading(true);
    try {
      const res = await api.register(form.name, form.email, form.password, userType, extras);
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
          <p className="text-blue-100">Join the hair community</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <h2 className="text-2xl font-black mb-6 text-center text-gray-900">Create account</h2>

              <p className="text-sm font-semibold mb-2">I want to join as a…</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setUserType('client')}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    userType === 'client' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className={`w-6 h-6 mb-2 ${userType === 'client' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="block font-bold text-primary">Client</span>
                  <span className="block text-xs text-gray-500">I want my hair done</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('braider')}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    userType === 'braider' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Scissors className={`w-6 h-6 mb-2 ${userType === 'braider' ? 'text-accent' : 'text-gray-400'}`} />
                  <span className="block font-bold text-primary">Braider</span>
                  <span className="block text-xs text-gray-500">I offer braiding</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      required
                      className="input-base pl-10"
                    />
                  </div>
                </div>

                {userType === 'client' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. tariro_n"
                      value={form.username}
                      onChange={(e) => set('username', e.target.value)}
                      className="input-base"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      required
                      className="input-base pl-10"
                    />
                  </div>
                  <p className="text-xs mt-1.5 text-gray-500">
                    Students: use your school email (e.g. <span className="font-mono">@hit.ac.zw</span>) for a 10% first-visit discount.
                    {looksStudent && <span className="text-green-600 font-semibold"> 🎓 Student email detected</span>}
                  </p>
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
                Continuing with Google creates a {userType} account. You can add the rest on your profile.
              </p>
            </>
          ) : step === 2 ? (
            <>
              <h2 className="text-2xl font-black mb-1 text-center text-gray-900">
                {userType === 'braider' ? 'Your braiding details' : 'About your hair'}
              </h2>
              <p className="text-center text-gray-500 text-sm mb-6">
                {userType === 'braider'
                  ? 'This shows on your profile. You can edit it anytime.'
                  : 'Helps braiders prepare for your appointment.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Date of birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => set('dateOfBirth', e.target.value)}
                    className="input-base"
                  />
                </div>

                {userType === 'client' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Occupation</label>
                      <input
                        type="text"
                        placeholder="e.g. Student, Nurse, Teacher"
                        value={form.occupation}
                        onChange={(e) => set('occupation', e.target.value)}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Hair type</label>
                      <select
                        value={form.hairType}
                        onChange={(e) => set('hairType', e.target.value)}
                        className="input-base"
                      >
                        <option value="">Select…</option>
                        {HAIR_TYPES.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Hair products you currently use</label>
                      <input
                        type="text"
                        placeholder="e.g. Cantu leave-in, shea butter"
                        value={form.hairProducts}
                        onChange={(e) => set('hairProducts', e.target.value)}
                        className="input-base"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Service location / area</label>
                      <input
                        type="text"
                        placeholder="e.g. Belvedere, Harare"
                        value={form.location}
                        onChange={(e) => set('location', e.target.value)}
                        className="input-base"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Years of experience</label>
                        <input
                          type="text"
                          placeholder="e.g. 4 years"
                          value={form.experience}
                          onChange={(e) => set('experience', e.target.value)}
                          className="input-base"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Est. service time</label>
                        <input
                          type="text"
                          placeholder="e.g. 4–6 hrs"
                          value={form.serviceTime}
                          onChange={(e) => set('serviceTime', e.target.value)}
                          className="input-base"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Starting price</label>
                      <input
                        type="text"
                        placeholder="e.g. $25"
                        value={form.startingPrice}
                        onChange={(e) => set('startingPrice', e.target.value)}
                        className="input-base"
                      />
                    </div>
                  </>
                )}

                <hr className="border-gray-100" />

                <div>
                  <label className="block text-sm font-semibold mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
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
                      value={form.confirmPassword}
                      onChange={(e) => set('confirmPassword', e.target.value)}
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
                  {loading ? 'Creating account…' : 'Create account'}
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
              <h2 className="text-2xl font-black mb-2">
                You&apos;re in{form.name ? `, ${form.name.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-gray-600 mb-8">
                {userType === 'braider'
                  ? 'Next: add a photo, upload your work, and set your available hours so clients can book you.'
                  : 'Next: add a photo, then browse braiders and book a slot.'}
              </p>

              <a href="/profile" className="btn-primary w-full inline-block mb-3 py-3 font-bold">
                {userType === 'braider' ? 'Set up my profile & hours' : 'Complete my profile'}
              </a>
              <a
                href={userType === 'braider' ? '/stylists' : '/stylists'}
                className="block text-primary hover:underline text-sm"
              >
                {userType === 'braider' ? 'See the braider directory' : 'Skip — find a braider'}
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
