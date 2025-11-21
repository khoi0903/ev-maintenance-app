// src/lib/auth.ts
export type Role = 'Admin' | 'Staff' | 'Technician' | 'Customer';

export type User = {
  AccountID: number;
  Username: string;
  FullName: string;
  Email?: string;
  Phone?: string;
  Role: Role;
};

const TOKEN_KEY = 'token';
const USER_KEY  = 'user';

export function saveAuth(token: string, user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return s ? (JSON.parse(s) as User) : null;
  } catch { return null; }
}
