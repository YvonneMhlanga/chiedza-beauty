'use client';

import Link from 'next/link';
import { Heart, MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-black text-lg text-secondary">CHIEDZA</p>
                <p className="text-xs text-gray-300">Beauty Discovery</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Zimbabwe's #1 platform for beauty discovery and professional connections.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-secondary mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/" className="hover:text-secondary transition">Home</Link></li>
              <li><Link href="/salons" className="hover:text-secondary transition">Find Salons</Link></li>
              <li><Link href="/styles" className="hover:text-secondary transition">Browse Styles</Link></li>
              <li><Link href="/stylists" className="hover:text-secondary transition">Braiders</Link></li>
              <li><Link href="/about" className="hover:text-secondary transition">About Us</Link></li>
              <li><Link href="/auth/register" className="hover:text-secondary transition">Become a Braider</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-secondary mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-secondary transition">Help Center</a></li>
              <li><a href="mailto:chiedzabeauty1@gmail.com" className="hover:text-secondary transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-secondary transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-secondary transition">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-secondary mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary flex-shrink-0" />
                <span>+263 77 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary flex-shrink-0" />
                <a href="mailto:chiedzabeauty1@gmail.com" className="hover:text-secondary transition">
                  chiedzabeauty1@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary flex-shrink-0" />
                <span>Harare, Zimbabwe</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <p className="text-center text-gray-400 text-sm">
            © 2026 Chiedza Beauty. All rights reserved. | Made with ❤️ for Zimbabwe
          </p>
        </div>
      </div>
    </footer>
  );
}