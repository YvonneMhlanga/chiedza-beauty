'use client';

import { useState, useMemo } from 'react';
import SalonCard from '@/components/SalonCard';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { Search, MapPin } from 'lucide-react';

export default function SalonsPage() {
  const { data: salons, loading, error } = useApi(() => api.getSalons(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('All');

  const list = salons ?? [];
  const locations = ['All', ...Array.from(new Set(list.map((s) => s.neighborhood).filter(Boolean)))];

  const filteredSalons = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return list.filter((salon) => {
      const matchesSearch =
        salon.name.toLowerCase().includes(term) ||
        salon.services.some((service) => service.toLowerCase().includes(term));
      const matchesLocation = location === 'All' || salon.neighborhood === location;
      return matchesSearch && matchesLocation;
    });
  }, [list, searchTerm, location]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-primary text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-4">Find a Salon</h1>
          <p className="text-xl text-blue-100">Trusted beauty professionals across Zimbabwe</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Search Salons</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Salon name or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-base pl-10"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocation('All');
                }}
                className="w-full btn-outline"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* States */}
        {loading && <p className="text-gray-600">Loading salons…</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-gray-600 mb-8">
              Showing <span className="font-bold text-primary">{filteredSalons.length}</span> salons
            </p>

            {filteredSalons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSalons.map((salon) => (
                  <SalonCard key={salon.id} salon={salon} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {list.length === 0
                    ? 'No salons yet. Run "npm run seed" in the backend to add demo data.'
                    : 'No salons match your filters.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
