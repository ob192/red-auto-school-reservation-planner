'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/features/auth/lib/supabase';
import type { CarModel } from '@/models/car.model';

// ── helpers ────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    const res = await fetch(url, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init?.headers ?? {}),
        },
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
    cancelled_hours: number;
}

export interface InstructorCarSummary {
    car_model: CarModel;
    car_name: string;
    months: MonthSummary[];
    total_hours: number;
    cancelled_hours: number;
}

export interface InstructorScheduleResponse {
    instructor: string;
    cars: InstructorCarSummary[];
    grand_total_hours: number;
    grand_cancelled_hours: number;
}

export interface AdminBookingRow {
    id: string;
    user_id: string;
    car_model: CarModel;
    car_name: string;
    car_color: string;
    car_emoji: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    status: 'confirmed' | 'cancelled';
    created_at: string;
}

export interface AdminBookingsResponse {
    bookings: AdminBookingRow[];
    total: number;
    page: number;
    limit: number;
}

export interface AdminCreateBookingInput {
    car_model: CarModel;
    booking_date: string;
    start_time: string;
    end_time: string;
    first_name: string;
    last_name: string;
    phone?: string;
}

// ── hooks ─────────────────────────────────────────────────────────

export function useAdminSchedule(date: string | null) {
    return useQuery({
        queryKey: ['admin-schedule', date],
        queryFn: () => apiFetch<AdminScheduleResponse>(`/api/admin/schedule?date=${date}`),
        enabled: !!date,
        staleTime: 15_000,
    });
}

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

export function useInstructorList() {
    return useQuery({
        queryKey: ['instructor-list'],
        queryFn: () =>
            apiFetch<{ instructors: string[] }>('/api/instructor').then(r => r.instructors),
        staleTime: 60_000,
    });
}

/**
 * Fetches a single instructor's schedule.
 *
 * Uses GET /api/instructor/schedule?name=... (query param) instead of
 * the old /api/instructor/:name path — avoids Next.js routing issues
 * with Cyrillic names that contain spaces.
 */
export function useInstructorSchedule(
    name: string | null,
    fromDate?: string,
    toDate?: string
) {
    return useQuery({
        queryKey: ['instructor-schedule', name, fromDate, toDate],
        queryFn: () => {
            const params = new URLSearchParams({ name: name! });
            if (fromDate) params.set('from', fromDate);
            if (toDate)   params.set('to',   toDate);
            return apiFetch<InstructorScheduleResponse>(
                `/api/instructor/schedule?${params.toString()}`
            );
        },
        enabled: !!name,
        staleTime: 30_000,
    });
}

export function useAdminBookings(filters: {
    from?: string; to?: string; car_model?: string;
    status?: string; search?: string; page?: number; limit?: number;
}) {
    const params = new URLSearchParams();
    if (filters.from)      params.set('from',      filters.from);
    if (filters.to)        params.set('to',        filters.to);
    if (filters.car_model) params.set('car_model', filters.car_model);
    if (filters.status)    params.set('status',    filters.status);
    if (filters.search)    params.set('search',    filters.search);
    if (filters.page)      params.set('page',      String(filters.page));
    if (filters.limit)     params.set('limit',     String(filters.limit));
    const qs = params.toString();
    return useQuery({
        queryKey: ['admin-bookings', filters],
        queryFn: () => apiFetch<AdminBookingsResponse>(`/api/admin/bookings${qs ? '?' + qs : ''}`),
        staleTime: 15_000,
    });
}

export function useAdminUpdateBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' }) =>
            apiFetch<{ booking: AdminBookingRow }>(`/api/admin/bookings/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-schedule'] });
            qc.invalidateQueries({ queryKey: ['admin-bookings'] });
            qc.invalidateQueries({ queryKey: ['admin-stats'] });
        },
    });
}

export function useAdminDeleteBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) =>
            apiFetch<{ deleted: string }>(`/api/admin/bookings/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-schedule'] });
            qc.invalidateQueries({ queryKey: ['admin-bookings'] });
            qc.invalidateQueries({ queryKey: ['admin-stats'] });
        },
    });
}

export function useAdminCreateBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input: AdminCreateBookingInput) =>
            apiFetch<{ booking: AdminBookingRow }>('/api/admin/bookings', {
                method: 'POST',
                body: JSON.stringify(input),
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-schedule'] });
            qc.invalidateQueries({ queryKey: ['admin-bookings'] });
            qc.invalidateQueries({ queryKey: ['admin-stats'] });
        },
    });
}