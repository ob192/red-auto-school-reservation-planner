import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Car } from '@/models/car.model';

export type { Car };

export interface ContactInfo {
    firstName: string;
    lastName: string;
    phone: string;
}

interface BookingState {
    selectedCar: Car | null;
    selectedDate: string | null;
    startTime: string | null;
    endTime: string | null;
    contact: ContactInfo;
    bookingId: string | null;

    setCar: (car: Car) => void;
    setDate: (date: string) => void;
    setStartTime: (t: string) => void;
    setEndTime: (t: string) => void;
    setContact: (c: Partial<ContactInfo>) => void;
    setBookingId: (id: string) => void;
    reset: () => void;
}

const initial = {
    selectedCar: null,
    selectedDate: null,
    startTime: null,
    endTime: null,
    contact: { firstName: '', lastName: '', phone: '' },
    bookingId: null,
};

export const useBookingStore = create<BookingState>()(
    persist(
        (set) => ({
            ...initial,
            setCar:       (car) => set({ selectedCar: car, selectedDate: null, startTime: null, endTime: null }),
            setDate:      (date) => set({ selectedDate: date, startTime: null, endTime: null }),
            setStartTime: (t) => set({ startTime: t, endTime: null }),
            setEndTime:   (t) => set({ endTime: t }),
            setContact:   (c) => set((s) => ({ contact: { ...s.contact, ...c } })),
            setBookingId: (id) => set({ bookingId: id }),
            reset:        () => set(initial),
        }),
        {
            name: 'red-auto-school-booking',
            partialize: (s) => ({
                selectedCar:  s.selectedCar,
                selectedDate: s.selectedDate,
                startTime:    s.startTime,
                endTime:      s.endTime,
            }),
        }
    )
);