'use client';

import { CalendarPicker } from '@/features/booking/components/client/CalendarPicker';
import { useBookingStore } from '@/features/booking/store/bookingStore';

export default function DatePage() {
  const { selectedCar } = useBookingStore();

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-icon">📅</div>
        <div>
          <h2>Оберіть дату</h2>
          <p>{selectedCar ? `${selectedCar.name} · ${selectedCar.color}` : 'Бажаний день поїздки'}</p>
        </div>
      </div>
      <div className="card-body">
        <CalendarPicker />
      </div>
    </div>
  );
}
