'use client';

import { useState } from 'react';
import { useInstructorList, useInstructorSchedule, type InstructorCarSummary } from '@/features/admin/hooks';

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', {
        weekday: 'short', day: 'numeric', month: 'short',
    });
}

function fmtTime(t: string): string { return t.slice(0, 5); }

function fmtMonthLabel(m: string): string {
    const [y, mo] = m.split('-');
    const months = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
        'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
    return `${months[parseInt(mo) - 1]} ${y}`;
}

// ── Car breakdown panel ───────────────────────────────────────────
function CarBreakdown({ car }: { car: InstructorCarSummary }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="icar-block">
            <button
                className="icar-header"
                onClick={() => setOpen((v) => !v)}
                type="button"
            >
        <span className="icar-title">
          <span>{car.car_name}</span>
          <span className="icar-hours">{car.total_hours} год.</span>
        </span>
                <span className="chevron">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className="icar-body">
                    {car.months.map((month) => (
                        <div key={month.month} className="imonth-block">
                            <div className="imonth-label">
                                {fmtMonthLabel(month.month)}
                                <span className="imonth-hours">{month.total_hours} год.</span>
                            </div>
                            <table className="ibooking-table">
                                <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Час</th>
                                    <th>Тривалість</th>
                                    <th>Статус</th>
                                </tr>
                                </thead>
                                <tbody>
                                {month.bookings.map((b) => (
                                    <tr key={b.id} className={b.status === 'cancelled' ? 'irow-cancelled' : ''}>
                                        <td>{fmtDate(b.booking_date)}</td>
                                        <td className="irow-time">{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</td>
                                        <td>{b.duration_hours} год.</td>
                                        <td>
                                            {b.status === 'confirmed'
                                                ? <span className="ibadge ibadge--ok">✓</span>
                                                : <span className="ibadge ibadge--cancel">✕</span>}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────
export function InstructorReports() {
    const { data: instructors = [], isLoading: loadingList } = useInstructorList();

    const [selected, setSelected] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate,   setToDate]   = useState('');
    const [search,   setSearch]   = useState('');

    const { data: schedule, isLoading: loadingSchedule, error } = useInstructorSchedule(
        selected,
        fromDate || undefined,
        toDate   || undefined
    );

    const filtered = instructors.filter((n) =>
        n.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="ireport-wrap">
            {/* Instructor list */}
            <div className="ireport-sidebar">
                <div className="form-group">
                    <input
                        className="form-input"
                        placeholder="🔍 Пошук інструктора..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loadingList && (
                    <div className="loading-banner">
                        <div className="mini-spinner" /> Завантаження…
                    </div>
                )}

                <div className="ilist">
                    {filtered.length === 0 && !loadingList && (
                        <div className="empty-state" style={{ padding: '1.5rem 0.5rem' }}>
                            <div style={{ fontSize: '0.75rem' }}>Інструкторів не знайдено</div>
                        </div>
                    )}
                    {filtered.map((name) => (
                        <button
                            key={name}
                            className={`ilist-item ${selected === name ? 'ilist-item--active' : ''}`}
                            onClick={() => setSelected(name)}
                            type="button"
                        >
                            <span className="ilist-avatar">{name[0]}</span>
                            <span className="ilist-name">{name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Report panel */}
            <div className="ireport-main">
                {!selected && (
                    <div className="empty-state">
                        <div className="empty-icon">👨‍🏫</div>
                        <p>Оберіть інструктора зі списку</p>
                    </div>
                )}

                {selected && (
                    <>
                        {/* Date range filter */}
                        <div className="ireport-filters">
                            <div style={{ flex: 1 }}>
                                <label className="form-label">З дати</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">По дату</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
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

                        {loadingSchedule && (
                            <div className="loading-banner">
                                <div className="mini-spinner" /> Завантажуємо дані…
                            </div>
                        )}

                        {error && (
                            <div className="error-banner">
                                {(error as Error).message === 'INSTRUCTOR_NOT_FOUND'
                                    ? 'Для цього інструктора немає бронювань у вказаному діапазоні.'
                                    : `Помилка: ${(error as Error).message}`}
                            </div>
                        )}

                        {schedule && (
                            <div>
                                {/* Header */}
                                <div className="ireport-heading">
                                    <div className="ireport-name">{schedule.instructor}</div>
                                    <div className="ireport-grand">
                                        Всього: <strong>{schedule.grand_total_hours} год.</strong>
                                    </div>
                                </div>

                                {/* Car summary chips */}
                                <div className="icar-chips">
                                    {schedule.cars.map((c) => (
                                        <div key={c.car_model} className="icar-chip">
                                            <span>{c.car_name}</span>
                                            <strong>{c.total_hours} год.</strong>
                                        </div>
                                    ))}
                                </div>

                                {/* Per-car detailed breakdown */}
                                {schedule.cars.map((car) => (
                                    <CarBreakdown key={car.car_model} car={car} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}