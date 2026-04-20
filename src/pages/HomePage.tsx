import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import FoodMenu from '../components/FoodMenu';
import AboutUs from '../components/AboutUs';
import Footer from '../components/Footer';
import MobileNavbar from '../components/MobileNavbar';
import Cart from '../components/Cart';
import CartButton from '../components/CartButton';
import AuthModal from '../components/AuthModal';

const HomePage = () => {
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation('Location not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            '';
          const state = data.address?.state || '';
          setLocation(city ? `${city}, ${state}` : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } catch {
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        }
      },
      () => {
        setLocation(null);
      }
    );
  }, []);

  return (
    <div className="page-wrapper">
      <Header location={location} />
      <main className="main-content">
        <Hero />
        <FoodMenu />
        <AboutUs />
      </main>
      <Footer />
      <MobileNavbar />
      <CartButton />
      <Cart />
      <AuthModal />
    </div>
  );
};

export default HomePage;
