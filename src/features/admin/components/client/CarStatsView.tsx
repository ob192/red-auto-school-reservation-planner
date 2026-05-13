'use client';

import { useState, useMemo } from 'react';
import { useAdminStats, type CarStat, type MonthlyRow } from '@/features/admin/hooks';

// ── Helpers ───────────────────────────────────────────────────────
function fmtMonth(m: string) {
    const [y, mo] = m.split('-');
    const names = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
        'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
    return `${names[parseInt(mo) - 1]} ${y}`;
}

const CAR_ACCENT: Record<string, string> = {
    'MAZDA':       '#e53e3e',
    'KIA RIO':     '#3182ce',
    'TOYOTA':      '#718096',
    'MINI COOPER': '#d69e2e',
};

// ── Mini progress bar ─────────────────────────────────────────────
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
    const w = max > 0 ? Math.max(2, (value / max) * 100) : 0;
    return (
        <div className="stat-bar-track">
            <div className="stat-bar-fill" style={{ width: `${w}%`, background: color }} />
        </div>
    );
}

// ── Per-car stat card ─────────────────────────────────────────────
function StatCard({ stat, maxHours }: { stat: CarStat; maxHours: number }) {
    const accent = CAR_ACCENT[stat.car_model] ?? 'var(--red)';
    const avg = stat.total_bookings > 0
        ? Math.round((stat.total_hours / stat.total_bookings) * 10) / 10 : null;

    return (
        <div className="stat-card" style={{ '--card-accent': accent } as React.CSSProperties}>
            <div className="stat-card-top">
                <span className="stat-emoji">{stat.car_emoji}</span>
                <div style={{ minWidth: 0 }}>
                    <div className="stat-car-name">{stat.car_name}</div>
                    <div className="stat-car-sub" style={{ color: accent }}>{stat.car_color}</div>
                </div>
            </div>

            {/* Three numbers in one row */}
            <div className="stat-numbers">
                <div className="stat-num-block">
                    <div className="stat-num">{stat.total_hours}</div>
                    <div className="stat-num-label">Год.</div>
                </div>
                <div className="stat-num-block">
                    <div className="stat-num">{stat.total_bookings}</div>
                    <div className="stat-num-label">Бр.</div>
                </div>
                <div className="stat-num-block">
                    <div className="stat-num">{avg ?? '—'}</div>
                    <div className="stat-num-label">Г/бр</div>
                </div>
            </div>
            <Bar value={stat.total_hours} max={maxHours} color={accent} />
        </div>
    );
}

// ── Monthly breakdown — card-per-month, bar-per-car ───────────────
// No table → no horizontal scroll → works on any screen width
function MonthlyCards({ monthly, stats }: { monthly: MonthlyRow[]; stats: CarStat[] }) {
    // @ts-ignore
    const months = [...new Set(monthly.map(r => r.month))].sort().reverse();

    if (months.length === 0) return (
        <div className="empty-state" style={{ padding: '1.5rem 0' }}>
            <div className="empty-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <p>Даних за вказаний період немає</p>
        </div>
    );

    return (
        <div className="smc-list">
            {months.map(month => {
                const rowTotal = monthly
                    .filter(r => r.month === month)
                    .reduce((s, r) => s + r.hours, 0);

                const activeCars = stats.filter(s =>
                    monthly.some(r => r.month === month && r.car_model === s.car_model)
                );

                return (
                    <div key={month} className="smc-card">
                        {/* Month header */}
                        <div className="smc-header">
                            <span className="smc-month">{fmtMonth(month)}</span>
                            <span className="smc-total">
                                {Math.round(rowTotal * 100) / 100} год.
                            </span>
                        </div>

                        {/* One row per car that has data */}
                        <div className="smc-rows">
                            {activeCars.map(s => {
                                const cell = monthly.find(
                                    r => r.month === month && r.car_model === s.car_model
                                )!;
                                const accent = CAR_ACCENT[s.car_model] ?? 'var(--red)';
                                const pct    = rowTotal > 0 ? (cell.hours / rowTotal) * 100 : 0;
                                return (
                                    <div key={s.car_model} className="smc-row">
                                        <span className="smc-emoji">{s.car_emoji}</span>
                                        <span className="smc-name">{s.car_name}</span>
                                        <div className="smc-bar-wrap">
                                            <div className="stat-bar-track">
                                                <div className="stat-bar-fill"
                                                     style={{ width: `${Math.max(2, pct)}%`, background: accent }} />
                                            </div>
                                        </div>
                                        <span className="smc-hrs">{cell.hours}г</span>
                                        <span className="smc-bks">{cell.bookings}бр</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Top instructors ───────────────────────────────────────────────
function TopInstructors({ instructors }: {
    instructors: { full_name: string; total_bookings: number; total_hours: number }[]
}) {
    if (!instructors.length) return null;
    const maxH = Math.max(...instructors.map(i => i.total_hours));
    return (
        <div>
            <div className="stat-section-title">🏆 Топ інструкторів</div>
            <div className="top-inst-list">
                {instructors.slice(0, 10).map((inst, idx) => (
                    <div key={inst.full_name} className="top-inst-row">
                        <div className="top-inst-rank">#{idx + 1}</div>
                        <div className="top-inst-info">
                            {/* Name wraps instead of overflowing */}
                            <div className="top-inst-name"
                                 style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {inst.full_name}
                            </div>
                            <div className="stat-bar-track" style={{ marginTop: '0.3rem' }}>
                                <div className="stat-bar-fill"
                                     style={{ width: `${maxH > 0 ? (inst.total_hours / maxH) * 100 : 0}%`, background: 'var(--red)' }} />
                            </div>
                        </div>
                        <div className="top-inst-stat">
                            <div>{inst.total_hours}<span style={{ fontSize: '0.55rem', marginLeft: 2 }}>год</span></div>
                            <div className="stat-cell-sub">{inst.total_bookings} бр.</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────
export function CarStatsView() {
    const [fromDate, setFromDate] = useState('');
    const [toDate,   setToDate]   = useState('');

    const { data, isLoading, error } = useAdminStats(
        fromDate || undefined,
        toDate   || undefined
    );

    const maxHours   = useMemo(() => Math.max(...(data?.stats.map(s => s.total_hours) ?? [0])), [data]);
    const grandTotal = useMemo(() => data?.stats.reduce((s, c) => s + c.total_hours, 0) ?? 0, [data]);

    return (
        <div>
            {/* Date filters */}
            <div className="ireport-filters" style={{ marginBottom: '1.1rem' }}>
                <div style={{ flex: 1 }}>
                    <label className="form-label">З дати</label>
                    <input type="date" className="form-input" value={fromDate}
                           onChange={e => setFromDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                    <label className="form-label">По дату</label>
                    <input type="date" className="form-input" value={toDate}
                           onChange={e => setToDate(e.target.value)} />
                </div>
                {(fromDate || toDate) && (
                    <button className="btn-ghost"
                            style={{ alignSelf: 'flex-end', fontSize: '0.7rem', padding: '0.55rem 0.75rem', minHeight: 'unset' }}
                            onClick={() => { setFromDate(''); setToDate(''); }} type="button">
                        ✕
                    </button>
                )}
            </div>

            {isLoading && <div className="loading-banner"><div className="mini-spinner" /> Обчислюємо…</div>}
            {error     && <div className="error-banner">Помилка: {(error as Error).message}</div>}

            {data && (
                <>
                    <div className="stat-grand-total">
                        Загалом годин навчання: <strong>{Math.round(grandTotal * 100) / 100}</strong>
                    </div>

                    {/* 2-col grid on mobile, 4-col on wide */}
                    <div className="stat-cards-grid">
                        {data.stats.map(stat => (
                            <StatCard key={stat.car_model} stat={stat} maxHours={maxHours} />
                        ))}
                    </div>

                    {data.monthly.length > 0 && (
                        <>
                            <div className="stat-section-title" style={{ marginTop: '1.4rem' }}>
                                📅 Помісячна статистика
                            </div>
                            <MonthlyCards monthly={data.monthly} stats={data.stats} />
                        </>
                    )}

                    {data.topInstructors.length > 0 && (
                        <div style={{ marginTop: '1.4rem' }}>
                            <TopInstructors instructors={data.topInstructors} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}