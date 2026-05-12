'use client';

import Link from 'next/link';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { MyBookings } from '@/features/booking/components/client/MyBookings';

export default function MyBookingsPage() {
  return (
    <AuthGuard>
      <header className="header">
        <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">🏎️</div>
          <div className="logo-text">
            <div className="brand">RedAutoSchool</div>
            <div className="tagline">Мої бронювання</div>
          </div>
        </Link>
        <UserMenu />
      </header>

      <div className="page-wrap">
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon">📋</div>
            <div>
              <h2>Мої бронювання</h2>
              <p>Майбутні та активні заняття</p>
            </div>
          </div>
          <div className="card-body">
            <MyBookings />
            <div style={{ marginTop: '1.25rem' }}>
              <Link href="/book/car" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" type="button" style={{ width: '100%' }}>
                  + Нове бронювання
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
