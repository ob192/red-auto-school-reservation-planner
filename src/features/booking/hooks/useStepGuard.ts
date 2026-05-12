'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingStore } from '../store/bookingStore';

type Step = 'date' | 'time' | 'details';

export function useStepGuard(requires: Step) {
  const router = useRouter();
  const { selectedCar, selectedDate, startTime } = useBookingStore();

  useEffect(() => {
    if (requires === 'date' && !selectedCar) {
      router.replace('/book/car');
      return;
    }
    if (requires === 'time' && (!selectedCar || !selectedDate)) {
      router.replace(!selectedCar ? '/book/car' : '/book/date');
      return;
    }
    if (requires === 'details' && (!selectedCar || !selectedDate || !startTime)) {
      router.replace(!selectedCar ? '/book/car' : !selectedDate ? '/book/date' : '/book/time');
      return;
    }
  }, [requires, selectedCar, selectedDate, startTime, router]);
}
