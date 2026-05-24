import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import FoodMenu from '../components/FoodMenu';
import AboutUs from '../components/AboutUs';
import Footer from '../components/Footer';
import MobileNavbar from '../components/MobileNavbar';
import CartButton from '../components/CartButton';
import { isNative } from '../native/initNative';
import NativeHome from '../native/NativeHome';
import GpsGate from '../native/GpsGate';
import { useNativeLocation } from '../native/useNativeLocation';

const HomePage = () => {
  const [webLocation, setWebLocation] = useState<string | null>(null);
  const native = isNative();
  const nl = useNativeLocation();

  useEffect(() => {
    if (native) return; // native path handled by useNativeLocation
    if (!navigator.geolocation) { setWebLocation('Location not supported'); return; }
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
            data.address?.county || '';
          const state = data.address?.state || '';
          setWebLocation(city ? `${city}, ${state}` : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } catch {
          setWebLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        }
      },
      () => { setWebLocation(null); }
    );
  }, [native]);

  const location = native ? nl.label : webLocation;

  if (native) {
    return (
      <div className="page-wrapper">
        <GpsGate />
        <NativeHome location={location} onRequestLocation={nl.request} />
        <MobileNavbar />
      </div>
    );
  }

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
    </div>
  );
};

export default HomePage;
