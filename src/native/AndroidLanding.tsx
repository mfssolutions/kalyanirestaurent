import { Flame } from 'lucide-react';
import './AndroidLanding.css';

/**
 * Android-only landing screen (first page on the native app).
 * Rendered exclusively when running inside the Capacitor shell — never on web.
 *
 * Brand: "Kalyani Kitchen".
 * Buttons hand off to the existing web routes (/signup, /login) so the rest of
 * the user/admin/rider flow continues to work unchanged.
 */
export default function AndroidLanding({
  onGetStarted,
  onLogin,
}: {
  onGetStarted: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="al-root">
      {/* Decorative food emojis */}
      <div className="al-decor" aria-hidden="true">
        <span className="e1">🍕</span>
        <span className="e2">🍔</span>
        <span className="e3">🌮</span>
        <span className="e4">🍜</span>
        <span className="e5">🥗</span>
      </div>

      {/* Hero */}
      <div className="al-body">
        <div className="al-logo-row">
          <div className="al-logo-badge">
            <Flame color="#fff" size={22} strokeWidth={2.5} />
          </div>
          <span className="al-brand">Kalyani Kitchen</span>
        </div>
        <p className="al-tagline">Order food in minutes</p>

        <div className="al-hero-wrap">
          <div className="al-hero-glow" />
          <img
            className="al-hero-img"
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=380&fit=crop&auto=format"
            alt="Delicious food ready to be delivered"
          />
          <div className="al-live-badge">
            <div className="al-live-dot" />
            <span className="al-live-text">500+ dishes near you</span>
          </div>
        </div>

        <div className="al-pills">
          <div className="al-pill"><span className="al-pill-icon">⚡</span><span className="al-pill-label">30 min delivery</span></div>
          <div className="al-pill"><span className="al-pill-icon">⭐</span><span className="al-pill-label">Top rated</span></div>
          <div className="al-pill"><span className="al-pill-icon">💸</span><span className="al-pill-label">Best deals</span></div>
        </div>
      </div>

      {/* CTA */}
      <div className="al-cta">
        <button type="button" className="al-btn al-btn-primary" onClick={onGetStarted}>
          Get Started 🚀
        </button>
        <button type="button" className="al-btn al-btn-secondary" onClick={onLogin}>
          Already have an account?<span className="al-link">Login</span>
        </button>
      </div>
    </div>
  );
}
