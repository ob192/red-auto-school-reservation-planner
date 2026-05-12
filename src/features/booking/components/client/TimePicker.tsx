'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/features/booking/store/bookingStore';
import { useBookingsForDate } from '@/features/booking/hooks';
import { useStepGuard } from '@/features/booking/hooks/useStepGuard';

// ── Helpers ───────────────────────────────────────────────────────

function parseTime(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function toMinutes(t: string): number {
  // handles HH:MM or HH:MM:SS from DB
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatHHMM(t: string): string {
  return t.slice(0, 5);
}

function overlaps(
    aStart: number, aEnd: number,
    bStart: number, bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function minutesToDisplay(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Component ─────────────────────────────────────────────────────

export function TimePicker() {
  useStepGuard('time');

  const { selectedCar, selectedDate, setStartTime, setEndTime } = useBookingStore();
  const router = useRouter();

  const [startInput, setStartInput] = useState('');
  const [endInput,   setEndInput]   = useState('');
  const [error,      setError]      = useState('');

  const { data: existingBookings = [], isLoading } = useBookingsForDate(
      selectedCar?.model ?? null,
      selectedDate
  );

  const dateLabel = selectedDate
      ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('uk-UA', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
      : '';

  // Validate and check conflicts on the fly for end time
  const startMins = parseTime(startInput);
  const endMins   = parseTime(endInput);

  const conflictingBooking = (startMins !== null && endMins !== null)
      ? existingBookings.find((b) =>
          overlaps(
              startMins, endMins,
              toMinutes(b.start_time), toMinutes(b.end_time)
          )
      )
      : null;

  const durationMins = (startMins !== null && endMins !== null)
      ? endMins - startMins
      : null;

  const handleConfirm = () => {
    setError('');

    if (!startInput || !endInput) {
      setError('Введіть час початку та завершення.');
      return;
    }
    if (startMins === null) {
      setError('Невірний формат часу початку. Використовуйте ГГ:ХХ (наприклад 09:00).');
      return;
    }
    if (endMins === null) {
      setError('Невірний формат часу завершення. Використовуйте ГГ:ХХ (наприклад 11:30).');
      return;
    }
    if (startMins >= endMins) {
      setError('Час завершення має бути після часу початку.');
      return;
    }
    if (durationMins !== null && durationMins < 30) {
      setError('Мінімальна тривалість — 30 хвилин.');
      return;
    }
    if (durationMins !== null && durationMins > 4 * 60) {
      setError('Максимальна тривалість — 4 години.');
      return;
    }
    if (conflictingBooking) {
      setError(
          `Цей час перетинається з бронюванням ` +
          `${formatHHMM(conflictingBooking.start_time)}–${formatHHMM(conflictingBooking.end_time)} ` +
          `(${conflictingBooking.first_name} ${conflictingBooking.last_name}).`
      );
      return;
    }

    setStartTime(minutesToDisplay(startMins));
    setEndTime(minutesToDisplay(endMins!));
    router.push('/book/details');
  };

  // Visual state for the time inputs
  const startValid = startInput === '' || startMins !== null;
  const endValid   = endInput   === '' || endMins   !== null;
  const hasConflict = !!conflictingBooking;

  return (
      <div>
        {/* ── Loading ─────────────────────────────────────────────── */}
        {isLoading && (
            <div className="loading-banner">
              <div className="mini-spinner" /> Перевіряємо доступність…
            </div>
        )}

        {/* ── Existing bookings ───────────────────────────────────── */}
        {!isLoading && (
            <div className="booked-info">
              <div className="booked-info-title">
                📋 {dateLabel} — вже заброньовано:
              </div>
              {existingBookings.length === 0 ? (
                  <div className="booked-empty">Вільний день, жодних бронювань 🎉</div>
              ) : (
                  existingBookings.map((b) => (
                      <div key={b.id} className="booked-slot">
                <span className="booked-time">
                  {formatHHMM(b.start_time)} – {formatHHMM(b.end_time)}
                </span>
                        <span className="booked-name">
                  {b.first_name} {b.last_name}
                </span>
                      </div>
                  ))
              )}
            </div>
        )}

        {/* ── Time inputs ─────────────────────────────────────────── */}
        <div className="time-inputs-row">
          <div className="time-input-group">
            <label className="form-label" htmlFor="start-time">
              Час початку
            </label>
            <input
                id="start-time"
                className={`form-input time-input ${!startValid ? 'input-error' : ''}`}
                type="text"
                inputMode="numeric"
                placeholder="09:00"
                maxLength={5}
                value={startInput}
                onChange={(e) => {
                  setStartInput(e.target.value);
                  setError('');
                }}
            />
          </div>

          <div className="time-input-sep">–</div>

          <div className="time-input-group">
            <label className="form-label" htmlFor="end-time">
              Час завершення
            </label>
            <input
                id="end-time"
                className={`form-input time-input ${!endValid || hasConflict ? 'input-error' : ''}`}
                type="text"
                inputMode="numeric"
                placeholder="11:30"
                maxLength={5}
                value={endInput}
                onChange={(e) => {
                  setEndInput(e.target.value);
                  setError('');
                }}
            />
          </div>
        </div>

        {/* ── Duration preview ────────────────────────────────────── */}
        {startMins !== null && endMins !== null && endMins > startMins && !hasConflict && (
            <div className="time-summary">
              🕐 Обраний час: <strong>{minutesToDisplay(startMins)} – {minutesToDisplay(endMins)}</strong>
              {' '}· {Math.floor(durationMins! / 60) > 0 && `${Math.floor(durationMins! / 60)} год. `}
              {durationMins! % 60 > 0 && `${durationMins! % 60} хв.`}
            </div>
        )}

        {/* ── Error ───────────────────────────────────────────────── */}
        {error && <div className="error-banner">{error}</div>}

        {/* ── Navigation ──────────────────────────────────────────── */}
        <div className="nav-btns" style={{ marginTop: '1.25rem' }}>
          <button
              className="btn-ghost"
              onClick={() => router.push('/book/date')}
              type="button"
          >
            ← Назад
          </button>
          <button
              className="btn-primary"
              disabled={
                  !startInput || !endInput ||
                  startMins === null || endMins === null ||
                  startMins >= endMins || hasConflict
              }
              onClick={handleConfirm}
              type="button"
          >
            Далі →
          </button>
        </div>
      </div>
  );
}