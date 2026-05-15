'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/features/booking/store/bookingStore';
import { useBookingsForDate } from '@/features/booking/hooks';
import { useStepGuard } from '@/features/booking/hooks/useStepGuard';

// ── Helpers ───────────────────────────────────────────────────────

function toMins(h: number, m: number) { return h * 60 + m; }
function fromMins(total: number) { return { h: Math.floor(total / 60), m: total % 60 }; }
function pad(n: number) { return String(n).padStart(2, '0'); }
function toHHMM(h: number, m: number) { return `${pad(h)}:${pad(m)}`; }
function parseHHMM(s: string) {
  const [h, m] = s.split(':').map(Number);
  return { h, m };
}
function formatHHMM(t: string) { return t.slice(0, 5); }

function overlaps(aS: number, aE: number, bS: number, bE: number) {
  return aS < bE && bS < aE;
}

const MIN_HOUR = 7, MAX_HOUR = 21;

// ── Custom time wheel ─────────────────────────────────────────────

interface TimeInputProps {
  label: string;
  hours: number;
  minutes: number;
  onChange: (h: number, m: number) => void;
  minHours?: number;
  disabled?: boolean;
}

function TimeInput({ label, hours, minutes, onChange, minHours = MIN_HOUR, disabled }: TimeInputProps) {
  const changeHour = (delta: number) => {
    let h = hours + delta;
    h = Math.max(minHours, Math.min(MAX_HOUR, h));
    onChange(h, minutes);
  };

  const changeMinute = (delta: number) => {
    let total = toMins(hours, minutes) + delta;
    const min = toMins(minHours, 0);
    const max = toMins(MAX_HOUR, 0);
    total = Math.max(min, Math.min(max, total));
    const { h, m } = fromMins(total);
    onChange(h, m);
  };

  return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
        <div className="form-label" style={{ marginBottom: 0 }}>{label}</div>

        {/* HH : MM with +/- buttons only — no outer stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <button className="time-unit-btn" onClick={() => changeHour(1)}
                    disabled={disabled || hours >= MAX_HOUR} type="button">▲</button>
            <div className="time-display-unit">{pad(hours)}</div>
            <button className="time-unit-btn" onClick={() => changeHour(-1)}
                    disabled={disabled || hours <= minHours} type="button">▼</button>
          </div>

          <div className="time-colon">:</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <button className="time-unit-btn" onClick={() => changeMinute(15)}
                    disabled={disabled || toMins(hours, minutes) >= toMins(MAX_HOUR, 0)} type="button">▲</button>
            <div className="time-display-unit">{pad(minutes)}</div>
            <button className="time-unit-btn" onClick={() => changeMinute(-15)}
                    disabled={disabled || toMins(hours, minutes) <= toMins(minHours, 0)} type="button">▼</button>
          </div>
        </div>
      </div>
  );
}

// ── Quick-select chips ─────────────────────────────────────────────

const DURATION_OPTIONS = [
  { label: '30 хв', mins: 30 },
  { label: '1 год', mins: 60 },
  { label: '1.5 год', mins: 90 },
  { label: '2 год', mins: 120 },
];

// ── Component ─────────────────────────────────────────────────────

export function TimePicker() {
  useStepGuard('time');

  const { selectedCar, selectedDate, setStartTime, setEndTime } = useBookingStore();
  const router = useRouter();

  const [startH, setStartH] = useState(8);
  const [startM, setStartM] = useState(0);
  const [endH,   setEndH]   = useState(9);
  const [endM,   setEndM]   = useState(0);
  const [error,  setError]  = useState('');

  const { data: existingBookings = [], isLoading } = useBookingsForDate(
      selectedCar?.model ?? null,
      selectedDate
  );

  const startMins = toMins(startH, startM);
  const endMins   = toMins(endH, endM);
  const durationMins = endMins - startMins;

  const conflictingBooking = existingBookings.find((b) => {
    const { h: bsh, m: bsm } = parseHHMM(b.start_time);
    const { h: beh, m: bem } = parseHHMM(b.end_time);
    return overlaps(startMins, endMins, toMins(bsh, bsm), toMins(beh, bem));
  });

  const handleStartChange = useCallback((h: number, m: number) => {
    setStartH(h); setStartM(m); setError('');
    // push end forward if needed
    const newStart = toMins(h, m);
    if (toMins(endH, endM) <= newStart) {
      const newEnd = Math.min(newStart + 60, toMins(MAX_HOUR, 0));
      const { h: eh, m: em } = fromMins(newEnd);
      setEndH(eh); setEndM(em);
    }
  }, [endH, endM]);

  const handleEndChange = useCallback((h: number, m: number) => {
    setEndH(h); setEndM(m); setError('');
  }, []);

  const applyDuration = (mins: number) => {
    const newEnd = Math.min(startMins + mins, toMins(MAX_HOUR, 0));
    const { h, m } = fromMins(newEnd);
    setEndH(h); setEndM(m); setError('');
  };

  const handleConfirm = () => {
    setError('');
    if (startMins >= endMins) { setError('Час завершення має бути після початку.'); return; }
    if (conflictingBooking)   {
      setError(
          `Перетин з ${formatHHMM(conflictingBooking.start_time)}–${formatHHMM(conflictingBooking.end_time)} ` +
          `(${conflictingBooking.first_name} ${conflictingBooking.last_name}).`
      );
      return;
    }
    setStartTime(toHHMM(startH, startM));
    setEndTime(toHHMM(endH, endM));
    router.push('/book/details');
  };

  const dateLabel = selectedDate
      ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('uk-UA', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
      : '';

  const isValid = startMins < endMins && durationMins >= 30 && durationMins <= 240 && !conflictingBooking;

  return (
      <div>
        {/* Existing bookings */}
        {isLoading ? (
            <div className="loading-banner"><div className="mini-spinner" /> Перевіряємо доступність…</div>
        ) : (
            <div className="booked-info">
              <div className="booked-info-title">📋 {dateLabel} — вже заброньовано:</div>
              {existingBookings.length === 0
                  ? <div className="booked-empty">Вільний день, жодних бронювань 🎉</div>
                  : existingBookings.map(b => (
                      <div key={b.id} className="booked-slot">
                        <span className="booked-time">{formatHHMM(b.start_time)} – {formatHHMM(b.end_time)}</span>
                        <span className="booked-name">{b.first_name} {b.last_name}</span>
                      </div>
                  ))
              }
            </div>
        )}

        {/* Time pickers */}
        <div className="time-picker-row">
          <TimeInput
              label="ЧАС ПОЧАТКУ"
              hours={startH}
              minutes={startM}
              onChange={handleStartChange}
          />

          <div className="time-picker-arrow">→</div>

          <TimeInput
              label="ЧАС ЗАВЕРШЕННЯ"
              hours={endH}
              minutes={endM}
              onChange={handleEndChange}
              minHours={startH}
          />
        </div>

        {/* Duration quick-select */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div className="time-section-label">ШВИДКИЙ ВИБІР ТРИВАЛОСТІ</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {DURATION_OPTIONS.map(opt => (
                <button
                    key={opt.mins}
                    className={`time-chip ${durationMins === opt.mins ? 'selected' : ''}`}
                    onClick={() => applyDuration(opt.mins)}
                    type="button"
                    style={{ flex: 1, minWidth: 'auto' }}
                >
                  {opt.label}
                </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {isValid && (
            <div className="time-summary">
              🕐 <strong>{toHHMM(startH, startM)} – {toHHMM(endH, endM)}</strong>
              {' · '}
              {Math.floor(durationMins / 60) > 0 && `${Math.floor(durationMins / 60)} год. `}
              {durationMins % 60 > 0 && `${durationMins % 60} хв.`}
            </div>
        )}

        {/* Error */}
        {(error || conflictingBooking) && (
            <div className="error-banner">
              {error || `⛔ Перетин: ${formatHHMM(conflictingBooking!.start_time)}–${formatHHMM(conflictingBooking!.end_time)}`}
            </div>
        )}

        {/* Navigation */}
        <div className="nav-btns" style={{ marginTop: '1.25rem' }}>
          <button className="btn-ghost" onClick={() => router.push('/book/date')} type="button">
            ← Назад
          </button>
          <button className="btn-primary" disabled={!isValid} onClick={handleConfirm} type="button">
            Далі →
          </button>
        </div>
      </div>
  );
}