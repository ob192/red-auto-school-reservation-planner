import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="home-hero">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">🏎️</div>
          <div className="logo-text">
            <div className="brand">RedAutoSchool</div>
            <div className="tagline">Онлайн бронювання</div>
          </div>
        </div>
        <Link href="/signin" style={{ textDecoration: 'none' }}>
          <button className="btn-ghost" type="button" style={{ minHeight: 38, padding: '0.5rem 1rem', fontSize: '0.65rem' }}>
            Увійти
          </button>
        </Link>
      </header>

      {/* Hero */}
      <div className="home-content">
        <div className="home-eyebrow">Автошкола нового покоління</div>
        <h1 className="home-title">
          Навчайся.
          <span className="accent">Їдь.</span>
          Перемагай.
        </h1>
        <p className="home-sub">
          Забронюйте навчальне авто онлайн за 30 секунд. Без черг, без телефонних дзвінків — лише чисте задоволення від водіння.
        </p>

        <Link href="/book/car" className="home-cta">
          Забронювати авто →
        </Link>

        <div className="home-features">
          <div className="feature-chip">
            <div className="feature-icon">🚗</div>
            <div className="feature-text">4 моделі авто</div>
          </div>
          <div className="feature-chip">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">Миттєве підтвердження</div>
          </div>
          <div className="feature-chip">
            <div className="feature-icon">📱</div>
            <div className="feature-text">Завжди з собою</div>
          </div>
        </div>
      </div>
    </div>
  );
}
