'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, getUser } from '@/lib/auth';

type Role = 'Admin' | 'Staff' | 'Technician' | 'Customer';

export default function AccessGuard({
  allow = [],
  fallback = '/signin',
}: {
  allow?: Role[];          // danh sách role được phép
  fallback?: string;       // nếu không đủ quyền thì chuyển hướng
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    // Chưa đăng nhập → về /signin?next=...
    if (!token || !user) {
      router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // Có constraint role → kiểm tra
    if (allow.length > 0) {
      if (!allow.includes(user.Role as Role)) {
        router.replace(fallback);
        return;
      }
    }
  }, [router, pathname, allow, fallback]);

  // KHÔNG render gì để không ảnh hưởng UI
  return null;
}
