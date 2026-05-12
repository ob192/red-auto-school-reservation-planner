'use client';

import Link from 'next/link';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { UserMenu } from '@/features/auth/components/UserMenu';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <header className="header">
                <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
                    <div className="logo-icon">🏎️</div>
                    <div className="logo-text">
                        <div className="brand">RedAutoSchool</div>
                        <div className="tagline">Адмін-панель</div>
                    </div>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Link href="/my-bookings" style={{ textDecoration: 'none' }}>
                        <button
                            className="btn-ghost"
                            type="button"
                            style={{ minHeight: 36, padding: '0.4rem 0.85rem', fontSize: '0.62rem' }}
                        >
                            📋 Мої бронювання
                        </button>
                    </Link>
                    <UserMenu />
                </div>
            </header>

            <div className="page-wrap" style={{ maxWidth: 900 }}>
                {children}
            </div>
        </AuthGuard>
    );
}