'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/features/auth/hooks/useSession';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
    }
  }, [session, loading, router, pathname]);

  if (loading) return (
    <div className="full-page-spinner">
      <div className="spinner" />
    </div>
  );
  if (!session) return null;
  return <>{children}</>;
}
