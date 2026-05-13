'use client';

import { useState } from 'react';
import {
    useInstructorList,
    useInstructorSchedule,
    type InstructorCarSummary,
    type InstructorBookingDetail,
} from '@/features/admin/hooks';

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('uk-UA', {
        weekday: 'short', day: 'numeric', month: 'short',
    });
}
function fmtTime(t: string) { return t.slice(0, 5); }
function fmtMonth(m: string) {
    const [y, mo] = m.split('-');
    const names = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
        'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
    return `${names[parseInt(mo) - 1]} ${y}`;
}

// ── Single booking — always a card, no table ─────────────────────
function BookingCard({ b }: { b: InstructorBookingDetail }) {
    const cancelled = b.status === 'cancelled';
    return (
        <div className={`ireport-bcard ${cancelled ? 'ireport-bcard--cancelled' : ''}`}>
            <div className="ireport-bcard-left">
                <div className="ireport-bcard-date">{fmtDate(b.booking_date)}</div>
                <div className="ireport-bcard-time">
                    {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                </div>
            </div>
            <div className="ireport-bcard-right">
                <div className="ireport-bcard-dur">{b.duration_hours} год.</div>
                <span className={`ibadge ${cancelled ? 'ibadge--cancel' : 'ibadge--ok'}`}>
                    {cancelled ? '✕' : '✓'}
                </span>
            </div>
        </div>
    );
}

// ── Month accordion ───────────────────────────────────────────────
function MonthBlock({ month }: { month: InstructorCarSummary['months'][number] }) {
    const [open, setOpen] = useState(true);
    const confirmed = month.bookings.filter(b => b.status === 'confirmed').length;
    return (
        <div className="ireport-month">
            <button className="ireport-month-header" onClick={() => setOpen(v => !v)} type="button">
                <span className="ireport-month-label">{fmtMonth(month.month)}</span>
                <div className="ireport-month-right">
          <span className="ireport-month-meta">
            {confirmed} бр. · <span style={{ color: 'var(--green)' }}>{month.total_hours} год.</span>
              {month.cancelled_hours > 0 && (
                  <span style={{ color: 'var(--subtle)', marginLeft: '0.35rem' }}>
                ({month.cancelled_hours} скас.)
              </span>
              )}
          </span>
                    <span className="chevron">{open ? '▲' : '▼'}</span>
                </div>
            </button>
            {open && (
                <div className="ireport-month-body">
                    {month.bookings.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
            )}
        </div>
    );
}

// ── Car accordion ─────────────────────────────────────────────────
function CarBlock({ car }: { car: InstructorCarSummary }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="icar-block">
            <button className="icar-header" onClick={() => setOpen(v => !v)} type="button">
        <span className="icar-title">
          <span>{car.car_name}</span>
          <span className="icar-hours" style={{ color: 'var(--green)', background: 'rgba(72,187,120,0.1)' }}>
            {car.total_hours} год.
          </span>
            {car.cancelled_hours > 0 && (
                <span className="icar-hours" style={{ color: 'var(--subtle)', background: 'var(--surface)' }}>
              {car.cancelled_hours} скас.
            </span>
            )}
        </span>
                <span className="chevron">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="icar-body" style={{ padding: '0.5rem 0.75rem 0.75rem' }}>
                    {car.months.map(m => <MonthBlock key={m.month} month={m} />)}
                </div>
            )}
        </div>
    );
}

// ── Shared report section ─────────────────────────────────────────
function ReportPanel({
                         selected, fromDate, toDate, onFromChange, onToChange,
                     }: {
    selected: string;
    fromDate: string; toDate: string;
    onFromChange: (v: string) => void;
    onToChange:   (v: string) => void;
}) {
    const { data: schedule, isLoading, error } = useInstructorSchedule(
        selected, fromDate || undefined, toDate || undefined
    );

    return (
        <>
            <div className="ireport-filters">
                <div style={{ flex: 1 }}>
                    <label className="form-label">З дати</label>
                    <input type="date" className="form-input" value={fromDate}
                           onChange={e => onFromChange(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                    <label className="form-label">По дату</label>
                    <input type="date" className="form-input" value={toDate}
                           onChange={e => onToChange(e.target.value)} />
                </div>
                {(fromDate || toDate) && (
                    <button className="btn-ghost"
                            style={{ alignSelf: 'flex-end', fontSize: '0.65rem', padding: '0.55rem 0.7rem', minHeight: 'unset' }}
                            onClick={() => { onFromChange(''); onToChange(''); }} type="button">
                        ✕
                    </button>
                )}
            </div>

            {isLoading && <div className="loading-banner"><div className="mini-spinner" /> Завантажуємо…</div>}

            {error && (
                <div className="error-banner">
                    {(error as Error).message === 'INSTRUCTOR_NOT_FOUND'
                        ? 'Бронювань у цьому діапазоні не знайдено.'
                        : `Помилка: ${(error as Error).message}`}
                </div>
            )}

            {schedule && (
                <>
                    <div className="ireport-heading">
                        <div className="ireport-name">{schedule.instructor}</div>
                        <div className="ireport-grand">
        <span style={{ color: 'var(--green)', fontFamily: 'var(--font-head)', fontWeight: 700 }}>
          {schedule.grand_total_hours} год.
        </span>
                            {schedule.grand_cancelled_hours > 0 && (
                                <span style={{ color: 'var(--subtle)', fontSize: '0.68rem', marginLeft: '0.5rem' }}>
            · {schedule.grand_cancelled_hours} год. скасовано
          </span>
                            )}
                        </div>
                    </div>

                    <div className="icar-chips">
                        {schedule.cars.map(c => (
                            <div key={c.car_model} className="icar-chip">
                                <span>{c.car_name}</span>
                                <strong style={{ color: 'var(--green)' }}>{c.total_hours} год.</strong>
                                {c.cancelled_hours > 0 && (
                                    <span style={{ color: 'var(--subtle)', fontSize: '0.6rem' }}>
              / {c.cancelled_hours} скас.
            </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {schedule.cars.map(car => <CarBlock key={car.car_model} car={car} />)}
                </>
            )}
        </>
    );
}

// ── Main ──────────────────────────────────────────────────────────
export function InstructorReports() {
    const { data: instructors = [], isLoading: loadingList } = useInstructorList();

    const [selected, setSelected] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate,   setToDate]   = useState('');
    const [search,   setSearch]   = useState('');

    const filtered = instructors.filter(n =>
        n.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* ── MOBILE: dropdown ────────────────────────── */}
            <div className="ireport-mobile-selector">
                {loadingList
                    ? <div className="loading-banner"><div className="mini-spinner" /> Завантаження…</div>
                    : (
                        <div className="form-group">
                            <label className="form-label">Інструктор</label>
                            <select className="form-input"
                                    value={selected ?? ''}
                                    onChange={e => setSelected(e.target.value || null)}>
                                <option value="">— Оберіть інструктора —</option>
                                {instructors.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    )
                }
            </div>

            {/* ── DESKTOP: sidebar + report ────────────────── */}
            <div className="ireport-desktop-layout">
                <div className="ireport-sidebar">
                    <div className="form-group">
                        <input className="form-input" placeholder="🔍 Пошук..."
                               value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    {loadingList && <div className="loading-banner"><div className="mini-spinner" /> …</div>}
                    <div className="ilist">
                        {filtered.length === 0 && !loadingList && (
                            <div style={{ padding: '1rem', fontSize: '0.72rem', color: 'var(--muted)' }}>
                                Не знайдено
                            </div>
                        )}
                        {filtered.map(name => (
                            <button key={name}
                                    className={`ilist-item ${selected === name ? 'ilist-item--active' : ''}`}
                                    onClick={() => setSelected(name)} type="button">
                                <span className="ilist-avatar">{name[0]}</span>
                                <span className="ilist-name">{name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="ireport-main-desktop">
                    {!selected
                        ? <div className="empty-state"><div className="empty-icon">👨‍🏫</div><p>Оберіть інструктора</p></div>
                        : <ReportPanel selected={selected} fromDate={fromDate} toDate={toDate}
                                       onFromChange={setFromDate} onToChange={setToDate} />
                    }
                </div>
            </div>

            {/* ── MOBILE: report below selector ────────────── */}
            <div className="ireport-mobile-report">
                {selected
                    ? <ReportPanel selected={selected} fromDate={fromDate} toDate={toDate}
                                   onFromChange={setFromDate} onToChange={setToDate} />
                    : <div className="empty-state" style={{ paddingTop: '1.5rem' }}>
                        <div className="empty-icon">👨‍🏫</div>
                        <p>Оберіть інструктора вище</p>
                    </div>
                }
            </div>
        </div>
    );
}