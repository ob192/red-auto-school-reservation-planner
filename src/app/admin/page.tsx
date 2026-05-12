'use client';

import { AdminDashboard } from '@/features/admin/components/client/AdminDashboard';

export default function AdminPage() {
    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-icon">⚙️</div>
                <div>
                    <h2>Адмін-панель</h2>
                    <p>Розклад · Інструктори · Статистика</p>
                </div>
            </div>
            <div className="card-body">
                <AdminDashboard />
            </div>
        </div>
    );
}