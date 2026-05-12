'use client';

import { TimePicker } from '@/features/booking/components/client/TimePicker';
import { useBookingStore } from '@/features/booking/store/bookingStore';

export default function TimePage() {
  const { selectedCar, selectedDate } = useBookingStore();

  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'long'
      })
    : '';

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-icon">🕐</div>
        <div>
          <h2>Оберіть час</h2>
          <p>{selectedCar?.name}{dateLabel ? ` · ${dateLabel}` : ''}</p>
        </div>
      </div>
      <div className="card-body">
        <TimePicker />
      </div>
    </div>
  );
}
