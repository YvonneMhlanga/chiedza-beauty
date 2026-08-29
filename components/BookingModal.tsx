'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { X, CalendarCheck, ImagePlus } from 'lucide-react';
import { api } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';

interface Props {
  braiderId: string;
  braiderName: string;
  defaultService?: string;
  styleId?: string;
  styleTitle?: string;
  onClose: () => void;
  onBooked?: () => void;
}

export default function BookingModal({
  braiderId,
  braiderName,
  defaultService = '',
  styleId,
  styleTitle,
  onClose,
  onBooked,
}: Props) {
  const token = getToken();
  const me = getStoredUser();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [service, setService] = useState(defaultService || styleTitle || '');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return f ? URL.createObjectURL(f) : null;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!date || !service.trim()) {
      setError('Pick a date and describe the style you want.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let refImage: string | undefined;
      if (file) {
        const up = await api.uploadBookingImage(token, file);
        refImage = up.imageUrl;
      }
      await api.createBooking(token, {
        braiderId,
        styleId,
        styleTitle,
        date,
        time,
        service: service.trim(),
        note: note.trim(),
        refImage,
      });
      setDone(true);
      onBooked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!token || !me ? (
          <div className="text-center py-6">
            <h2 className="text-xl font-black text-primary mb-2">Sign in to book</h2>
            <p className="text-gray-600 mb-5 text-sm">
              You need an account so {braiderName} can reply to your request.
            </p>
            <Link href="/auth/login" className="btn-primary inline-block">
              Sign In
            </Link>
          </div>
        ) : done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-xl font-black text-primary mb-2">Request sent</h2>
            <p className="text-gray-600 text-sm mb-5">
              {braiderName} will see it in their dashboard and can confirm or decline. You&apos;ll
              see updates in Messages and Bookings.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/bookings" className="btn-primary text-sm">
                View my bookings
              </Link>
              <button onClick={onClose} className="btn-outline-accent text-sm">
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-black text-primary mb-1">Request a booking</h2>
            <p className="text-gray-500 text-sm mb-5">with {braiderName}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Date</label>
                  <input
                    type="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Preferred time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Style / service</label>
                <input
                  type="text"
                  placeholder="e.g. Knotless box braids, waist length"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  required
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Reference photo (optional)
                </label>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={pickFile}
                />
                {preview ? (
                  <div className="relative w-28 h-28">
                    <img
                      src={preview}
                      alt="Reference"
                      className="w-28 h-28 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview((o) => {
                          if (o) URL.revokeObjectURL(o);
                          return null;
                        });
                      }}
                      className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 shadow text-accent"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-accent hover:text-accent flex flex-col items-center gap-1.5 text-sm font-semibold"
                  >
                    <ImagePlus className="w-5 h-5" />
                    Upload a photo of the style you want
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  A screenshot or saved picture of the hairstyle. JPG or PNG, up to 5&nbsp;MB.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Note (optional)</label>
                <textarea
                  placeholder="Hair length, colour, anything the braider should know…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-base min-h-[80px]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-3 font-bold disabled:opacity-50"
              >
                {saving ? 'Sending…' : 'Send booking request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
