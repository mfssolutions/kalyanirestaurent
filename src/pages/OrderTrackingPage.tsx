import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNavbar from '../components/MobileNavbar';
import OrderTracking from '../components/OrderTracking';

export default function OrderTrackingPage() {
  return (
    <div className="page-wrapper">
      <Header location={null} />
      <main className="main-content">
        <OrderTracking />
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
}
