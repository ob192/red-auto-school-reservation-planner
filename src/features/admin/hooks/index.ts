'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/features/auth/lib/supabase';
import type { CarModel } from '@/models/car.model';

// ── helpers ────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

async function apiFetch<T>(url: string): Promise<T> {
    const token = await getToken();
    const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}

// ── types ──────────────────────────────────────────────────────────

export interface AdminBookingSlot {
    id: string;
    car_model: CarModel;
    car_name: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    status: 'confirmed' | 'cancelled';
}

export interface AdminCarSchedule {
    car_model: CarModel;
    car_name: string;
    car_color: string;
    car_emoji: string;
    bookings: AdminBookingSlot[];
}

export interface AdminScheduleResponse {
    date: string;
    cars: AdminCarSchedule[];
}

export interface CarStat {
    car_model: CarModel;
    car_name: string;
    car_color: string;
    car_emoji: string;
    total_bookings: number;
    total_hours: number;
}

export interface MonthlyRow {
    car_model: CarModel;
    month: string;
    bookings: number;
    hours: number;
}

export interface InstructorStat {
    full_name: string;
    total_bookings: number;
    total_hours: number;
}

export interface AdminStatsResponse {
    stats: CarStat[];
    monthly: MonthlyRow[];
    topInstructors: InstructorStat[];
}

// ── Instructor types (reuse from API) ─────────────────────────────

export interface InstructorBookingDetail {
    id: string;
    car_model: CarModel;
    car_name: string;
    car_color: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    status: 'confirmed' | 'cancelled';
}

export interface MonthSummary {
    month: string;
    bookings: InstructorBookingDetail[];
    total_hours: number;
}

export interface InstructorCarSummary {
    car_model: CarModel;
    car_name: string;
    months: MonthSummary[];
    total_hours: number;
}

export interface InstructorScheduleResponse {
    instructor: string;
    cars: InstructorCarSummary[];
    grand_total_hours: number;
}

// ── hooks ─────────────────────────────────────────────────────────

/** All bookings for every car on a given date */
export function useAdminSchedule(date: string | null) {
    return useQuery({
        queryKey: ['admin-schedule', date],
        queryFn: () => apiFetch<AdminScheduleResponse>(`/api/admin/schedule?date=${date}`),
        enabled: !!date,
        staleTime: 15_000,
    });
}

/** Aggregate car statistics */
export function useAdminStats(fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate);
    if (toDate)   params.set('to',   toDate);
    const qs = params.toString();

    return useQuery({
        queryKey: ['admin-stats', fromDate, toDate],
        queryFn: () => apiFetch<AdminStatsResponse>(`/api/admin/stats${qs ? '?' + qs : ''}`),
        staleTime: 30_000,
    });
}

/** List of all instructors */
export function useInstructorList() {
    return useQuery({
        queryKey: ['instructor-list'],
        queryFn: () =>
            apiFetch<{ instructors: string[] }>('/api/instructor').then((r) => r.instructors),
        staleTime: 60_000,
    });
}

/** Full schedule for one instructor with optional date range */
export function useInstructorSchedule(
    name: string | null,
    fromDate?: string,
    toDate?: string
) {
    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate);
    if (toDate)   params.set('to',   toDate);
    const qs = params.toString();

    return useQuery({
        queryKey: ['instructor-schedule', name, fromDate, toDate],
        queryFn: () => {
            const encoded = encodeURIComponent(name!);
            return apiFetch<InstructorScheduleResponse>(
                `/api/instructor/${encoded}${qs ? '?' + qs : ''}`
            );
        },
        enabled: !!name,
        staleTime: 30_000,
    });
}