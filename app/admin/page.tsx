'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import {
  api,
  type AdminStats,
  type AdminUser,
  type Booking,
} from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-200 text-gray-600',
};

export default function AdminPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'denied'>('loading');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tab, setTab] = useState<'bookings' | 'users'>('bookings');

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    api.adminStats(token).then(setStats).catch(() => {});
    api.adminBookings(token).then(setBookings).catch(() => {});
    api.adminUsers(token).then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user || !user.isAdmin) {
      setStatus('denied');
      return;
    }
    setStatus('ready');
    load();
  }, [load]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4 text-center">
        <div>
          <h1 className="text-3xl font-black text-primary mb-2">Admins only</h1>
          <p className="text-gray-600 mb-6">
            This area is for Chiedza Beauty admins. Ask an admin to add your email to{' '}
            <span className="font-mono">ADMIN_EMAILS</span>.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const followUps = bookings.filter((b) => b.needsFollowUp);

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-black">Admin dashboard</h1>
          <p className="text-blue-100 mt-1">Pilot activity around HIT &amp; Belvedere.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {[
              ['Clients', stats.clients],
              ['Braiders', stats.braiders],
              ['Students', stats.students],
              ['Bookings', stats.bookings],
              ['Pending', stats.pending],
              ['Confirmed', stats.confirmed],
            ].map(([label, n]) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-2xl font-black text-primary">{n}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Follow-up alert */}
        {followUps.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800">
                {followUps.length} booking{followUps.length > 1 ? 's' : ''} need follow-up
              </p>
              <p className="text-sm text-amber-700">
                Still pending after 6 hours — contact the braider, and confirm with the client if the
                braider doesn&apos;t respond.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              tab === 'bookings' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-primary'
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              tab === 'users' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-primary'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-white border border-gray-200 text-primary ml-auto"
          >
            Refresh
          </button>
        </div>

        {tab === 'bookings' ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-cream text-left text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Braider</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className={`border-t border-gray-50 ${b.needsFollowUp ? 'bg-amber-50/60' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {b.date}
                      {b.time ? ` · ${b.time}` : ''}
                    </td>
                    <td className="px-4 py-3">{b.clientName || '—'}</td>
                    <td className="px-4 py-3">{b.braiderName || '—'}</td>
                    <td className="px-4 py-3">{b.service}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-black px-2 py-1 rounded-full ${STATUS_COLOR[b.status] || ''}`}>
                        {b.status}
                      </span>
                      {b.needsFollowUp && (
                        <span className="ml-2 text-xs font-bold text-amber-700">follow up</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {b.braiderId && (
                        <Link
                          href={`/messages?to=${b.braiderId}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <MessageCircle className="w-4 h-4" /> braider
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-cream text-left text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-50">
                    <td className="px-4 py-3">
                      {u.name}
                      {u.username ? <span className="text-gray-400"> @{u.username}</span> : ''}
                      {u.isAdmin ? <span className="ml-1 text-accent font-bold">· admin</span> : ''}
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{u.userType}</td>
                    <td className="px-4 py-3">{u.isStudent ? '🎓 yes' : '—'}</td>
                    <td className="px-4 py-3">{u.location || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
