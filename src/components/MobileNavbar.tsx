import { UtensilsCrossed, ClipboardList, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import './MobileNavbar.css';

const MobileNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { totalItems } = useCart();

  const requireAuth = (target: string) => {
    if (isAuthenticated) navigate(target);
    else navigate('/login', { state: { from: target } });
  };

  return (
    <nav className="mobile-bottom-nav">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <UtensilsCrossed size={22} />
        <span>Menu</span>
      </Link>
      <Link to="/cart" className={`nav-item ${totalItems > 0 ? 'has-items' : ''} ${location.pathname === '/cart' ? 'active' : ''}`}>
        <div className="nav-cart-icon">
          <ShoppingCart size={22} />
          {totalItems > 0 && <span className="nav-cart-badge">{totalItems}</span>}
        </div>
        <span>Cart</span>
      </Link>
      <button type="button" className={`nav-item ${location.pathname === '/orders' ? 'active' : ''}`} onClick={() => requireAuth('/orders')}>
        <ClipboardList size={22} />
        <span>Orders</span>
      </button>
      <button type="button" className="nav-item" onClick={() => isAuthenticated ? navigate('/orders') : navigate('/login')}>
        <User size={22} />
        <span>{isAuthenticated ? 'Profile' : 'Login'}</span>
      </button>
    </nav>
  );
};

export default MobileNavbar;
