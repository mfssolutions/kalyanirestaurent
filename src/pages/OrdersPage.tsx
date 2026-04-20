import { useNavigate, Link } from 'react-router-dom';
import { Clock, Package } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNavbar from '../components/MobileNavbar';
import { useOrders } from '../contexts/OrderContext';
import '../components/OrderTracking.css';

export default function OrdersPage() {
  const { orders } = useOrders();
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <Header location={null} />
      <main className="main-content">
        <div className="tracking" style={{ minHeight: '60vh' }}>
          <h1 style={{ marginBottom: 24 }}>My Orders</h1>
          {orders.length === 0 ? (
            <div className="tracking-empty" style={{ padding: '60px 20px' }}>
              <Package size={48} strokeWidth={1} color="#ccc" />
              <h2>No orders yet</h2>
              <p>Your orders will appear here once you place one.</p>
              <button onClick={() => navigate('/')}>Browse Menu</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(order => (
                <Link
                  key={order.id}
                  to={`/order/${order.id}`}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'white', padding: '16px 20px', borderRadius: 12,
                    textDecoration: 'none', color: '#333',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s',
                  }}
                >
                  <div>
                    <strong>#{order.id}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} /> {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#666' }}>
                      {order.items.length} items · ₹{order.total}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600,
                    background: order.status === 'delivered' ? '#e8f5e9' : '#fff3e0',
                    color: order.status === 'delivered' ? '#2e7d32' : '#e65100',
                  }}>
                    {order.status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileNavbar />
    </div>
  );
}
