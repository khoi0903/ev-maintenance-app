import { http } from '@/lib/api';
import type { ApiResp } from '@/types/common';
import type { Account } from '@/types/entities';

export const authService = {
  login: (username: string, password: string) =>
    http.post<ApiResp<{ token: string; account: Account }>>('/auth/login', { username, password }),
  me: () => http.get<ApiResp<Account>>('/account/me'),
  register: (payload: any) => http.post<ApiResp<Account>>('/auth/register', payload),
  logout: () => { localStorage.removeItem('token'); localStorage.removeItem('user'); },
};
