'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSession } from '@/features/auth/hooks/useSession';
import { useBookingStore } from '@/features/booking/store/bookingStore';
import { useCreateBooking } from '@/features/booking/hooks';
import { contactSchema, type ContactFormValues } from '@/features/booking/schema/booking.schema';
import { useStepGuard } from '@/features/booking/hooks/useStepGuard';
import { supabase } from '@/features/auth/lib/supabase';

export function DetailsForm() {
  useStepGuard('details');

  const { user } = useSession();
  const router = useRouter();
  const { selectedCar, selectedDate, startTime, endTime, contact, setContact, setBookingId } =
      useBookingStore();
  const createBooking = useCreateBooking();

  const { register, handleSubmit, setValue, formState: { errors } } =
      useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
          firstName: contact.firstName,
          lastName:  contact.lastName,
          phone:     contact.phone,
        },
      });

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(' ');
      if (!contact.firstName) setValue('firstName', parts[0] ?? '');
      if (!contact.lastName)  setValue('lastName',  parts.slice(1).join(' ') ?? '');
    }
  }, [user, setValue, contact]);

  const getToken = async (): Promise<string | null> => {

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const onSubmit = async (data: ContactFormValues) => {
    if (!selectedCar || !selectedDate || !startTime || !endTime) return;

    const token = await getToken();
    if (!token) {
      router.push('/signin?next=/book/details');
      return;
    }

    setContact(data);

    try {
      const booking = await createBooking.mutateAsync({
        token,
        carModel:    selectedCar.model,
        bookingDate: selectedDate,
        startTime,
        endTime,
        contact:     data,
      });
      setBookingId(booking.id);
      router.push('/book/success');
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const dateLabel = selectedDate
      ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('uk-UA', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      : '';

  const errorMsg = (createBooking.error as Error)?.message;

  return (
      <div>
        <div className="booking-summary-card">
          <div className="summary-row">
            <span className="summary-icon">{selectedCar?.image_emoji}</span>
            <div>
              <div className="summary-title">{selectedCar?.name}</div>
              <div className="summary-sub">{selectedCar?.color}</div>
            </div>
          </div>
          <div className="summary-divider" />
          <div className="summary-row">
            <span className="summary-icon">📅</span>
            <div>
              <div className="summary-title">{dateLabel}</div>
              <div className="summary-sub">{startTime} – {endTime}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Прізвище</label>
              <input id="lastName" className="form-input" {...register('lastName')} autoComplete="family-name" />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">Ім&apos;я</label>
              <input id="firstName" className="form-input" {...register('firstName')} autoComplete="given-name" />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Телефон</label>
            <input
                id="phone"
                className="form-input"
                type="tel"
                placeholder="+380..."
                {...register('phone')}
                autoComplete="tel"
            />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>

          {errorMsg === 'SLOT_TAKEN' && (
              <div className="error-banner">
                ⛔ Цей час вже зайнятий. Будь ласка, оберіть інший інтервал.
              </div>
          )}
          {errorMsg && errorMsg !== 'SLOT_TAKEN' && (
              <div className="error-banner">
                ❌ Помилка при бронюванні. Спробуйте ще раз.
              </div>
          )}

          <div className="nav-btns" style={{ marginTop: '1rem' }}>
            <button className="btn-ghost" onClick={() => router.push('/book/time')} type="button">
              ← Назад
            </button>
            <button className="btn-primary" type="submit" disabled={createBooking.isPending}>
              {createBooking.isPending ? '⏳ Бронюємо...' : '✅ Підтвердити'}
            </button>
          </div>
        </form>
      </div>
  );
}