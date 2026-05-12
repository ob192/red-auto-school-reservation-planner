'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/features/auth/lib/supabase';
import { getAllCars, type Car, type CarModel } from '@/models/car.model';
import type { ContactFormValues } from '@/features/booking/schema/booking.schema';

// ── CARS — pure registry, zero network ───────────────────────────
export function useCars() {
  return useQuery({
    queryKey: ['cars'],
    queryFn: (): Car[] => getAllCars(),
    staleTime: Infinity, // never stale — hardcoded data
  });
}

// ── BOOKINGS FOR A CAR/DATE ───────────────────────────────────────
export interface BookingSlot {
  id: string;
  start_time: string;
  end_time: string;
  first_name: string;
  last_name: string;
}

export function useBookingsForDate(carModel: CarModel | null, date: string | null) {
  return useQuery({
    queryKey: ['bookings', carModel, date],
    queryFn: async (): Promise<BookingSlot[]> => {
      if (!carModel || !date) return [];
      const { data, error } = await supabase
          .from('bookings')
          .select('id, start_time, end_time, first_name, last_name')
          .eq('car_model', carModel)
          .eq('booking_date', date)
          .eq('status', 'confirmed')
          .order('start_time');
      if (error) throw error;
      return data;
    },
    enabled: !!carModel && !!date,
    staleTime: 15_000,
  });
}

// ── MY BOOKINGS ───────────────────────────────────────────────────
export interface MyBooking {
  id: string;
  car_model: CarModel;
  car_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: string;
}

export function useMyBookings() {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: async (): Promise<MyBooking[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .gte('booking_date', today)
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 15_000,
  });
}

// ── CREATE BOOKING ────────────────────────────────────────────────
export interface CreateBookingInput {
  token: string;
  carModel: CarModel;
  bookingDate: string;
  startTime: string;
  endTime: string;
  contact: ContactFormValues;
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.token}`,
        },
        body: JSON.stringify({
          car_model:    input.carModel,
          booking_date: input.bookingDate,
          start_time:   input.startTime,
          end_time:     input.endTime,
          first_name:   input.contact.firstName,
          last_name:    input.contact.lastName,
          phone:        input.contact.phone,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'BOOKING_FAILED');
      return json.booking;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

// ── CANCEL BOOKING ────────────────────────────────────────────────
export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, token }: { bookingId: string; token: string }) => {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'CANCEL_FAILED');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}