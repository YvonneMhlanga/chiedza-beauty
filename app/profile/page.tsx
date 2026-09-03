'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Camera, CheckCircle, Circle, X, Plus, MessageCircle, Clock } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { api, assetUrl, type UserType, type PortfolioItem, type Slot } from '@/lib/api';
import { getToken, getStoredUser, patchStoredUser } from '@/lib/auth';
import { WORK_TYPES } from '@/lib/workTypes';

const HAIR_TYPES = ['Natural', 'Relaxed', 'Locs', 'Currently braided', 'Transitioning', 'Not sure'];

type Profile = {
  name: string;
  username: string;
  email: string;
  userType: UserType;
  phone: string;
  location: string;
  bio: string;
  profileImage: string | null;
  specialty: string;
  experience: string;
  startingPrice: string;
  serviceTime: string;
  workType: string;
  dateOfBirth: string;
  occupation: string;
  hairType: string;
  hairProducts: string;
  available: boolean;
  isStudent: boolean;
};

const EMPTY: Profile = {
  name: '',
  username: '',
  email: '',
  userType: 'client',
  phone: '',
  location: '',
  bio: '',
  profileImage: null,
  specialty: '',
  experience: '',
  startingPrice: '',
  serviceTime: '',
  workType: '',
  dateOfBirth: '',
  occupation: '',
  hairType: '',
  hairProducts: '',
  available: true,
  isStudent: false,
};

export default function ProfilePage() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'signedout'>('loading');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const workInput = useRef<HTMLInputElement>(null);

  // Braider availability
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [slotError, setSlotError] = useState<string | null>(null);

  const loadSlots = useCallback((t: string) => {
    api.getMySlots(t).then(setSlots).catch(() => {});
  }, []);

  useEffect(() => {
    const t = getToken();
    const stored = getStoredUser();
    if (!t || !stored) {
      setStatus('signedout');
      return;
    }
    setToken(t);
    setProfile({
      ...EMPTY,
      name: stored.name || '',
      username: stored.username || '',
      email: stored.email || '',
      userType: stored.userType === 'braider' ? 'braider' : 'client',
      profileImage: stored.profileImage || null,
      isStudent: Boolean(stored.isStudent),
    });
    setStatus('ready');

    api
      .getMe(t)
      .then((me) => {
        setProfile((prev) => ({
          ...(prev || EMPTY),
          name: me.name || prev?.name || '',
          username: me.username || '',
          email: me.email || prev?.email || '',
          userType: (me.userType as UserType) || prev?.userType || 'client',
          phone: me.phone || '',
          location: me.location || '',
          bio: me.bio || '',
          profileImage: me.profileImage ?? prev?.profileImage ?? null,
          specialty: me.specialty || '',
          experience: me.experience || '',
          startingPrice: me.startingPrice || '',
          serviceTime: me.serviceTime || '',
          workType: me.workType || '',
          dateOfBirth: me.dateOfBirth || '',
          occupation: me.occupation || '',
          hairType: me.hairType || '',
          hairProducts: me.hairProducts || '',
          available: me.available == null ? true : Boolean(me.available),
          isStudent: Boolean(me.isStudent),
        }));
        if (me.userType === 'braider') loadSlots(t);
      })
      .catch(() => {});

    api
      .getPortfolio(t)
      .then(setPortfolio)
      .catch(() => {});
  }, [loadSlots]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        dateOfBirth: profile.dateOfBirth,
      };
      if (profile.userType === 'braider') {
        payload.specialty = profile.specialty;
        payload.experience = profile.experience;
        payload.startingPrice = profile.startingPrice;
        payload.serviceTime = profile.serviceTime;
        payload.workType = profile.workType;
        payload.available = profile.available;
      } else {
        payload.username = profile.username;
        payload.occupation = profile.occupation;
        payload.hairType = profile.hairType;
        payload.hairProducts = profile.hairProducts;
      }
      await api.updateProfile(token, payload);
      patchStoredUser({ name: profile.name, username: profile.username || null });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setError(null);
    setUploading(true);
    try {
      const { profileImage } = await api.uploadAvatar(token, file);
      setProfile((p) => (p ? { ...p, profileImage } : p));
      patchStoredUser({ profileImage });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!token) return;
    try {
      await api.removeAvatar(token);
      setProfile((p) => (p ? { ...p, profileImage: null } : p));
      patchStoredUser({ profileImage: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove photo');
    }
  };

  const onWorkPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setError(null);
    setUploading(true);
    try {
      const item = await api.addPortfolioPhoto(token, file);
      setPortfolio((list) => [item, ...list]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteWork = async (id: string) => {
    if (!token) return;
    const prev = portfolio;
    setPortfolio((list) => list.filter((x) => x.id !== id));
    try {
      await api.deletePortfolioPhoto(token, id);
    } catch {
      setPortfolio(prev);
    }
  };

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSlotError(null);
    if (!newSlot.date || !newSlot.startTime) {
      setSlotError('Pick a date and start time.');
      return;
    }
    try {
      const s = await api.addSlot(token, newSlot);
      setSlots((list) =>
        [...list, s].sort((a, b) =>
          a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
        )
      );
      setNewSlot({ date: newSlot.date, startTime: '', endTime: '' });
    } catch (err) {
      setSlotError(err instanceof Error ? err.message : 'Could not add slot');
    }
  };

  const removeSlot = async (id: string) => {
    if (!token) return;
    const prev = slots;
    setSlots((list) => list.filter((s) => s.id !== id));
    try {
      await api.deleteSlot(token, id);
    } catch (err) {
      setSlots(prev);
      setSlotError(err instanceof Error ? err.message : 'Could not remove slot');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-gray-500">Loading your profile…</p>
      </div>
    );
  }

  if (status === 'signedout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-primary mb-3">You are not signed in</h1>
          <p className="text-gray-600 mb-6">Sign in to view and edit your profile.</p>
          <Link href="/auth/login" className="btn-primary inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const p = profile!;
  const isBraider = p.userType === 'braider';

  const checklist = [
    { label: 'Add a profile photo', done: Boolean(p.profileImage) },
    { label: 'Add your phone number', done: Boolean(p.phone.trim()) },
    { label: 'Add your location', done: Boolean(p.location.trim()) },
    {
      label: isBraider ? 'Write a short bio about your work' : 'Tell braiders about your hair',
      done: Boolean(p.bio.trim()),
    },
    ...(isBraider
      ? [
          { label: 'Set your main specialty', done: Boolean(p.specialty.trim()) },
          { label: 'Set your starting price', done: Boolean(p.startingPrice.trim()) },
          { label: 'Upload at least one photo of your work', done: portfolio.length > 0 },
          { label: 'Add at least one available time slot', done: slots.length > 0 },
        ]
      : [{ label: 'Add your hair type', done: Boolean(p.hairType.trim()) }]),
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const complete = doneCount === checklist.length;

  return (
    <div className="min-h-screen bg-cream">
      <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
      <input ref={workInput} type="file" accept="image/*" className="hidden" onChange={onWorkPick} />

      {/* Header */}
      <div className="bg-primary text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <Avatar
              src={assetUrl(p.profileImage) || undefined}
              name={p.name}
              className="w-28 h-28 ring-4 ring-white/20"
            />
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              title="Upload a profile photo"
              className="absolute -bottom-1 -right-1 bg-secondary text-primary rounded-full p-2 shadow hover:bg-yellow-400"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <div className="flex gap-2 justify-center sm:justify-start mb-2">
              <span className="inline-block bg-secondary text-primary text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
                {isBraider ? 'Braider' : 'Client'}
              </span>
              {p.isStudent && (
                <span className="inline-block bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
                  🎓 Student
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black">{p.name || 'Your name'}</h1>
            {p.username && <p className="text-blue-200 text-sm">@{p.username}</p>}
            <p className="text-blue-100 flex items-center gap-2 justify-center sm:justify-start mt-1">
              <Mail className="w-4 h-4" /> {p.email}
            </p>
            {p.profileImage && (
              <button
                onClick={removeAvatar}
                className="text-blue-200 text-xs underline mt-2 hover:text-white"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Edit form */}
        <form onSubmit={save} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-black text-primary">Your details</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
          )}
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Profile saved
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Full name</label>
            <input
              className="input-base"
              value={p.name}
              onChange={(e) => setProfile({ ...p, name: e.target.value })}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  className="input-base pl-10"
                  placeholder="+263 77 000 0000"
                  value={p.phone}
                  onChange={(e) => setProfile({ ...p, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  className="input-base pl-10"
                  placeholder="Harare"
                  value={p.location}
                  onChange={(e) => setProfile({ ...p, location: e.target.value })}
                />
              </div>
            </div>
          </div>

          {isBraider && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Main specialty</label>
                  <input
                    className="input-base"
                    placeholder="e.g. Knotless box braids"
                    value={p.specialty}
                    onChange={(e) => setProfile({ ...p, specialty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Experience</label>
                  <input
                    className="input-base"
                    placeholder="e.g. 4 years"
                    value={p.experience}
                    onChange={(e) => setProfile({ ...p, experience: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Starting price</label>
                  <input
                    className="input-base"
                    placeholder="e.g. $25"
                    value={p.startingPrice}
                    onChange={(e) => setProfile({ ...p, startingPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Estimated service time</label>
                  <input
                    className="input-base"
                    placeholder="e.g. 4–6 hrs"
                    value={p.serviceTime}
                    onChange={(e) => setProfile({ ...p, serviceTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Where do you braid?</label>
                  <select
                    className="input-base"
                    value={p.workType}
                    onChange={(e) => setProfile({ ...p, workType: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {WORK_TYPES.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.emoji} {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Date of birth</label>
                  <input
                    type="date"
                    className="input-base"
                    value={p.dateOfBirth}
                    onChange={(e) => setProfile({ ...p, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-accent"
                  checked={p.available}
                  onChange={(e) => setProfile({ ...p, available: e.target.checked })}
                />
                <span className="text-sm font-semibold text-primary">Available for bookings</span>
              </label>
            </>
          )}

          {!isBraider && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Username</label>
                  <input
                    className="input-base"
                    placeholder="e.g. tariro_n"
                    value={p.username}
                    onChange={(e) => setProfile({ ...p, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Date of birth</label>
                  <input
                    type="date"
                    className="input-base"
                    value={p.dateOfBirth}
                    onChange={(e) => setProfile({ ...p, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Occupation</label>
                  <input
                    className="input-base"
                    placeholder="e.g. Student, Nurse"
                    value={p.occupation}
                    onChange={(e) => setProfile({ ...p, occupation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Hair type</label>
                  <select
                    className="input-base"
                    value={p.hairType}
                    onChange={(e) => setProfile({ ...p, hairType: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {HAIR_TYPES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Hair products you currently use</label>
                <input
                  className="input-base"
                  placeholder="e.g. Cantu leave-in, shea butter"
                  value={p.hairProducts}
                  onChange={(e) => setProfile({ ...p, hairProducts: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">
              {isBraider ? 'About your work' : 'About you'}
            </label>
            <textarea
              className="input-base min-h-[100px]"
              placeholder={
                isBraider
                  ? 'Tell clients about your experience, specialties and where you work…'
                  : 'Anything braiders should know about your hair…'
              }
              value={p.bio}
              onChange={(e) => setProfile({ ...p, bio: e.target.value })}
            />
          </div>

          <button type="submit" disabled={saving} className="btn-primary font-bold disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Onboarding checklist */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {complete ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-black text-primary">Profile complete</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isBraider
                      ? 'You are listed in the braider directory and clients can message you.'
                      : "You're all set. Browse salons and styles, and message any braider."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-black text-primary">
                  Finish your profile ({doneCount}/{checklist.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  {isBraider
                    ? 'Complete these so you appear to clients and can take bookings.'
                    : 'A complete profile helps braiders respond faster.'}
                </p>
                <ul className="space-y-2">
                  {checklist.map((c) => (
                    <li key={c.label} className="flex items-center gap-2 text-sm">
                      {c.done ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={c.done ? 'text-gray-400 line-through' : 'text-primary'}>
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {isBraider ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-primary">My work</h2>
                <button
                  onClick={() => workInput.current?.click()}
                  disabled={uploading}
                  className="text-accent text-sm font-bold inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" /> {uploading ? 'Uploading…' : 'Add photo'}
                </button>
              </div>

              {portfolio.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {portfolio.map((item) => (
                    <div key={item.id} className="relative group">
                      <img
                        src={assetUrl(item.imageUrl)}
                        alt="My work"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => deleteWork(item.id)}
                        aria-label="Remove photo"
                        className="absolute -top-1.5 -right-1.5 bg-white text-accent border border-gray-200 rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => workInput.current?.click()}
                    className="h-20 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 flex items-center justify-center hover:border-accent hover:text-accent"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => workInput.current?.click()}
                  className="w-full py-8 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-accent hover:text-accent flex flex-col items-center gap-2"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-sm font-semibold">Upload photos of your braiding</span>
                </button>
              )}
              <p className="text-xs text-gray-400 mt-3">Clients see these on your profile. JPG or PNG, up to 5&nbsp;MB.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-black text-primary mb-2">Browse styles</h2>
              <p className="text-sm text-gray-600 mb-4">
                Find a look you like, then message the braider to book it.
              </p>
              <Link href="/styles" className="btn-outline-accent inline-block text-sm">
                Browse styles
              </Link>
            </div>
          )}

          {isBraider && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-black text-primary mb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" /> My available hours
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Add the time slots you can take clients. When someone books a slot it disappears from
                the list so no one else can take it.
              </p>

              {slotError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2.5 text-xs mb-3">
                  {slotError}
                </div>
              )}

              <form onSubmit={addSlot} className="grid grid-cols-2 gap-2 mb-4">
                <input
                  type="date"
                  className="input-base col-span-2"
                  value={newSlot.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                />
                <input
                  type="time"
                  className="input-base"
                  aria-label="Start time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                />
                <input
                  type="time"
                  className="input-base"
                  aria-label="End time (optional)"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                />
                <button type="submit" className="btn-primary text-sm col-span-2 py-2">
                  Add slot
                </button>
              </form>

              {slots.length === 0 ? (
                <p className="text-sm text-gray-400">No slots yet.</p>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                  {slots.map((s) => (
                    <li
                      key={s.id}
                      className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
                        s.booked ? 'bg-gray-100 text-gray-400' : 'bg-cream'
                      }`}
                    >
                      <span>
                        {s.date} · {s.startTime}
                        {s.endTime ? `–${s.endTime}` : ''}
                        {s.booked && <span className="ml-2 font-bold">booked</span>}
                      </span>
                      {!s.booked && (
                        <button
                          onClick={() => removeSlot(s.id)}
                          aria-label="Remove slot"
                          className="text-accent hover:opacity-70"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-black text-primary mb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-accent" />
              Messages &amp; bookings
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {isBraider
                ? 'See booking requests from clients and reply in chat.'
                : 'Chat with braiders and track your booking requests.'}
            </p>
            <div className="flex gap-2">
              <Link href="/messages" className="btn-primary inline-block text-sm">
                Messages
              </Link>
              <Link href="/bookings" className="btn-outline-accent inline-block text-sm">
                {isBraider ? 'Requests' : 'My bookings'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
