'use client';

import { useState, useMemo } from 'react';
import StyleCard from '@/components/StyleCard';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { Search } from 'lucide-react';

export default function StylesPage() {
  const { data: styles, loading, error } = useApi(() => api.getStyles(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [styleType, setStyleType] = useState('All');

  const list = styles ?? [];
  const styleTypes = ['All', ...Array.from(new Set(list.map((s) => s.styleType).filter(Boolean)))];

  const filteredStyles = useMemo(() => {
    return list.filter((style) => {
      const matchesSearch = style.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = styleType === 'All' || style.styleType === styleType;
      return matchesSearch && matchesType;
    });
  }, [list, searchTerm, styleType]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-primary text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-4">Browse Hairstyles</h1>
          <p className="text-xl text-blue-100">Explore real hairstyles from Zimbabwe</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Search Styles</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Style Type</label>
              <select
                value={styleType}
                onChange={(e) => setStyleType(e.target.value)}
                className="input-base"
              >
                {styleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStyleType('All');
                }}
                className="w-full btn-outline"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* States */}
        {loading && <p className="text-gray-600">Loading styles…</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">{error}</div>
        )}

        {!loading && !error && (
          <>
            <p className="text-gray-600 mb-8">
              Showing <span className="font-bold text-primary">{filteredStyles.length}</span> styles
            </p>

            {filteredStyles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStyles.map((style) => (
                  <StyleCard key={style.id} style={style} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {list.length === 0
                    ? 'No styles yet. Run "npm run seed" in the backend to add demo data.'
                    : 'No styles match your filters.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
