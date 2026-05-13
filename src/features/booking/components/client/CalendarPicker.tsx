'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/features/booking/store/bookingStore';
import { useMonthlyBookingCounts } from '@/features/booking/hooks';
import { useStepGuard } from '@/features/booking/hooks/useStepGuard';

const MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
  'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const DAYS   = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Returns badge metadata based on total booked hours
function countMeta(h: number): { cls: string; label: string } {
  if (h === 0)  return { cls: '',             label: '' };
  if (h < 2)    return { cls: 'cal-cnt--low',  label: `${h}г` };
  if (h < 4)    return { cls: 'cal-cnt--mid',  label: `${h}г` };
  return              { cls: 'cal-cnt--high', label: `${h}г` };
}

export function CalendarPicker() {
  useStepGuard('date');

  const { selectedCar, selectedDate, setDate } = useBookingStore();
  const router = useRouter();

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 30);

  // Fetch confirmed booking counts for this car in the viewed month
  const { data: counts = {} } = useMonthlyBookingCounts(
      selectedCar?.model ?? null,
      calYear,
      calMonth
  );

  const firstDayRaw  = new Date(calYear, calMonth, 1).getDay();
  const firstDay     = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); }
    else setCalMonth(m => m-1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); }
    else setCalMonth(m => m+1);
  };

  return (
      <div>
        {/* Month navigation */}
        <div className="calendar-nav">
          <button className="cal-nav-btn" onClick={prevMonth} type="button">‹</button>
          <span className="cal-month">{MONTHS[calMonth]} {calYear}</span>
          <button className="cal-nav-btn" onClick={nextMonth} type="button">›</button>
        </div>

        {/* Day-of-week headers */}
        <div className="cal-grid" role="grid">
          {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}

          {/* Leading empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="cal-day empty" aria-hidden="true" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day      = i + 1;
            const thisDate = new Date(calYear, calMonth, day);
            const dKey     = dateKey(thisDate);
            const isPast   = thisDate < today;
            const isFuture = thisDate > maxDate;
            const isWeekend= thisDate.getDay() === 0 || thisDate.getDay() === 6;
            const isSel    = selectedDate === dKey;
            const disabled = isPast || isFuture;

            const n   = counts[dKey] ?? 0;
            const { cls: cntCls, label: cntLabel } = countMeta(n);

            return (
                <div
                    key={dKey}
                    className={[
                      'cal-day',
                      isPast   ? 'past'    : '',
                      isFuture ? 'past'    : '',
                      isWeekend && !disabled ? 'weekend' : '',
                      isSel    ? 'selected' : '',
                    ].join(' ').trim()}
                    onClick={!disabled ? () => setDate(dKey) : undefined}
                    role="gridcell"
                    aria-pressed={isSel}
                    aria-disabled={disabled}
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={e => { if ((e.key==='Enter'||e.key===' ') && !disabled) setDate(dKey); }}
                >
                  <span className="day-num">{day}</span>

                  {/* Weekend dot (only when not selected — count badge takes its place) */}
                  {isWeekend && !disabled && n === 0 && (
                      <div className="weekend-dot" aria-hidden="true" />
                  )}

                  {/* Booking-count badge — hidden on disabled days */}
                  {!disabled && n > 0 && (
                      <span className={`cal-cnt ${cntCls}`} aria-label={`${n} годин заброньовано`}>
        {cntLabel}
    </span>
                  )}
                </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="cal-legend">
          <div className="cal-legend-item">
            <div className="ld" style={{ background: 'var(--red)' }} /> Обраний день
          </div>
          <div className="cal-legend-item">
            <div className="ld" style={{ background: 'var(--gold)' }} /> Вихідний
          </div>
          <div className="cal-legend-item">
            <div className="ld cal-cnt--low" style={{ borderRadius: 3 }} /> до 2 год.
          </div>
          <div className="cal-legend-item">
            <div className="ld cal-cnt--mid" style={{ borderRadius: 3 }} /> 2–4 год.
          </div>
          <div className="cal-legend-item">
            <div className="ld cal-cnt--high" style={{ borderRadius: 3 }} /> 4+ год.
          </div>
        </div>

        <div className="nav-btns" style={{ marginTop: '1rem' }}>
          <button className="btn-ghost" onClick={() => router.push('/book/car')} type="button">
            ← Назад
          </button>
          <button
              className="btn-primary"
              disabled={!selectedDate}
              onClick={() => router.push('/book/time')}
              type="button"
          >
            Далі →
          </button>
        </div>
      </div>
  );
}