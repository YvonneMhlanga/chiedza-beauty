import { create } from 'zustand';

interface Salon {
  id: string;
  name: string;
  location: string;
  services: string[];
  priceRange: string;
  rating: number;
  reviews: number;
  imageUrl: string;
}

interface Style {
  id: string;
  title: string;
  imageUrl: string;
  stylistName: string;
  salonId: string;
  styleType: string;
  price: string;
}

interface SalonStore {
  salons: Salon[];
  filteredSalons: Salon[];
  styles: Style[];
  setSalons: (salons: Salon[]) => void;
  setFilteredSalons: (salons: Salon[]) => void;
  setStyles: (styles: Style[]) => void;
}

export const useSalonStore = create<SalonStore>((set) => ({
  salons: [],
  filteredSalons: [],
  styles: [],
  setSalons: (salons) => set({ salons, filteredSalons: salons }),
  setFilteredSalons: (filteredSalons) => set({ filteredSalons }),
  setStyles: (styles) => set({ styles }),
}));