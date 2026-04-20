import { useConfig } from '../contexts/ConfigContext';
import './AboutUs.css';

const AboutUs = () => {
  const { get } = useConfig();
  const name = get('restaurant_name', 'Kalyani Restaurant');
  const address = get('address', '');
  const mapsUrl = get('maps_embed_url', '');

  return (
    <section id="about" className="about-us">
      <div className="about-container">
        <h2 className="section-title">About Us</h2>
        <div className="about-content">
          <div className="about-text">
            <p>
              Welcome to <strong>{name}</strong>, where tradition meets taste.
              Established with a passion for authentic Indian cuisine, we bring you the finest
              flavors from across the subcontinent, prepared with fresh ingredients and
              time-honored recipes.
            </p>
            <p>
              Our chefs specialize in aromatic biryanis, rich curries, and delectable starters
              that have been loved by our customers for years. Every dish is crafted with care
              to deliver an unforgettable dining experience.
            </p>
            <p>
              Whether you're dining in or ordering from the comfort of your home, we promise
              quality, consistency, and the warmth of home-cooked food in every bite.
            </p>
          </div>
          <div className="about-highlights">
            <div className="highlight-card">
              <span className="highlight-number">10+</span>
              <span className="highlight-label">Years of Service</span>
            </div>
            <div className="highlight-card">
              <span className="highlight-number">50+</span>
              <span className="highlight-label">Dishes on Menu</span>
            </div>
            <div className="highlight-card">
              <span className="highlight-number">10K+</span>
              <span className="highlight-label">Happy Customers</span>
            </div>
          </div>
        </div>

        {(mapsUrl || address) && (
          <div className="about-location">
            <h3 className="about-location__title">Find Us</h3>
            {mapsUrl && (
              <div className="about-location__map">
                <iframe
                  src={mapsUrl}
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${name} Location`}
                />
              </div>
            )}
            {address && <p className="about-location__address">📍 {address}</p>}
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutUs;
