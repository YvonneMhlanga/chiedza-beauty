'use client';

import Link from 'next/link';
import { Menu, X, MessageCircle, CalendarCheck } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Avatar from '@/components/Avatar';
import { api, assetUrl } from '@/lib/api';
import { useAuth, clearAuth } from '@/lib/auth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, token } = useAuth();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    if (!token) {
      setUnread(0);
      return;
    }
    api
      .getUnreadCount(token)
      .then((r) => setUnread(r.count))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    refreshUnread();
    if (!token) return;
    const id = setInterval(refreshUnread, 20000);
    return () => clearInterval(id);
  }, [token, refreshUnread]);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  const navLinks = [
    { label: 'Salons', href: '/salons' },
    { label: 'Styles', href: '/styles' },
    { label: 'Braiders', href: '/stylists' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: 'mailto:chiedzabeauty1@gmail.com' },
  ];

  const isAdmin = Boolean(user?.isAdmin);

  const roleLabel = user?.userType === 'braider' ? 'Braider' : 'Client';

  return (
    <nav className="sticky top-0 z-50 bg-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-2xl font-black text-secondary tracking-wide">CHIEDZA</span>
            <span className="text-[0.6rem] font-semibold text-gray-300 tracking-[0.35em]">BEAUTY</span>
            <span className="text-[0.6rem] text-gray-400 mt-0.5">Beauty Discovery</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-white font-semibold hover:text-secondary transition duration-300 text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-secondary font-bold text-sm hover:opacity-80"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/bookings"
                  className="text-white hover:text-secondary transition"
                  aria-label="Bookings"
                  title="Bookings"
                >
                  <CalendarCheck className="w-6 h-6" />
                </Link>
                <Link
                  href="/messages"
                  className="relative text-white hover:text-secondary transition"
                  aria-label="Messages"
                >
                  <MessageCircle className="w-6 h-6" />
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[0.6rem] font-black min-w-[1.1rem] h-[1.1rem] rounded-full flex items-center justify-center px-1">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className="flex items-center gap-2 group">
                  <Avatar
                    src={assetUrl(user.profileImage) || undefined}
                    name={user.name}
                    className="w-9 h-9"
                  />
                  <span className="text-left leading-tight">
                    <span className="block text-secondary font-bold text-sm group-hover:underline">
                      {user.name?.split(' ')[0]}
                    </span>
                    <span className="block text-gray-400 text-[0.65rem]">{roleLabel}</span>
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-secondary transition font-semibold text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-white font-semibold hover:text-secondary transition">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-white/10 bg-primary py-6 space-y-4 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-white font-semibold hover:text-secondary transition"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {user ? (
                <>
                  <Link
                    href="/messages"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-white hover:text-secondary"
                  >
                    <MessageCircle className="w-5 h-5" /> Messages
                    {unread > 0 && (
                      <span className="bg-accent text-white text-xs font-black px-2 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-white hover:text-secondary"
                  >
                    <CalendarCheck className="w-5 h-5" /> Bookings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="block text-secondary font-bold"
                    >
                      Admin dashboard
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block text-secondary font-bold"
                  >
                    {user.name?.split(' ')[0]} · {roleLabel}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left text-white hover:text-secondary"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block text-white hover:text-secondary">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="block btn-primary text-center">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
