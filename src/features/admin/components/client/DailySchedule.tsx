'use client';

import { useState, useMemo } from 'react';
import { useAdminSchedule, useAdminUpdateBooking, type AdminBookingSlot } from '@/features/admin/hooks';

// ── Constants ─────────────────────────────────────────────────────
const DAY_START = 7 * 60;
const DAY_END   = 21 * 60;
const DAY_SPAN  = DAY_END - DAY_START;

const HOUR_LABELS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) =>
    `${String(DAY_START / 60 + i).padStart(2, '0')}:00`
);

// ── Helpers ───────────────────────────────────────────────────────
function toMins(t: string) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}
function fmt(t: string) { return t.slice(0, 5); }
function pct(mins: number) {
    return Math.max(0, Math.min(100, ((mins - DAY_START) / DAY_SPAN) * 100));
}
function dateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDateLabel(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}
function findOverlaps(bookings: AdminBookingSlot[]): Set<string> {
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const ids = new Set<string>();
    for (let i = 0; i < confirmed.length; i++) {
        for (let j = i + 1; j < confirmed.length; j++) {
            const aS = toMins(confirmed[i].start_time), aE = toMins(confirmed[i].end_time);
            const bS = toMins(confirmed[j].start_time), bE = toMins(confirmed[j].end_time);
            if (aS < bE && bS < aE) { ids.add(confirmed[i].id); ids.add(confirmed[j].id); }
        }
    }
    return ids;
}

// ── Booking action menu ───────────────────────────────────────────
function BookingActions({
                            booking,
                            onClose,
                        }: {
    booking: AdminBookingSlot;
    onClose: () => void;
}) {
    const update = useAdminUpdateBooking();
    const isCancel = booking.status === 'cancelled';

    const handleToggle = async () => {
        await update.mutateAsync({
            id: booking.id,
            status: isCancel ? 'confirmed' : 'cancelled',
        });
        onClose();
    };

    return (
        <div className="sched-action-menu">
            <div className="sched-action-header">
                <strong>{booking.first_name} {booking.last_name}</strong>
                <button className="sched-action-close" onClick={onClose} type="button">✕</button>
            </div>
            <div className="sched-action-meta">
                <span>🕐 {fmt(booking.start_time)} – {fmt(booking.end_time)}</span>
                {booking.phone && <span>📱 {booking.phone}</span>}
            </div>
            <button
                className={`sched-action-btn ${isCancel ? 'sched-action-btn--restore' : 'sched-action-btn--cancel'}`}
                onClick={handleToggle}
                disabled={update.isPending}
                type="button"
            >
                {update.isPending
                    ? '⏳ Зберігаємо...'
                    : isCancel
                        ? '✅ Відновити бронювання'
                        : '✕ Скасувати бронювання'}
            </button>
        </div>
    );
}

// ── Gantt bar (desktop) ───────────────────────────────────────────
function GanttBar({
                      booking,
                      isOverlap,
                      onSelect,
                  }: {
    booking: AdminBookingSlot;
    isOverlap: boolean;
    onSelect: (b: AdminBookingSlot) => void;
}) {
    const [tip, setTip] = useState(false);
    const startMins = toMins(booking.start_time);
    const endMins   = toMins(booking.end_time);
    const left      = pct(startMins);
    const width     = pct(endMins) - left;
    const isCancel  = booking.status === 'cancelled';

    return (
        <div
            className={`sched-bar ${isCancel ? 'sched-bar--cancelled' : ''} ${isOverlap ? 'sched-bar--overlap' : ''}`}
            style={{ left: `${left}%`, width: `${Math.max(width, 0.8)}%` }}
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
            onClick={() => onSelect(booking)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(booking); }}
            aria-label={`${booking.first_name} ${booking.last_name}: ${fmt(booking.start_time)}–${fmt(booking.end_time)}`}
        >
            {width > 8 && (
                <span className="sched-bar-label">
                    {booking.last_name}{width > 14 && ` · ${fmt(booking.start_time)}`}
                </span>
            )}
            {tip && (
                <div className="sched-tooltip">
                    <strong>{booking.first_name} {booking.last_name}</strong>
                    <span>{fmt(booking.start_time)} – {fmt(booking.end_time)}</span>
                    <span>{toMins(booking.end_time) - toMins(booking.start_time)} хв.</span>
                    {booking.phone && <span>📱 {booking.phone}</span>}
                    {isCancel  && <span className="sched-tooltip-cancel">Скасовано</span>}
                    {isOverlap && <span className="sched-tooltip-overlap">⚠️ Перетин!</span>}
                    <span className="sched-tooltip-hint">Натисніть для дій</span>
                </div>
            )}
        </div>
    );
}

// ── Mobile booking card ───────────────────────────────────────────
function MobileBookingCard({
                               booking,
                               isOverlap,
                               onSelect,
                           }: {
    booking: AdminBookingSlot;
    isOverlap: boolean;
    onSelect: (b: AdminBookingSlot) => void;
}) {
    const isCancel = booking.status === 'cancelled';
    const dur = toMins(booking.end_time) - toMins(booking.start_time);

    return (
        <button
            className={`sched-card ${isCancel ? 'sched-card--cancelled' : ''} ${isOverlap ? 'sched-card--overlap' : ''}`}
            onClick={() => onSelect(booking)}
            type="button"
        >
            <div className="sched-card-time">
                {fmt(booking.start_time)} – {fmt(booking.end_time)}
                <span className="sched-card-dur">{Math.floor(dur / 60) > 0 ? `${Math.floor(dur / 60)}г ` : ''}{dur % 60 > 0 ? `${dur % 60}хв` : ''}</span>
            </div>
            <div className="sched-card-name">{booking.last_name} {booking.first_name}</div>
            {booking.phone && <div className="sched-card-phone">📱 {booking.phone}</div>}
            <div className="sched-card-badges">
                {isCancel  && <span className="sched-badge sched-badge--cancelled">Скасовано</span>}
                {isOverlap && <span className="sched-badge sched-badge--overlap">⚠️ Перетин</span>}
                {!isCancel && !isOverlap && <span className="sched-badge sched-badge--ok">✓ Підтверджено</span>}
            </div>
        </button>
    );
}

// ── Main component ────────────────────────────────────────────────
export function DailySchedule() {
    const today = dateKey(new Date());
    const [date, setDate] = useState(today);
    const [activeBooking, setActiveBooking] = useState<AdminBookingSlot | null>(null);

    const { data, isLoading, error } = useAdminSchedule(date);

    const totalConfirmed = useMemo(
        () => data?.cars.reduce((s, c) => s + c.bookings.filter((b) => b.status === 'confirmed').length, 0) ?? 0,
        [data]
    );

    const prevDay = () => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() - 1); setDate(dateKey(d)); };
    const nextDay = () => { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + 1); setDate(dateKey(d)); };

    return (
        <div>
            {/* Date navigation */}
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

            {!isLoading && data && (
                <div className="sched-summary">
                    📋 Підтверджених бронювань: <strong>{totalConfirmed}</strong>
                    {' · '}
                    {data.cars.reduce((s, c) => s + c.bookings.length, 0)} загалом
                </div>
            )}

            {isLoading && (
                <div className="loading-banner">
                    <div className="mini-spinner" /> Завантажуємо розклад…
                </div>
            )}
            {error && (
                <div className="error-banner">Помилка: {(error as Error).message}</div>
            )}

            {/* Action menu (shared mobile + desktop) */}
            {activeBooking && (
                <BookingActions
                    booking={activeBooking}
                    onClose={() => setActiveBooking(null)}
                />
            )}

            {data && (
                <>
                    {/* ── MOBILE: card layout ─────────────────────── */}
                    <div className="sched-mobile-view">
                        {data.cars.map((car) => {
                            const overlapIds = findOverlaps(car.bookings);
                            const confirmed  = car.bookings.filter((b) => b.status === 'confirmed').length;
                            return (
                                <div key={car.car_model} className="sched-mobile-section">
                                    <div className="sched-mobile-section-header">
                                        <span>{car.car_emoji} {car.car_name}</span>
                                        <span className="sched-car-count">{confirmed}</span>
                                    </div>
                                    {car.bookings.length === 0 ? (
                                        <div className="sched-empty-card">Вільний день 🎉</div>
                                    ) : (
                                        [...car.bookings]
                                            .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                            .map((b) => (
                                                <MobileBookingCard
                                                    key={b.id}
                                                    booking={b}
                                                    isOverlap={overlapIds.has(b.id)}
                                                    onSelect={setActiveBooking}
                                                />
                                            ))
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── DESKTOP: Gantt timeline ─────────────────── */}
                    <div className="sched-desktop-view">
                        <div className="sched-wrap">
                            {/* Hour axis */}
                            <div className="sched-axis">
                                <div className="sched-car-label" />
                                <div className="sched-track">
                                    {HOUR_LABELS.map((h) => (
                                        <div
                                            key={h}
                                            className="sched-hour-tick"
                                            style={{ left: `${pct(toMins(h) || DAY_START)}%` }}
                                        >
                                            {h}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {data.cars.map((car) => {
                                const overlapIds = findOverlaps(car.bookings);
                                const confirmed  = car.bookings.filter((b) => b.status === 'confirmed').length;
                                return (
                                    <div key={car.car_model} className="sched-row">
                                        <div className="sched-car-label">
                                            <span className="sched-car-emoji">{car.car_emoji}</span>
                                            <span className="sched-car-name">{car.car_name}</span>
                                            <span className="sched-car-count">{confirmed}</span>
                                        </div>
                                        <div className="sched-track">
                                            {HOUR_LABELS.map((h) => (
                                                <div
                                                    key={h}
                                                    className="sched-gridline"
                                                    style={{ left: `${pct(toMins(h) || DAY_START)}%` }}
                                                />
                                            ))}
                                            {date === today && (() => {
                                                const now = new Date();
                                                const nowMins = now.getHours() * 60 + now.getMinutes();
                                                if (nowMins >= DAY_START && nowMins <= DAY_END) {
                                                    return <div className="sched-now-line" style={{ left: `${pct(nowMins)}%` }} />;
                                                }
                                                return null;
                                            })()}
                                            {car.bookings.length === 0 && <div className="sched-empty-row">Вільний день</div>}
                                            {car.bookings.map((b) => (
                                                <GanttBar
                                                    key={b.id}
                                                    booking={b}
                                                    isOverlap={overlapIds.has(b.id)}
                                                    onSelect={setActiveBooking}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
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