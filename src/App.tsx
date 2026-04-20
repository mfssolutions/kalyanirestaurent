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

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AdminProvider>
          <AuthProvider>
            <CartProvider>
              <OrderProvider>
                <RiderProvider>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order/:orderId" element={<OrderTrackingPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/rider" element={<RiderPage />} />
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
