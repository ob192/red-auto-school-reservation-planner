'use client';

export type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { n: 1 as Step, label: 'Авто', icon: '🚗' },
  { n: 2 as Step, label: 'Дата', icon: '📅' },
  { n: 3 as Step, label: 'Час', icon: '🕐' },
  { n: 4 as Step, label: 'Деталі', icon: '📋' },
  { n: 5 as Step, label: 'Готово', icon: '✅' },
];

export function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <nav className="steps-nav" aria-label="Кроки бронювання">
      {STEPS.map((step, i) => {
        const isDone = step.n < currentStep;
        const isActive = step.n === currentStep;
        return (
          <div key={step.n} style={{ display: 'contents' }}>
            <div
              className={`step-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="dot">{isDone ? '✓' : step.icon}</div>
              <div className="label">{step.label}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${isDone ? 'done' : ''}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
