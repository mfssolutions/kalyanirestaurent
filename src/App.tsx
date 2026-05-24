import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from './contexts/ConfigContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import { AdminProvider } from './contexts/AdminContext';
import { RiderProvider } from './contexts/RiderContext';
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrdersPage from './pages/OrdersPage';
import AdminPage from './pages/AdminPage';
import RiderPage from './pages/RiderPage';
import BillingPage from './pages/BillingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import PageLoader from './components/PageLoader';
import NativeLandingGate from './native/NativeLandingGate';

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AdminProvider>
          <AuthProvider>
            <CartProvider>
              <OrderProvider>
                <RiderProvider>
                  <PageLoader />
                  <NativeLandingGate />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order/:orderId" element={<OrderTrackingPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/rider" element={<RiderPage />} />
                    <Route path="/biller" element={<BillingPage />} />
                    <Route path="/billing" element={<BillingPage />} />
                  </Routes>
                </RiderProvider>
              </OrderProvider>
            </CartProvider>
          </AuthProvider>
        </AdminProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
