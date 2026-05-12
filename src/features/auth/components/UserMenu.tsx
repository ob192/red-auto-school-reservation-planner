'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/features/auth/hooks/useSession';
import { supabase } from '@/features/auth/lib/supabase';

export function UserMenu() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const displayName =
      user.user_metadata?.full_name ??
      user.email?.split('@')[0] ??
      'Водій';

  const initials = displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const avatarUrl = user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    setOpen(false);
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
      <div className="user-menu-wrap" ref={ref}>
        <button
            className="user-menu-trigger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            type="button"
        >
          <div className="user-avatar">
            {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
            ) : initials}
          </div>
          <span className="user-name">{displayName.split(' ')[0]}</span>
          <span className="chevron">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
            <div className="user-menu-dropdown">
              <div className="user-menu-info">
                <div className="user-menu-name">{displayName}</div>
                <div className="user-menu-email">{user.email}</div>
              </div>

              <Link
                  href="/my-bookings"
                  className="user-menu-link"
                  onClick={() => setOpen(false)}
              >
                📋 Мої бронювання
              </Link>

              <Link
                  href="/admin"
                  className="user-menu-link"
                  onClick={() => setOpen(false)}
              >
                ⚙️ Адмін-панель
              </Link>

              <div className="user-menu-divider" />

              <button className="user-menu-btn" onClick={handleSignOut} type="button">
                🚪 Вийти
              </button>
            </div>
        )}
      </div>
  );
}