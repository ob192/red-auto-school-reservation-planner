'use client';

import { useState, useMemo } from 'react';
import { useAdminSchedule, type AdminBookingSlot } from '@/features/admin/hooks';

// ── Constants ─────────────────────────────────────────────────────
const DAY_START = 7 * 60;   // 07:00
const DAY_END   = 21 * 60;  // 21:00
const DAY_SPAN  = DAY_END - DAY_START;

const HOUR_LABELS = Array.from({ length: DAY_END / 60 - DAY_START / 60 + 1 }, (_, i) =>
    `${String(DAY_START / 60 + i).padStart(2, '0')}:00`
);

// ── Helpers ───────────────────────────────────────────────────────
function toMins(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function fmt(t: string): string { return t.slice(0, 5); }

function pct(mins: number): number {
    return Math.max(0, Math.min(100, ((mins - DAY_START) / DAY_SPAN) * 100));
}

function dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDateLabel(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

/** Detect overlapping pairs within a list of confirmed bookings */
function findOverlaps(bookings: AdminBookingSlot[]): Set<string> {
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const ids = new Set<string>();
    for (let i = 0; i < confirmed.length; i++) {
        for (let j = i + 1; j < confirmed.length; j++) {
            const aS = toMins(confirmed[i].start_time), aE = toMins(confirmed[i].end_time);
            const bS = toMins(confirmed[j].start_time), bE = toMins(confirmed[j].end_time);
            if (aS < bE && bS < aE) {
                ids.add(confirmed[i].id);
                ids.add(confirmed[j].id);
            }
        }
    }
    return ids;
}

// ── Booking bar ───────────────────────────────────────────────────
function BookingBar({
                        booking,
                        isOverlap,
                    }: {
    booking: AdminBookingSlot;
    isOverlap: boolean;
}) {
    const [tip, setTip] = useState(false);
    const startMins = toMins(booking.start_time);
    const endMins   = toMins(booking.end_time);
    const left      = pct(startMins);
    const width     = pct(endMins) - left;
    const duration  = endMins - startMins;
    const isCancel  = booking.status === 'cancelled';

    return (
        <div
            className={`sched-bar ${isCancel ? 'sched-bar--cancelled' : ''} ${isOverlap ? 'sched-bar--overlap' : ''}`}
            style={{ left: `${left}%`, width: `${Math.max(width, 0.8)}%` }}
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
            role="button"
            tabIndex={0}
            aria-label={`${booking.first_name} ${booking.last_name}: ${fmt(booking.start_time)}–${fmt(booking.end_time)}`}
        >
            {width > 8 && (
                <span className="sched-bar-label">
          {booking.last_name}
                    {width > 14 && ` · ${fmt(booking.start_time)}`}
        </span>
            )}
            {tip && (
                <div className="sched-tooltip">
                    <strong>{booking.first_name} {booking.last_name}</strong>
                    <span>{fmt(booking.start_time)} – {fmt(booking.end_time)}</span>
                    <span>{duration} хв.</span>
                    {booking.phone && <span>📱 {booking.phone}</span>}
                    {isCancel && <span className="sched-tooltip-cancel">Скасовано</span>}
                    {isOverlap && <span className="sched-tooltip-overlap">⚠️ Перетин!</span>}
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────
export function DailySchedule() {
    const today = dateKey(new Date());
    const [date, setDate] = useState(today);

    const { data, isLoading, error } = useAdminSchedule(date);

    const totalConfirmed = useMemo(
        () => data?.cars.reduce((s, c) => s + c.bookings.filter((b) => b.status === 'confirmed').length, 0) ?? 0,
        [data]
    );

    const prevDay = () => {
        const d = new Date(date + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        setDate(dateKey(d));
    };
    const nextDay = () => {
        const d = new Date(date + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        setDate(dateKey(d));
    };

    return (
        <div>
            {/* Date nav */}
            <div className="sched-date-nav">
                <button className="cal-nav-btn" onClick={prevDay} type="button">‹</button>
                <div className="sched-date-center">
                    <div className="sched-date-main">{fmtDateLabel(date)}</div>
                    {date === today && <div className="sched-today-badge">Сьогодні</div>}
                </div>
                <button className="cal-nav-btn" onClick={nextDay} type="button">›</button>
            </div>

            <input
                type="date"
                className="form-input sched-date-input"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
            />

            {/* Summary bar */}
            {!isLoading && data && (
                <div className="sched-summary">
                    <span>📋 Бронювань на день: <strong>{totalConfirmed}</strong></span>
                </div>
            )}

            {isLoading && (
                <div className="loading-banner" style={{ marginTop: '1rem' }}>
                    <div className="mini-spinner" /> Завантажуємо розклад…
                </div>
            )}

            {error && (
                <div className="error-banner">Помилка завантаження: {(error as Error).message}</div>
            )}

            {/* Timeline grid */}
            {data && (
                <div className="sched-wrap">
                    {/* Hour axis */}
                    <div className="sched-axis">
                        <div className="sched-car-label" />
                        <div className="sched-track">
                            {HOUR_LABELS.map((h) => (
                                <div
                                    key={h}
                                    className="sched-hour-tick"
                                    style={{ left: `${pct(toMins(h + ':00') || DAY_START)}%` }}
                                >
                                    {h}
                                </div>
                            ))}
                        </div>
                    </div>

                    {data.cars.map((car) => {
                        const overlapIds = findOverlaps(car.bookings);
                        const confirmedCount = car.bookings.filter((b) => b.status === 'confirmed').length;
                        return (
                            <div key={car.car_model} className="sched-row">
                                <div className="sched-car-label">
                                    <span className="sched-car-emoji">{car.car_emoji}</span>
                                    <span className="sched-car-name">{car.car_name}</span>
                                    <span className="sched-car-count">{confirmedCount}</span>
                                </div>
                                <div className="sched-track">
                                    {/* Hour gridlines */}
                                    {HOUR_LABELS.map((h) => (
                                        <div
                                            key={h}
                                            className="sched-gridline"
                                            style={{ left: `${pct(toMins(h + ':00') || DAY_START)}%` }}
                                        />
                                    ))}

                                    {/* Current time indicator */}
                                    {date === today && (() => {
                                        const now = new Date();
                                        const nowMins = now.getHours() * 60 + now.getMinutes();
                                        if (nowMins >= DAY_START && nowMins <= DAY_END) {
                                            return (
                                                <div
                                                    className="sched-now-line"
                                                    style={{ left: `${pct(nowMins)}%` }}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}

                                    {car.bookings.length === 0 && (
                                        <div className="sched-empty-row">Вільний день</div>
                                    )}

                                    {car.bookings.map((b) => (
                                        <BookingBar
                                            key={b.id}
                                            booking={b}
                                            isOverlap={overlapIds.has(b.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="sched-legend">
                <div className="sched-legend-item">
                    <div className="sched-legend-dot sched-legend-dot--confirmed" /> Підтверджено
                </div>
                <div className="sched-legend-item">
                    <div className="sched-legend-dot sched-legend-dot--cancelled" /> Скасовано
                </div>
                <div className="sched-legend-item">
                    <div className="sched-legend-dot sched-legend-dot--overlap" /> ⚠️ Перетин
                </div>
                <div className="sched-legend-item">
                    <div className="sched-now-dot" /> Зараз
                </div>
            </div>
        </div>
    );
}