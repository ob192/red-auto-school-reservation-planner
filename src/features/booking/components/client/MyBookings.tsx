'use client';

import { useSession } from '@/features/auth/hooks/useSession';
import { useMyBookings, useCancelBooking } from '@/features/booking/hooks';

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

function formatTime(t: string) {
  return t.slice(0, 5);
}

export function MyBookings() {

  const { session } = useSession();
  const { data: bookings, isLoading } = useMyBookings();
  const cancel = useCancelBooking();

  if (isLoading) return (
    <div className="my-bookings">
      {[1, 2].map(i => <div key={i} className="booking-card skeleton" aria-hidden="true" />)}
    </div>
  );

  if (!bookings?.length) return (
    <div className="empty-state">
      <div className="empty-icon">🚗</div>
      <p>У вас немає майбутніх бронювань</p>
    </div>
  );

  return (
    <div className="my-bookings">
      {bookings.map(b => (
        <div key={b.id} className={`booking-card ${b.status === 'cancelled' ? 'cancelled' : ''}`}>
          <div className="booking-car-name">{b.car_name}</div>
          <div className="booking-details">
            <span>📅 {formatDate(b.booking_date)}</span>
            <span>🕐 {formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
          </div>
          <div className="booking-user">
            👤 {b.first_name} {b.last_name}
          </div>
          {b.status === 'confirmed' && (
            <button
              className="btn-cancel"
              onClick={() => {
                if (!session?.access_token) return;
                cancel.mutate({ bookingId: b.id, token: session.access_token });
              }}              disabled={cancel.isPending}
              type="button"
            >
              {cancel.isPending ? 'Скасовуємо...' : '✕ Скасувати'}
            </button>
          )}
          {b.status === 'cancelled' && (
            <div className="cancelled-badge">Скасовано</div>
          )}
        </div>
      ))}
    </div>
  );
}
