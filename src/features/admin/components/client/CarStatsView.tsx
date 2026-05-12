'use client';

import { useState, useMemo } from 'react';
import { useAdminStats, type CarStat, type MonthlyRow } from '@/features/admin/hooks';

// ── Helpers ───────────────────────────────────────────────────────
function fmtMonthLabel(m: string): string {
    const [y, mo] = m.split('-');
    const months = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
        'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
    return `${months[parseInt(mo) - 1]} ${y}`;
}

const CAR_ACCENT: Record<string, string> = {
    'MAZDA':       '#e53e3e',
    'KIA RIO':     '#3182ce',
    'TOYOTA':      '#718096',
    'MINI COOPER': '#d69e2e',
};

// ── Bar chart ─────────────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="stat-bar-track">
            <div
                className="stat-bar-fill"
                style={{ width: `${pct}%`, background: color }}
            />
        </div>
    );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ stat, maxHours }: { stat: CarStat; maxHours: number }) {
    const accent = CAR_ACCENT[stat.car_model] ?? 'var(--red)';
    return (
        <div className="stat-card" style={{ '--card-accent': accent } as React.CSSProperties}>
            <div className="stat-card-top">
                <span className="stat-emoji">{stat.car_emoji}</span>
                <div>
                    <div className="stat-car-name">{stat.car_name}</div>
                    <div className="stat-car-sub" style={{ color: accent }}>{stat.car_color}</div>
                </div>
            </div>
            <div className="stat-numbers">
                <div className="stat-num-block">
                    <div className="stat-num">{stat.total_hours}</div>
                    <div className="stat-num-label">Годин</div>
                </div>
                <div className="stat-num-block">
                    <div className="stat-num">{stat.total_bookings}</div>
                    <div className="stat-num-label">Бронювань</div>
                </div>
                <div className="stat-num-block">
                    <div className="stat-num">
                        {stat.total_bookings > 0
                            ? Math.round((stat.total_hours / stat.total_bookings) * 10) / 10
                            : '—'}
                    </div>
                    <div className="stat-num-label">Год./заїзд</div>
                </div>
            </div>
            <MiniBar value={stat.total_hours} max={maxHours} color={accent} />
        </div>
    );
}

// ── Monthly breakdown table ────────────────────────────────────────
function MonthlyTable({ monthly, stats }: { monthly: MonthlyRow[]; stats: CarStat[] }) {
    // @ts-ignore
    const months = [...new Set(monthly.map((r) => r.month))].sort().reverse();

    if (months.length === 0) return (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-icon" style={{ fontSize: '2rem' }}>📊</div>
            <p>Даних за вказаний період немає</p>
        </div>
    );

    return (
        <div className="stat-monthly-wrap">
            <div className="stat-monthly-scroll">
                <table className="stat-monthly-table">
                    <thead>
                    <tr>
                        <th>Місяць</th>
                        {stats.map((s) => (
                            <th key={s.car_model}>{s.car_name}</th>
                        ))}
                        <th>Всього</th>
                    </tr>
                    </thead>
                    <tbody>
                    {months.map((month) => {
                        const rowTotal = monthly
                            .filter((r) => r.month === month)
                            .reduce((s, r) => s + r.hours, 0);

                        return (
                            <tr key={month}>
                                <td className="stat-month-cell">{fmtMonthLabel(month)}</td>
                                {stats.map((s) => {
                                    const cell = monthly.find(
                                        (r) => r.month === month && r.car_model === s.car_model
                                    );
                                    return (
                                        <td key={s.car_model} className="stat-num-cell">
                                            {cell ? (
                                                <>
                                                    <div>{cell.hours} год.</div>
                                                    <div className="stat-cell-sub">{cell.bookings} бр.</div>
                                                </>
                                            ) : '—'}
                                        </td>
                                    );
                                })}
                                <td className="stat-num-cell stat-total-cell">
                                    {Math.round(rowTotal * 100) / 100} год.
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Top instructors ────────────────────────────────────────────────
function TopInstructors({ instructors }: { instructors: { full_name: string; total_bookings: number; total_hours: number }[] }) {
    if (instructors.length === 0) return null;
    const maxH = Math.max(...instructors.map((i) => i.total_hours));

    return (
        <div>
            <div className="stat-section-title">🏆 Топ інструкторів за годинами</div>
            <div className="top-inst-list">
                {instructors.slice(0, 10).map((inst, idx) => (
                    <div key={inst.full_name} className="top-inst-row">
                        <div className="top-inst-rank">#{idx + 1}</div>
                        <div className="top-inst-info">
                            <div className="top-inst-name">{inst.full_name}</div>
                            <div className="stat-bar-track" style={{ marginTop: '0.3rem' }}>
                                <div
                                    className="stat-bar-fill"
                                    style={{
                                        width: `${maxH > 0 ? (inst.total_hours / maxH) * 100 : 0}%`,
                                        background: 'var(--red)',
                                    }}
                                />
                            </div>
                        </div>
                        <div className="top-inst-stat">
                            <div>{inst.total_hours} год.</div>
                            <div className="stat-cell-sub">{inst.total_bookings} бр.</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────
export function CarStatsView() {
    const [fromDate, setFromDate] = useState('');
    const [toDate,   setToDate]   = useState('');

    const { data, isLoading, error } = useAdminStats(
        fromDate || undefined,
        toDate   || undefined
    );

    const maxHours = useMemo(
        () => Math.max(...(data?.stats.map((s) => s.total_hours) ?? [0])),
        [data]
    );

    const grandTotal = useMemo(
        () => data?.stats.reduce((s, c) => s + c.total_hours, 0) ?? 0,
        [data]
    );

    return (
        <div>
            {/* Filters */}
            <div className="ireport-filters" style={{ marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                    <label className="form-label">З дати</label>
                    <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                    <label className="form-label">По дату</label>
                    <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                {(fromDate || toDate) && (
                    <button
                        className="btn-ghost"
                        style={{ alignSelf: 'flex-end', fontSize: '0.65rem', padding: '0.6rem 0.75rem', minHeight: 'unset' }}
                        onClick={() => { setFromDate(''); setToDate(''); }}
                        type="button"
                    >
                        Скинути
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="loading-banner">
                    <div className="mini-spinner" /> Обчислюємо статистику…
                </div>
            )}

            {error && (
                <div className="error-banner">Помилка: {(error as Error).message}</div>
            )}

            {data && (
                <>
                    {/* Grand total */}
                    <div className="stat-grand-total">
                        Загалом годин навчання: <strong>{Math.round(grandTotal * 100) / 100}</strong>
                    </div>

                    {/* Stat cards */}
                    <div className="stat-cards-grid">
                        {data.stats.map((stat) => (
                            <StatCard key={stat.car_model} stat={stat} maxHours={maxHours} />
                        ))}
                    </div>

                    {/* Monthly table */}
                    <div className="stat-section-title" style={{ marginTop: '1.5rem' }}>
                        📅 Погомісячна статистика
                    </div>
                    <MonthlyTable monthly={data.monthly} stats={data.stats} />

                    {/* Top instructors */}
                    {data.topInstructors.length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <TopInstructors instructors={data.topInstructors} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}