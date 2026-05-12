import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from '@/shared/providers/QueryProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'RedAutoSchool — Бронювання авто',
  description: 'Забронюйте навчальне авто онлайн швидко та зручно.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="bg-wrap" aria-hidden="true">
          <div className="bg-grid" />
          <div className="bg-glow bg-glow-1" />
          <div className="bg-glow bg-glow-2" />
        </div>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
