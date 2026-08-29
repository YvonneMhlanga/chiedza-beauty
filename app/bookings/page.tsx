'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MessageCircle, Phone } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { api, assetUrl, type Booking, type BookingStatus } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-200 text-gray-600',
};

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function When({ b }: { b: Booking }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
      <span className="inline-flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-accent" /> {b.date}
      </span>
      {b.time && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-accent" /> {b.time}
        </span>
      )}
    </div>
  );
}

export default function BookingsPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'signedout'>('loading');
  const [isBraider, setIsBraider] = useState(false);
  const [mine, setMine] = useState<Booking[]>([]);
  const [received, setReceived] = useState<Booking[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    api.getMyBookings(token).then(setMine).catch(() => {});
    api.getReceivedBookings(token).then(setReceived).catch(() => {});
  }, []);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) {
      setStatus('signedout');
      return;
    }
    setIsBraider(user.userType === 'braider');
    setStatus('ready');
    load();
  }, [load]);

  const setBookingStatus = async (id: string, next: BookingStatus) => {
    const token = getToken();
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await api.updateBooking(token, id, next);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update booking');
    } finally {
      setBusyId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-gray-500">Loading bookings…</p>
      </div>
    );
  }

  if (status === 'signedout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="text-center">
          <h1 className="text-3xl font-black text-primary mb-3">Sign in to see bookings</h1>
          <Link href="/auth/login" className="btn-primary inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-primary mb-6">Bookings</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Braider: requests received */}
        {isBraider && (
          <section className="mb-10">
            <h2 className="text-xl font-black text-primary mb-4">Requests from clients</h2>
            {received.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
                No booking requests yet. Complete your profile and share it so clients can find you.
              </div>
            ) : (
              <div className="space-y-4">
                {received.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={assetUrl(b.clientImage) || undefined}
                        name={b.clientName || 'Client'}
                        className="w-12 h-12 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-primary">{b.clientName || 'Client'}</p>
                            <p className="text-accent font-semibold text-sm">{b.service}</p>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                        <When b={b} />
                        {b.note && <p className="text-sm text-gray-600 mt-2">“{b.note}”</p>}
                        {b.refImage && (
                          <a href={assetUrl(b.refImage)} target="_blank" rel="noopener noreferrer">
                            <img
                              src={assetUrl(b.refImage)}
                              alt="Requested style"
                              className="mt-2 w-24 h-24 object-cover rounded-lg border border-gray-200"
                            />
                          </a>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          {b.status === 'pending' && (
                            <>
                              <button
                                disabled={busyId === b.id}
                                onClick={() => setBookingStatus(b.id, 'confirmed')}
                                className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                disabled={busyId === b.id}
                                onClick={() => setBookingStatus(b.id, 'declined')}
                                className="btn-outline-accent text-sm px-4 py-2 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              disabled={busyId === b.id}
                              onClick={() => setBookingStatus(b.id, 'completed')}
                              className="btn-outline-accent text-sm px-4 py-2 disabled:opacity-50"
                            >
                              Mark completed
                            </button>
                          )}
                          <Link
                            href={`/messages?to=${b.userId}`}
                            className="text-sm px-4 py-2 inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
                          >
                            <MessageCircle className="w-4 h-4" /> Message
                          </Link>
                          {b.clientPhone && (
                            <a
                              href={`tel:${b.clientPhone}`}
                              className="text-sm px-4 py-2 inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
                            >
                              <Phone className="w-4 h-4" /> {b.clientPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Everyone: requests I made */}
        <section>
          <h2 className="text-xl font-black text-primary mb-4">My requests</h2>
          {mine.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
              You haven&apos;t requested a booking yet.{' '}
              <Link href="/stylists" className="text-accent font-semibold hover:underline">
                Find a braider
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-4">
              {mine.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={assetUrl(b.braiderImage) || undefined}
                      name={b.braiderName || b.salonName || 'Braider'}
                      className="w-12 h-12 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-primary">
                            {b.braiderName || b.salonName || 'Braider'}
                          </p>
                          <p className="text-accent font-semibold text-sm">{b.service}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                      <When b={b} />
                      {b.note && <p className="text-sm text-gray-600 mt-2">“{b.note}”</p>}

                      <div className="flex flex-wrap gap-2 mt-4">
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button
                            disabled={busyId === b.id}
                            onClick={() => setBookingStatus(b.id, 'cancelled')}
                            className="btn-outline-accent text-sm px-4 py-2 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                        {b.braiderId && (
                          <Link
                            href={`/messages?to=${b.braiderId}`}
                            className="text-sm px-4 py-2 inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
                          >
                            <MessageCircle className="w-4 h-4" /> Message
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
