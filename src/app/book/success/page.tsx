'use client';

import { useRouter } from 'next/navigation';
import { useBookingStore } from '@/features/booking/store/bookingStore';
import Link from 'next/link';

export default function SuccessPage() {
  const router = useRouter();
  const { selectedCar, selectedDate, startTime, endTime, contact, reset } = useBookingStore();

  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('uk-UA', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : '';

  const handleNew = () => {
    reset();
    router.push('/book/car');
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="success-screen">
          <div className="success-icon">✅</div>
          <div className="success-title">Заброньовано!</div>
          <p className="success-msg">
            Ваше бронювання успішно підтверджено. До зустрічі на занятті!
          </p>

          <div className="confirm-details">
            <div className="confirm-row">
              <span className="cr-label">🚗 Автомобіль</span>
              <span className="cr-val">{selectedCar?.name ?? '—'}</span>
            </div>
            <div className="confirm-row">
              <span className="cr-label">📅 Дата</span>
              <span className="cr-val">{dateLabel || '—'}</span>
            </div>
            <div className="confirm-row">
              <span className="cr-label">🕐 Час</span>
              <span className="cr-val">{startTime && endTime ? `${startTime} – ${endTime}` : '—'}</span>
            </div>
            <div className="confirm-row">
              <span className="cr-label">👤 Водій</span>
              <span className="cr-val">{contact.lastName} {contact.firstName}</span>
            </div>
            {contact.phone && (
              <div className="confirm-row">
                <span className="cr-label">📱 Телефон</span>
                <span className="cr-val">{contact.phone}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'stretch' }}>
            <button className="btn-primary" onClick={handleNew} type="button">
              + Нове бронювання
            </button>
            <Link href="/my-bookings" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" type="button" style={{ width: '100%' }}>
                Мої бронювання
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
