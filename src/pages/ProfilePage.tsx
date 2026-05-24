import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Phone, MapPin, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import MobileNavbar from '../components/MobileNavbar';
import NativeTopBar from '../native/NativeTopBar';
import { isNative } from '../native/initNative';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const native = isNative();

  if (!isAuthenticated || !user) {
    navigate('/login', { replace: true, state: { from: '/profile' } });
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const address = user.addresses?.[0];

  return (
    <>
      {native ? <NativeTopBar title="My Profile" onBack={handleBack} /> : <Header location={null} />}
      <div className="profile-page">
        {!native && (
          <div className="profile-page__topbar">
            <button className="profile-page__back" onClick={handleBack} aria-label="Back">
              <ArrowLeft size={22} />
            </button>
            <h1>My Profile</h1>
          </div>
        )}

        <div className="profile-page__body">
          <div className="profile-page__avatar">
            <UserIcon size={48} />
          </div>
          <h2 className="profile-page__name">{user.name}</h2>
          <p className="profile-page__phone"><Phone size={14} /> +91 {user.mobile}</p>

          {address && (
            <div className="profile-page__card">
              <div className="profile-page__card-title"><MapPin size={16} /> Delivery address</div>
              <p className="profile-page__card-text">{address.fullAddress}</p>
              {address.pincode && <p className="profile-page__card-meta">PIN: {address.pincode}</p>}
            </div>
          )}

          <button className="profile-page__action" onClick={() => navigate('/orders')}>
            <ClipboardList size={18} /> My Orders
          </button>

          <button className="profile-page__logout" onClick={() => { logout(); navigate('/'); }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
      <MobileNavbar />
    </>
  );
}
