import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNavbar from '../components/MobileNavbar';
import Checkout from '../components/Checkout';
import AuthModal from '../components/AuthModal';

export default function CheckoutPage() {
  return (
    <div className="page-wrapper">
      <Header location={null} />
      <main className="main-content">
        <Checkout />
      </main>
      <Footer />
      <MobileNavbar />
      <AuthModal />
    </div>
  );
}
