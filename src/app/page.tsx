'use client';

import Link from 'next/link';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { useSession } from '@/features/auth/hooks/useSession';

export default function HomePage() {
  const { session, loading } = useSession();

  return (
      <div className="home-hero">
        <header className="header">
          <div className="logo">
            <div className="logo-icon">🏎️</div>
            <div className="logo-text">
              <div className="brand">RedAutoSchool</div>
              <div className="tagline">Онлайн бронювання</div>
            </div>
          </div>

          {!loading && (
              session
                  ? <UserMenu />
                  : (
                      <Link href="/signin" style={{ textDecoration: 'none' }}>
                        <button className="btn-ghost" type="button"
                                style={{ minHeight: 36, padding: '0.4rem 0.9rem', fontSize: '0.62rem' }}>
                          Увійти
                        </button>
                      </Link>
                  )
          )}
        </header>

        <div className="home-content">
          <h1 className="home-title">
            Забронюй авто
            <span className="accent">онлайн.</span>
          </h1>
          <p className="home-sub">
            За 30 секунд. Без черг і дзвінків.
          </p>

          <Link href={session ? '/book/car' : '/signin?next=/book/car'} className="home-cta">
            Забронювати →
          </Link>

          {session && (
              <Link href="/my-bookings" style={{ textDecoration: 'none', marginTop: '0.75rem', alignSelf: 'flex-start' }}>
                <button className="btn-ghost" type="button"
                        style={{ fontSize: '0.65rem', minHeight: 40, padding: '0.5rem 1rem' }}>
                  📋 Мої бронювання
                </button>
              </Link>
          )}
        </div>
      </div>
  );
}