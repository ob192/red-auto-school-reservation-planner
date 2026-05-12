'use client';

import { useRouter } from 'next/navigation';
import { getAllCars } from '@/models/car.model';
import { useBookingStore } from '@/features/booking/store/bookingStore';

const cars = getAllCars(); // static, computed once at module load

const CAR_GRADIENTS: Record<string, string> = {
  'MAZDA':       'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
  'KIA RIO':     'linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)',
  'TOYOTA':      'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
  'MINI COOPER': 'linear-gradient(135deg, #d69e2e 0%, #b7791f 100%)',
};

const CAR_DESCRIPTIONS: Record<string, string> = {
  'MAZDA':       'Спортивний седан · Механіка 6-ступ.',
  'KIA RIO':     'Економічний хетчбек · Автомат',
  'TOYOTA':      'Комфортний бізнес-клас · Автомат',
  'MINI COOPER': 'Преміум хетчбек · Автомат',
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