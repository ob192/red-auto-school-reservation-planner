'use client';

import { DetailsForm } from '@/features/booking/components/client/DetailsForm';

export default function DetailsPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-icon">📋</div>
        <div>
          <h2>Ваші дані</h2>
          <p>Підтвердіть бронювання</p>
        </div>
      </div>
      <div className="card-body">
        <DetailsForm />
      </div>
    </div>
  );
}
