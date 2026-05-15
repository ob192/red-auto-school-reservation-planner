'use client';

import { useRouter } from 'next/navigation';
import { getAllCars } from '@/models/car.model';
import { useBookingStore } from '@/features/booking/store/bookingStore';

const cars = getAllCars(); // static, computed once at module load

const CAR_GRADIENTS: Record<string, string> = {
    'MINI COOPER': 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)', // red
    'MAZDA':       'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)', // dark grey
    'KIA RIO':     'linear-gradient(135deg, #a0998a 0%, #7d7567 100%)', // grey-beige
    'TOYOTA':      'linear-gradient(135deg, #a0aec0 0%, #718096 100%)', // grey
};

const CAR_DESCRIPTIONS: Record<string, string> = {
    'MINI COOPER': 'Преміум хетчбек · Автомат',
    'MAZDA':       'Спортивний седан · Автомат',        // was: Механіка 6-ступ.
    'KIA RIO':     'Економічний хетчбек · Механіка',   // was: Автомат
    'TOYOTA':      'Комфортний бізнес-клас · Механіка', // was: Автомат
};

export function CarSelector() {
  const { selectedCar, setCar } = useBookingStore();
  const router = useRouter();

  return (
      <div>
        <div className="cars-grid">
          {cars.map((car) => {
            const isSel = selectedCar?.model === car.model;
            return (
                <button
                    key={car.model}
                    className={`car-card ${isSel ? 'selected' : ''}`}
                    onClick={() => setCar(car)}
                    type="button"
                    aria-pressed={isSel}
                >
                  <div className="car-visual" style={{ background: CAR_GRADIENTS[car.model] }}>
                    <span className="car-emoji">{car.image_emoji}</span>
                    {isSel && <div className="car-check">✓</div>}
                  </div>
                  <div className="car-info">
                    <div className="car-name">{car.name}</div>
                    <div className="car-desc">{CAR_DESCRIPTIONS[car.model]}</div>
                    <div className="car-color">
                      <span className="color-dot" />
                      {car.color}
                    </div>
                  </div>
                </button>
            );
          })}
        </div>

        <div className="nav-btns" style={{ marginTop: '0.5rem' }}>
          <div />
          <button
              className="btn-primary"
              disabled={!selectedCar}
              onClick={() => router.push('/book/date')}
              type="button"
          >
            Далі →
          </button>
        </div>
      </div>
  );
}