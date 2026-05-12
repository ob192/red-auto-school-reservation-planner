'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { StepIndicator } from '@/features/booking/components/client/StepIndicator';
import type { Step } from '@/features/booking/components/client/StepIndicator';

const STEP_MAP: Record<string, Step> = {
  '/book/car':     1,
  '/book/date':    2,
  '/book/time':    3,
  '/book/details': 4,
  '/book/success': 5,
};

function WizardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep: Step = STEP_MAP[pathname] ?? 1;
  const isSuccess = pathname === '/book/success';

  return (
    <>
      <header className="header">
        <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">🏎️</div>
          <div className="logo-text">
            <div className="brand">RedAutoSchool</div>
            <div className="tagline">Бронювання авто</div>
          </div>
        </Link>
        <UserMenu />
      </header>

      {!isSuccess && <StepIndicator currentStep={currentStep} />}

      <div className="page-wrap">
        {children}
      </div>
    </>
  );
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <WizardShell>{children}</WizardShell>
    </AuthGuard>
  );
}
