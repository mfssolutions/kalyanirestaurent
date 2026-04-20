import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ChefHat, Truck, CheckCircle, Clock, Phone, Download, ArrowLeft, MapPin, Navigation, XCircle } from 'lucide-react';
import { useOrders } from '../contexts/OrderContext';
import type { Order, OrderStatus } from '../types';
import { getRoute, formatETA, interpolateAlongRoute, type RouteResult } from '../lib/routing';
import 'leaflet/dist/leaflet.css';
import './OrderTracking.css';

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'placed', label: 'Order Placed', icon: <Package size={20} /> },
  { key: 'accepted', label: 'Order Accepted', icon: <CheckCircle size={20} /> },
  { key: 'preparing', label: 'Preparing', icon: <ChefHat size={20} /> },
  { key: 'out-for-delivery', label: 'Rider on the Way', icon: <Truck size={20} /> },
  { key: 'delivered', label: 'Delivered', icon: <CheckCircle size={20} /> },
];

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentOrder, getOrderById, setCurrentOrder } = useOrders();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const traveledLineRef = useRef<L.Polyline | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [riderProgress, setRiderProgress] = useState(0);  // 0 to 1
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (orderId) {
      const found = getOrderById(orderId);
      if (found) {
        setCurrentOrder(found);
        setOrder(found);
      }
    }
  }, [orderId, getOrderById, setCurrentOrder]);

  useEffect(() => {
    if (currentOrder) setOrder(currentOrder);
  }, [currentOrder]);

  // Fetch OSRM route when out-for-delivery
  useEffect(() => {
    if (!order?.riderLocation || !order?.customerLocation) return;
    if (order.status !== 'out-for-delivery') return;

    getRoute(order.riderLocation, order.customerLocation).then(result => {
      if (result) {
        setRoute(result);
        setEtaSeconds(result.duration);
        startTimeRef.current = Date.now();
        setRiderProgress(0);
      }
    });
  }, [order?.status === 'out-for-delivery' ? order.id : null]);

  // Animate rider along route
  useEffect(() => {
    if (!route || order?.status !== 'out-for-delivery') return;

    const totalDurationMs = route.duration * 1000;
    // Speed up simulation: compress real delivery time to ~2 minutes for demo
    const simDurationMs = Math.min(totalDurationMs, 120_000);

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const fraction = Math.min(elapsed / simDurationMs, 1);
      setRiderProgress(fraction);

      // Update ETA countdown
      const remainingSec = Math.max(0, route.duration * (1 - fraction));
      setEtaSeconds(remainingSec);

      // Move rider marker
      if (riderMarkerRef.current && route.coordinates.length > 0) {
        const pos = interpolateAlongRoute(route.coordinates, fraction);
        riderMarkerRef.current.setLatLng(pos);

        // Update the traveled portion of the route
        if (traveledLineRef.current) {
          const traveledIdx = Math.floor(fraction * (route.coordinates.length - 1));
          const traveledCoords = route.coordinates.slice(0, traveledIdx + 1);
          traveledCoords.push(pos);
          traveledLineRef.current.setLatLngs(traveledCoords);
        }
      }

      if (fraction < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [route, order?.status]);

  // Initialize map
  const initMap = useCallback(() => {
    if (!order || !mapRef.current || mapInstanceRef.current) return;
    if (!order.customerLocation || !order.riderLocation) return;

    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      const map = L.map(mapRef.current).setView(
        [order.customerLocation!.lat, order.customerLocation!.lng], 14
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      // Restaurant / Rider start marker
      const riderIcon = L.divIcon({
        className: 'custom-marker rider-marker',
        html: '<div class="marker-dot rider">🏍️</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const riderMarker = L.marker(
        [order.riderLocation!.lat, order.riderLocation!.lng],
        { icon: riderIcon, zIndexOffset: 1000 }
      ).addTo(map).bindPopup('Delivery Rider');

      // Customer marker
      const customerIcon = L.divIcon({
        className: 'custom-marker customer-marker',
        html: '<div class="marker-dot customer">📍</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker(
        [order.customerLocation!.lat, order.customerLocation!.lng],
        { icon: customerIcon }
      ).addTo(map).bindPopup('Your Location');

      // Route line (drawn when route is fetched)
      const routeLine = L.polyline([], {
        color: '#0d3b1e',
        weight: 4,
        opacity: 0.3,
        dashArray: '8, 12',
      }).addTo(map);

      const traveledLine = L.polyline([], {
        color: '#fc8019',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

      mapInstanceRef.current = map;
      riderMarkerRef.current = riderMarker;
      routeLineRef.current = routeLine;
      traveledLineRef.current = traveledLine;

      // Fit bounds
      const bounds = L.latLngBounds(
        [order.customerLocation!.lat, order.customerLocation!.lng],
        [order.riderLocation!.lat, order.riderLocation!.lng]
      );
      map.fitBounds(bounds.pad(0.3));
    });
  }, [order?.id, order?.riderLocation, order?.customerLocation]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        riderMarkerRef.current = null;
        routeLineRef.current = null;
        traveledLineRef.current = null;
      }
    };
  }, [initMap]);

  // Draw route on map when route data is available
  useEffect(() => {
    if (!route || !routeLineRef.current || !mapInstanceRef.current) return;
    routeLineRef.current.setLatLngs(route.coordinates);

    // Fit map to route
    import('leaflet').then((L) => {
      if (!mapInstanceRef.current) return;
      const bounds = L.latLngBounds(route.coordinates);
      mapInstanceRef.current.fitBounds(bounds.pad(0.15));
    });
  }, [route]);

  // Update rider marker from realtime Supabase updates (when not animating)
  useEffect(() => {
    if (!order?.riderLocation || !riderMarkerRef.current) return;
    // Only update from external source if we're NOT doing local animation
    if (route && order.status === 'out-for-delivery') return;
    riderMarkerRef.current.setLatLng([order.riderLocation.lat, order.riderLocation.lng]);
  }, [order?.riderLocation]);

  const downloadReceipt = () => {
    if (!order) return;
    const receipt = generateReceiptHTML(order);
    const blob = new Blob([receipt], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${order.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!order) {
    return (
      <div className="tracking-empty">
        <h2>Order not found</h2>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const statusIdx = order.status === 'rejected' ? -1 : STATUS_STEPS.findIndex(s => s.key === order.status);
  const isDelivery = order.status === 'out-for-delivery';
  const isRejected = order.status === 'rejected';

  return (
    <div className="tracking">
      <button className="tracking__back" onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back to Home
      </button>

      <div className="tracking__header">
        <div>
          <h1>Order #{order.id}</h1>
          <p className="tracking__time">
            <Clock size={14} /> Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {etaSeconds != null && isDelivery && (
              <span className="tracking__eta">
                <Navigation size={14} /> ETA: {formatETA(etaSeconds)}
              </span>
            )}
            {!isDelivery && order.estimatedDelivery && <> · ETA: {order.estimatedDelivery}</>}
          </p>
        </div>
        <button className="tracking__receipt-btn" onClick={downloadReceipt}>
          <Download size={16} /> Receipt
        </button>
      </div>

      {isRejected && (
        <div className="tracking__rejected">
          <XCircle size={24} />
          <div>
            <h3>Order Cancelled</h3>
            <p>{order.rejectionReason ? `Reason: ${order.rejectionReason}` : 'Your order has been cancelled by the restaurant.'}</p>
            <p>Sorry for the inconvenience.</p>
          </div>
        </div>
      )}

      {!isRejected && (
      <div className="tracking__status-bar">
        {STATUS_STEPS.map((step, i) => (
          <div key={step.key} className={`tracking__step ${i <= statusIdx ? 'active' : ''} ${i === statusIdx ? 'current' : ''}`}>
            <div className="tracking__step-icon">{step.icon}</div>
            <span className="tracking__step-label">{step.label}</span>
            {i < STATUS_STEPS.length - 1 && <div className={`tracking__step-line ${i < statusIdx ? 'active' : ''}`} />}
          </div>
        ))}
      </div>
      )}

      {/* Live ETA Bar for delivery */}
      {isDelivery && route && (
        <div className="tracking__eta-bar">
          <div className="tracking__eta-bar-inner">
            <div className="tracking__eta-progress" style={{ width: `${riderProgress * 100}%` }} />
          </div>
          <div className="tracking__eta-info">
            <span>🏍️ Rider on the way</span>
            <span className="tracking__eta-distance">
              {route.distance > 1000
                ? `${(route.distance * (1 - riderProgress) / 1000).toFixed(1)} km away`
                : `${Math.round(route.distance * (1 - riderProgress))} m away`}
            </span>
          </div>
        </div>
      )}

      <div className="tracking__content">
        <div className="tracking__map-container">
          <h3><MapPin size={18} /> Live Tracking</h3>
          {order.riderLocation && order.customerLocation ? (
            <div ref={mapRef} className="tracking__map" />
          ) : (
            <div className="tracking__map-placeholder">
              <Truck size={40} />
              <p>Map will be available when order is out for delivery</p>
            </div>
          )}
        </div>

        <div className="tracking__details">
          {order.riderName && (
            <div className="tracking__rider">
              <h3>Delivery Partner</h3>
              <div className="tracking__rider-info">
                <div>
                  <p className="tracking__rider-name">{order.riderName}</p>
                  <p className="tracking__rider-phone"><Phone size={14} /> {order.riderPhone}</p>
                </div>
              </div>
            </div>
          )}

          <div className="tracking__order-items">
            <h3>Order Items</h3>
            {order.items.map(({ item, quantity }) => (
              <div className="tracking__item" key={item.id}>
                <span className={item.isVeg ? 'veg-dot' : 'nonveg-dot'}>●</span>
                <span>{item.name} × {quantity}</span>
                <span>₹{item.price * quantity}</span>
              </div>
            ))}
            <div className="tracking__order-total">
              <span>Total (incl. delivery + tax)</span>
              <span>₹{order.total}</span>
            </div>
          </div>

          <div className="tracking__delivery-info">
            <h3>Delivery Address</h3>
            <p>{order.deliveryAddress.fullAddress}</p>
            {order.deliveryNote && <p className="tracking__note">Note: {order.deliveryNote}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function generateReceiptHTML(order: Order): string {
  const itemsHTML = order.items.map(({ item, quantity }) =>
    `<tr><td>${item.name}</td><td style="text-align:center">${quantity}</td><td style="text-align:right">₹${item.price * quantity}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt - ${order.id}</title>
<style>
body{font-family:Arial,sans-serif;max-width:400px;margin:40px auto;padding:20px;color:#333}
h1{text-align:center;color:#0d3b1e;font-size:1.4rem;margin-bottom:4px}
.subtitle{text-align:center;color:#888;font-size:0.85rem}
hr{border:none;border-top:1px dashed #ccc;margin:16px 0}
table{width:100%;border-collapse:collapse;font-size:0.9rem}
td{padding:6px 0}
.total-row{font-weight:bold;font-size:1rem;border-top:2px solid #333;padding-top:10px}
.footer{text-align:center;font-size:0.75rem;color:#999;margin-top:20px}
</style></head><body>
<h1>🍽️ Order Receipt</h1>
<p class="subtitle">Order Receipt</p>
<hr>
<p><strong>Order ID:</strong> ${order.id}</p>
<p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
<p><strong>Payment:</strong> ${order.paymentMethod}${order.paymentId ? ' (' + order.paymentId + ')' : ''}</p>
<hr>
<table>
<tr><th style="text-align:left">Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr>
${itemsHTML}
</table>
<hr>
<table>
<tr><td>Subtotal</td><td style="text-align:right">₹${order.subtotal}</td></tr>
<tr><td>Delivery Fee</td><td style="text-align:right">₹${order.deliveryFee}</td></tr>
<tr><td>Taxes</td><td style="text-align:right">₹${order.taxes}</td></tr>
<tr class="total-row"><td>Total</td><td style="text-align:right">₹${order.total}</td></tr>
</table>
<hr>
<p><strong>Delivery To:</strong> ${order.contactName}</p>
<p>${order.deliveryAddress.fullAddress}</p>
<p><strong>Phone:</strong> ${order.contactMobile}</p>
<div class="footer"><p>Thank you for your order!</p></div>
</body></html>`;
}
