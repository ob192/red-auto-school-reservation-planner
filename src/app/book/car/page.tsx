'use client';

import { CarSelector } from '@/features/booking/components/client/CarSelector';

export default function CarPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-icon">🚗</div>
        <div>
          <h2>Оберіть автомобіль</h2>
          <p>Виберіть авто для навчальної поїздки</p>
        </div>
      </div>
      <div className="card-body">
        <CarSelector />
      </div>
    </div>
  );
}
