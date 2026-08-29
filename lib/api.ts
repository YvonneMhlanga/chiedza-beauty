// API client for the Chiedza Beauty backend (Express + SQLite).
// Override the base URL with NEXT_PUBLIC_API_URL if the backend runs elsewhere.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Where uploaded files (e.g. /uploads/xyz.jpg) are served from — the API host without /api.
const ASSET_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

/** Turn a stored image path into a URL the browser can load. */
export function assetUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${ASSET_BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export interface Salon {
  id: string;
  name: string;
  location: string;
  neighborhood: string;
  phone: string;
  services: string[];
  priceRange: string;
  rating: number;
  reviews: number;
  imageUrl: string;
}

export interface Style {
  id: string;
  title: string;
  imageUrl: string;
  stylistName: string;
  salonId: string;
  styleType: string;
  product: string;
  duration: string;
  price: string;
  technique: string;
  ageGroup: string;
}

export interface Stylist {
  id: string;
  userId?: string | null; // set for real accounts -> enables on-site messaging
  name: string;
  salonId: string | null;
  specialty: string;
  experience: string;
  startingPrice: string;
  phone: string;
  rating: number;
  reviews: number;
  bio: string;
  imageUrl: string;
  location?: string;
  available?: number;
  portfolio?: string[];
}

export type UserType = 'client' | 'braider';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  profileImage?: string | null;
}

export interface Me extends AuthUser {
  phone?: string;
  location?: string;
  bio?: string;
  specialty?: string | null;
  experience?: string | null;
  startingPrice?: string | null;
  available?: number;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
}

export interface ChatUser {
  id: string;
  name: string;
  profileImage?: string | null;
  userType?: UserType;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export interface Conversation {
  otherId: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  user: ChatUser;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  braiderId: string | null;
  salonId: string;
  styleId: string | null;
  styleTitle: string | null;
  date: string;
  time: string;
  service: string;
  note: string;
  refImage: string | null;
  status: BookingStatus;
  createdAt: string;
  // joined fields
  braiderName?: string | null;
  braiderPhone?: string | null;
  braiderImage?: string | null;
  salonName?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  clientImage?: string | null;
}

export interface NewBooking {
  braiderId?: string;
  salonId?: string;
  styleId?: string;
  styleTitle?: string;
  date: string;
  time?: string;
  service?: string;
  note?: string;
  refImage?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        // Let the browser set the multipart boundary for FormData uploads.
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(options?.headers || {}),
      },
    });
  } catch {
    throw new Error(
      'Could not reach the server. Make sure the backend is running (npm run dev in chiedza-backend, port 5000).'
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const api = {
  // Salons
  getSalons: () => request<Salon[]>('/salons'),
  getSalon: (id: string) => request<Salon>(`/salons/${id}`),

  // Styles
  getStyles: () => request<Style[]>('/styles'),
  getStyle: (id: string) => request<Style>(`/styles/${id}`),

  // Stylists
  getStylists: () => request<Stylist[]>('/stylists'),
  getStylist: (id: string) => request<Stylist>(`/stylists/${id}`),

  // Auth
  register: (name: string, email: string, password: string, userType: UserType = 'client') =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, userType }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string; resetPath?: string }>('/auth/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  // Exchange a Google ID token (from Google Identity Services) for our own session.
  googleAuth: (credential: string, userType: UserType = 'client') =>
    request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        credential,
        userType,
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      }),
    }),

  getMe: (token: string) =>
    request<Me>('/auth/me', { headers: authHeader(token) }),

  updateProfile: (
    token: string,
    data: Partial<{
      name: string;
      phone: string;
      location: string;
      bio: string;
      specialty: string;
      experience: string;
      startingPrice: string;
      available: boolean;
    }>
  ) =>
    request<{ message: string }>('/auth/profile', {
      method: 'PUT',
      headers: authHeader(token),
      body: JSON.stringify(data),
    }),

  // ── Messages ──────────────────────────────────────────────────────────────
  getConversations: (token: string) =>
    request<Conversation[]>('/messages', { headers: authHeader(token) }),

  getThread: (token: string, userId: string) =>
    request<{ user: ChatUser; messages: Message[] }>(`/messages/${userId}`, {
      headers: authHeader(token),
    }),

  sendMessage: (token: string, toUserId: string, body: string) =>
    request<Message>('/messages', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify({ toUserId, body }),
    }),

  getUnreadCount: (token: string) =>
    request<{ count: number }>('/messages/unread/count', { headers: authHeader(token) }),

  // ── Photos ────────────────────────────────────────────────────────────────
  uploadAvatar: (token: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return request<{ profileImage: string }>('/uploads/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  },

  removeAvatar: (token: string) =>
    request<{ profileImage: null }>('/uploads/avatar', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPortfolio: (token: string) =>
    request<PortfolioItem[]>('/uploads/portfolio', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addPortfolioPhoto: (token: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return request<PortfolioItem>('/uploads/portfolio', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  },

  uploadBookingImage: (token: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return request<{ imageUrl: string }>('/uploads/reference', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  },

  deletePortfolioPhoto: (token: string, id: string) =>
    request<{ message: string }>(`/uploads/portfolio/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ── Bookings ──────────────────────────────────────────────────────────────
  createBooking: (token: string, data: NewBooking) =>
    request<{ message: string; bookingId: string; braiderName?: string | null }>('/bookings', {
      method: 'POST',
      headers: authHeader(token),
      body: JSON.stringify(data),
    }),

  getMyBookings: (token: string) =>
    request<Booking[]>('/bookings', { headers: authHeader(token) }),

  getReceivedBookings: (token: string) =>
    request<Booking[]>('/bookings/received', { headers: authHeader(token) }),

  updateBooking: (token: string, id: string, status: BookingStatus) =>
    request<{ message: string; status: BookingStatus }>(`/bookings/${id}`, {
      method: 'PATCH',
      headers: authHeader(token),
      body: JSON.stringify({ status }),
    }),
};
