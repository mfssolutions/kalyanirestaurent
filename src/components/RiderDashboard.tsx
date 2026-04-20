import { useState } from 'react';
import { LogOut, MapPin, Phone, Package, CheckCircle, Truck, Clock, Star, Bike, Power } from 'lucide-react';
import { useRider } from '../contexts/RiderContext';
import type { Order } from '../types';
import './RiderDashboard.css';

export default function RiderDashboard() {
  const {
    rider, riderOrders, riderLogout,
    toggleOnline, acceptDelivery, markPickedUp, markDelivered,
  } = useRider();

  if (!rider) return null;

  const myOrders = riderOrders.filter(o => o.riderId === rider.id);
  const availableOrders = riderOrders.filter(o => !o.riderId && o.status === 'accepted');
  const activeDelivery = myOrders.find(o => o.status === 'out-for-delivery' || o.status === 'preparing');

  return (
    <div className="rider-dash">
      {/* Header */}
      <div className="rider-dash__header">
        <div className="rider-dash__profile">
          <Bike size={24} />
          <div>
            <h2>{rider.name}</h2>
            <span className="rider-dash__vehicle">{rider.vehicleType.toUpperCase()} {rider.vehicleNumber && `• ${rider.vehicleNumber}`}</span>
          </div>
        </div>
        <button className="rider-dash__logout" onClick={riderLogout}>
          <LogOut size={18} />
        </button>
      </div>

      {/* Online/Offline Toggle */}
      <div className={`rider-dash__toggle ${rider.isOnline ? 'online' : 'offline'}`}>
        <button onClick={toggleOnline}>
          <Power size={20} />
          {rider.isOnline ? 'You are Online' : 'You are Offline'}
        </button>
      </div>

      {/* Stats */}
      <div className="rider-dash__stats">
        <div className="rider-stat">
          <Package size={18} />
          <span className="rider-stat__value">{rider.totalDeliveries}</span>
          <span className="rider-stat__label">Deliveries</span>
        </div>
        <div className="rider-stat">
          <Star size={18} />
          <span className="rider-stat__value">{rider.rating.toFixed(1)}</span>
          <span className="rider-stat__label">Rating</span>
        </div>
        <div className="rider-stat">
          <Truck size={18} />
          <span className="rider-stat__value">{myOrders.length}</span>
          <span className="rider-stat__label">Active</span>
        </div>
      </div>

      {/* Active Delivery */}
      {activeDelivery && (
        <div className="rider-dash__section">
          <h3><Truck size={18} /> Current Delivery</h3>
          <ActiveOrderCard
            order={activeDelivery}
            onPickedUp={markPickedUp}
            onDelivered={markDelivered}
          />
        </div>
      )}

      {/* Available Orders (only when online and no active delivery) */}
      {rider.isOnline && !activeDelivery && (
        <div className="rider-dash__section">
          <h3><Clock size={18} /> Available Orders</h3>
          {availableOrders.length === 0 ? (
            <p className="rider-dash__empty">No orders available right now. Stay online!</p>
          ) : (
            availableOrders.map(order => (
              <AvailableOrderCard
                key={order.id}
                order={order}
                onAccept={acceptDelivery}
              />
            ))
          )}
        </div>
      )}

      {/* Offline message */}
      {!rider.isOnline && (
        <div className="rider-dash__offline-msg">
          <Power size={32} />
          <p>Go online to receive delivery orders</p>
        </div>
      )}
    </div>
  );
}

function AvailableOrderCard({ order, onAccept }: { order: Order; onAccept: (id: string) => void }) {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = () => {
    setAccepting(true);
    onAccept(order.id);
  };

  return (
    <div className="rider-order-card">
      <div className="rider-order-card__header">
        <strong>#{order.id.slice(-6)}</strong>
        <span className="rider-order-card__time">
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="rider-order-card__body">
        <div className="rider-order-card__customer">
          <MapPin size={14} />
          <span>{order.deliveryAddress?.fullAddress || 'Address not provided'}</span>
        </div>
        <div className="rider-order-card__items">
          {order.items.map(({ item, quantity }) => (
            <span key={item.id}>{item.name} x{quantity}</span>
          ))}
        </div>
        <div className="rider-order-card__total">
          <strong>₹{order.total}</strong>
          <span>{order.paymentMethod}</span>
        </div>
      </div>
      <div className="rider-order-card__actions">
        <button className="rider-btn rider-btn--accept" onClick={handleAccept} disabled={accepting}>
          <CheckCircle size={16} /> {accepting ? 'Accepting...' : 'Accept Delivery'}
        </button>
      </div>
    </div>
  );
}

function ActiveOrderCard({ order, onPickedUp, onDelivered }: {
  order: Order;
  onPickedUp: (id: string) => void;
  onDelivered: (id: string) => void;
}) {
  const isPreparing = order.status === 'preparing';
  const isOutForDelivery = order.status === 'out-for-delivery';

  const openNavigation = () => {
    const addr = order.deliveryAddress;
    if (addr?.lat && addr?.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr.lat},${addr.lng}`, '_blank');
    } else if (addr?.fullAddress) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr.fullAddress)}`, '_blank');
    }
  };

  return (
    <div className="rider-order-card rider-order-card--active">
      <div className="rider-order-card__header">
        <strong>#{order.id.slice(-6)}</strong>
        <span className={`rider-order-status ${order.status}`}>
          {order.status.replace(/-/g, ' ').toUpperCase()}
        </span>
      </div>
      <div className="rider-order-card__body">
        <div className="rider-order-card__customer">
          <span>{order.contactName}</span>
          <a href={`tel:${order.contactMobile}`} className="rider-order-card__phone">
            <Phone size={14} /> {order.contactMobile}
          </a>
        </div>
        <div className="rider-order-card__customer">
          <MapPin size={14} />
          <span>{order.deliveryAddress?.fullAddress || 'Address not provided'}</span>
        </div>
        <div className="rider-order-card__items">
          {order.items.map(({ item, quantity }) => (
            <span key={item.id}>{item.name} x{quantity}</span>
          ))}
        </div>
        <div className="rider-order-card__total">
          <strong>₹{order.total}</strong>
          <span>{order.paymentMethod}</span>
        </div>
      </div>
      <div className="rider-order-card__actions">
        {isPreparing && (
          <button className="rider-btn rider-btn--pickup" onClick={() => onPickedUp(order.id)}>
            <Package size={16} /> Picked Up
          </button>
        )}
        {isOutForDelivery && (
          <>
            <button className="rider-btn rider-btn--navigate" onClick={openNavigation}>
              <MapPin size={16} /> Navigate
            </button>
            <button className="rider-btn rider-btn--deliver" onClick={() => onDelivered(order.id)}>
              <CheckCircle size={16} /> Delivered
            </button>
          </>
        )}
      </div>
    </div>
  );
}
