// src/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
    : undefined;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, cache: 'no-store' });

  if (res.status === 401 && typeof window !== 'undefined') {
    // clear token + user rồi đẩy về /signin
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    const here = window.location.pathname + window.location.search;
    window.location.href = `/signin?next=${encodeURIComponent(here)}`;

    // QUAN TRỌNG: ném lỗi để component không bị kẹt ở loading
    throw new Error('401 Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Thử parse JSON để lấy message thân thiện hơn
    let errorMessage = `${res.status} ${res.statusText}`;
    if (text) {
      try {
        const json = JSON.parse(text);
        if (json.message) {
          errorMessage = json.message;
        } else if (json.error?.message) {
          errorMessage = json.error.message;
        } else {
          errorMessage = `${res.status} ${res.statusText} - ${text}`;
        }
      } catch {
        // Không phải JSON, dùng text gốc
        errorMessage = `${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`;
      }
    }
    const error = new Error(errorMessage);
    (error as any).status = res.status;
    (error as any).responseText = text;
    throw error;
  }

  try {
    return (await res.json()) as T;
  } catch {
    // 204 No Content
    return {} as T;
  }
}

export const http = {
  get:  <T>(p: string)          => api<T>(p),
  post: <T>(p: string, b?: any) => api<T>(p, { method: 'POST', body: JSON.stringify(b) }),
  put:  <T>(p: string, b?: any) => api<T>(p, { method: 'PUT',  body: JSON.stringify(b) }),
  patch:<T>(p: string, b?: any) => api<T>(p, { method: 'PATCH', body: JSON.stringify(b) }),
  del:  <T>(p: string)          => api<T>(p, { method: 'DELETE' }),
};
