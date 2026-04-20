import { useState, useRef, useEffect } from 'react';
import { Menu, X, MapPin, ShoppingCart, LogOut, User, ChevronDown, ClipboardList, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useConfig } from '../contexts/ConfigContext';
import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  location: string | null;
}

const Header: React.FC<HeaderProps> = ({ location }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { get } = useConfig();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="logo-link"><h1 className="logo">{get('restaurant_name', 'Kalyani Restaurant')}</h1></Link>
            {location && (
              <span className="location-badge">
                <MapPin size={14} />
                {location}
              </span>
            )}
          </div>

          <nav className="desktop-nav">
            <Link to="/">Home</Link>
            <a href="#about">About Us</a>
            <a href="#menu">Menu</a>
            {totalItems > 0 && (
              <button className="header-cart-btn" onClick={toggleCart}>
                <ShoppingCart size={18} />
                <span className="header-cart-count">{totalItems}</span>
              </button>
            )}
            {isAuthenticated ? (
              <div className="header-profile" ref={dropdownRef}>
                <button
                  className="header-profile-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <User size={16} />
                  <span>{user?.name}</span>
                  <ChevronDown size={14} className={`header-profile-chevron ${profileOpen ? 'open' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="header-profile-dropdown">
                    <Link to="/orders" className="header-dropdown-item" onClick={() => setProfileOpen(false)}>
                      <ClipboardList size={16} /> Orders
                    </Link>
                    <Link to="/orders" className="header-dropdown-item" onClick={() => setProfileOpen(false)}>
                      <History size={16} /> Order History
                    </Link>
                    <button className="header-dropdown-item logout" onClick={handleLogoutClick}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={openAuthModal} className="login-btn">Login</button>
            )}
          </nav>

          <div className="header-mobile-right">
            {totalItems > 0 && (
              <button className="header-cart-btn mobile" onClick={toggleCart}>
                <ShoppingCart size={20} />
                <span className="header-cart-count">{totalItems}</span>
              </button>
            )}
            <button
              className="hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" onClick={() => setMenuOpen(false)}>
            <Link to="/">Home</Link>
            <a href="#about">About Us</a>
            <a href="#menu">Menu</a>
            {isAuthenticated ? (
              <>
                <span className="mobile-nav__user"><User size={16} /> {user?.name}</span>
                <Link to="/orders" className="mobile-nav__link">
                  <ClipboardList size={16} /> Orders
                </Link>
                <Link to="/orders" className="mobile-nav__link">
                  <History size={16} /> Order History
                </Link>
                <button onClick={handleLogoutClick} className="mobile-nav__logout">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <button onClick={openAuthModal}>Login</button>
            )}
          </nav>
        )}
      </header>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-dialog" onClick={e => e.stopPropagation()}>
            <div className="logout-dialog__icon">
              <LogOut size={28} />
            </div>
            <h3>Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-dialog__actions">
              <button className="logout-dialog__cancel" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="logout-dialog__confirm" onClick={confirmLogout}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
