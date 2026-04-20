import { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useConfig } from '../contexts/ConfigContext';
import './Hero.css';

const Hero = () => {
  const { banners } = useAdmin();
  const { get } = useConfig();
  const activeBanners = banners.filter(b => b.isActive && b.imageUrl);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    return (
      <section id="home" className="hero hero--empty">
        <img src="/placeholder-banner.jpg" alt={get('restaurant_name', 'Restaurant')} className="hero__img" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </section>
    );
  }

  const banner = activeBanners[current];

  return (
    <section id="home" className="hero">
      <img src={banner.imageUrl} alt="Banner" className="hero__img" />
      {activeBanners.length > 1 && (
        <div className="hero-dots">
          {activeBanners.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
