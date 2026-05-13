'use client';

import { useState } from 'react';
import { DailySchedule }     from '@/features/admin/components/client/DailySchedule';
import { InstructorReports } from '@/features/admin/components/client/InstructorReports';
import { CarStatsView }      from '@/features/admin/components/client/CarStatsView';

type Tab = 'schedule' | 'instructors' | 'stats';

const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'schedule',    icon: '📅', label: 'Розклад'      },
    { id: 'instructors', icon: '👨‍🏫', label: 'Інструктори' },
    { id: 'stats',       icon: '📊', label: 'Статистика'   },
];

export function AdminDashboard() {
    const [tab, setTab] = useState<Tab>('schedule');

    return (
        <div>
            {/*
              Outer wrapper scrolls horizontally on narrow phones.
              Inner div uses nowrap so tabs stay on one line.
              scrollbar-width:none hides the ugly scrollbar on Android Chrome.
            */}
            <div className="admin-tabs-scroller">
                <div className="admin-tabs">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            className={`admin-tab ${tab === t.id ? 'admin-tab--active' : ''}`}
                            onClick={() => setTab(t.id)}
                            type="button"
                        >
                            <span aria-hidden="true">{t.icon}</span>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="admin-tab-content">
                {tab === 'schedule'    && <DailySchedule />}
                {tab === 'instructors' && <InstructorReports />}
                {tab === 'stats'       && <CarStatsView />}
            </div>
        </div>
    );
}