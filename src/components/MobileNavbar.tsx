import { UtensilsCrossed, ClipboardList, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import './MobileNavbar.css';

const MobileNavbar = () => {
  const location = useLocation();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { totalItems, toggleCart } = useCart();

  return (
    <nav className="mobile-bottom-nav">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <UtensilsCrossed size={22} />
        <span>Menu</span>
      </Link>
      <button className={`nav-item ${totalItems > 0 ? 'has-items' : ''}`} onClick={toggleCart}>
        <div className="nav-cart-icon">
          <ShoppingCart size={22} />
          {totalItems > 0 && <span className="nav-cart-badge">{totalItems}</span>}
        </div>
        <span>Cart</span>
      </button>
      <Link to={isAuthenticated ? '/orders' : '#'} className="nav-item" onClick={e => { if (!isAuthenticated) { e.preventDefault(); openAuthModal(); } }}>
        <ClipboardList size={22} />
        <span>Orders</span>
      </Link>
      <button className="nav-item" onClick={() => { if (!isAuthenticated) openAuthModal(); }}>
        <User size={22} />
        <span>{isAuthenticated ? 'Profile' : 'Login'}</span>
      </button>
    </nav>
  );
};

export default MobileNavbar;
