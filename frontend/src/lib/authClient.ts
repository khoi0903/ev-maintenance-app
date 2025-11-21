const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Login failed (${res.status})`);
  }

  const data = await res.json();

  // Lưu token và user info
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return data.user;
}

export async function register(payload: any) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Register failed (${res.status})`);
  }

  return await res.json();
}
