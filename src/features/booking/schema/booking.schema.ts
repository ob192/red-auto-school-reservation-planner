import { z } from 'zod';

export const contactSchema = z.object({
  firstName: z.string().min(1, "Введіть ім'я").max(50),
  lastName: z.string().min(1, 'Введіть прізвище').max(50),
  phone: z.string().min(6, 'Введіть номер телефону'),
});

export const bookingSchema = z.object({
  carId: z.string().uuid(),
  carName: z.string(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  contact: contactSchema,
});

export type ContactFormValues = z.infer<typeof contactSchema>;
export type BookingFormValues = z.infer<typeof bookingSchema>;
