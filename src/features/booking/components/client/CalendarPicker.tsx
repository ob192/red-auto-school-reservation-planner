'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/features/booking/store/bookingStore';
import { useStepGuard } from '@/features/booking/hooks/useStepGuard';

const MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function CalendarPicker() {
  useStepGuard('date');

  const { selectedDate, setDate } = useBookingStore();
  const router = useRouter();

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  const firstDayRaw = new Date(calYear, calMonth, 1).getDay();
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  return (
    <div>
      <div className="calendar-nav">
        <button className="cal-nav-btn" onClick={prevMonth} type="button">‹</button>
        <span className="cal-month">{MONTHS[calMonth]} {calYear}</span>
        <button className="cal-nav-btn" onClick={nextMonth} type="button">›</button>
      </div>

      <div className="cal-grid" role="grid">
        {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} className="cal-day empty" aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const thisDate = new Date(calYear, calMonth, day);
          const dKey = dateKey(thisDate);
          const isPast = thisDate < today;
          const isFuture = thisDate > maxDate;
          const isWeekend = thisDate.getDay() === 0 || thisDate.getDay() === 6;
          const isSel = selectedDate === dKey;
          const isDisabled = isPast || isFuture;

          return (
            <div
              key={dKey}
              className={`cal-day ${isPast ? 'past' : ''} ${isFuture ? 'past' : ''} ${isWeekend && !isPast && !isFuture ? 'weekend' : ''} ${isSel ? 'selected' : ''}`}
              onClick={!isDisabled ? () => setDate(dKey) : undefined}
              role="gridcell"
              aria-pressed={isSel}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) setDate(dKey); }}
            >
              <span className="day-num">{day}</span>
              {isWeekend && !isDisabled && <div className="weekend-dot" aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      <div className="cal-legend">
        <div className="cal-legend-item">
          <div className="ld" style={{ background: 'var(--red)' }} /> Сьогодні
        </div>
        <div className="cal-legend-item">
          <div className="ld" style={{ background: 'var(--gold)' }} /> Вихідний
        </div>
      </div>

      <div className="nav-btns" style={{ marginTop: '1rem' }}>
        <button className="btn-ghost" onClick={() => router.push('/book/car')} type="button">← Назад</button>
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
