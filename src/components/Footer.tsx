import { Link } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { get } = useConfig();
  const name = get('restaurant_name', 'Kalyani Restaurant');

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <h3>{name}</h3>
            <p>{get('tagline', 'Authentic flavors, crafted with love.')}</p>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <a href="#menu">Menu</a>
            <a href="#about">About Us</a>
          </div>

          <div className="footer-links">
            <h4>Legal</h4>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#refund">Refund Policy</a>
            <a href="#cookies">Cookie Policy</a>
          </div>

          <div className="footer-links">
            <h4>Contact</h4>
            <p>{get('email', 'contact@kalyanirestaurant.com')}</p>
            <p>{get('phone', '+91 98765 43210')}</p>
            <p className="footer-address">{get('address', '')}</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} {name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
