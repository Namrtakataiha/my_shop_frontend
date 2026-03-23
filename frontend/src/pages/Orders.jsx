import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Truck, CheckCircle, XCircle, ShoppingBag, ChevronDown, ChevronUp, Star, RotateCcw } from 'lucide-react';
import { getMyOrders } from '../utils/api';
import './Orders.css';

const STATUS = {
  pending:    { icon: <Clock size={14} />,       color: 'warning', label: 'Pending',    step: 0 },
  processing: { icon: <Package size={14} />,     color: 'info',    label: 'Processing', step: 1 },
  shipped:    { icon: <Truck size={14} />,        color: 'primary', label: 'Shipped',    step: 2 },
  delivered:  { icon: <CheckCircle size={14} />, color: 'success', label: 'Delivered',  step: 3 },
  cancelled:  { icon: <XCircle size={14} />,     color: 'danger',  label: 'Cancelled',  step: -1 },
};
const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    getMyOrders()
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return (
    <div className="orders-page">
      <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header animate-fade">
          <h1><Package size={26} /> My Orders</h1>
          <p>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state animate-fade">
            <ShoppingBag size={72} />
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here</p>
            <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 20 }}>Shop Now</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order, i) => {
              const statusKey = order.order_status || 'pending';
              const cfg = STATUS[statusKey] || STATUS.pending;
              const currentStep = cfg.step;
              const isCancelled = statusKey === 'cancelled';
              const isOpen = expanded[order.order_number];
              const items = order.items || [];

              return (
                <div
                  key={order.order_number}
                  className="order-card animate-fade"
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  {/* ── Header ── */}
                  <div className="order-card-header">
                    <div className="order-meta">
                      <span className="order-number">#{order.order_number}</span>
                      <span className="order-date">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="order-badges">
                      <span className={`badge badge-${cfg.color} badge-with-icon`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className={`badge badge-${order.payment_status === 'success' ? 'success' : 'warning'} badge-with-icon`}>
                        💳 {order.payment_status === 'success' ? 'Paid' : 'COD Pending'}
                      </span>
                    </div>

                    <div className="order-amount-inline">
                      ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                    </div>

                    <button className="order-toggle-btn" onClick={() => toggle(order.order_number)}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* ── Progress tracker ── */}
                  {!isCancelled && (
                    <div className="order-progress">
                      {STEPS.map((s, idx) => {
                        const done = idx <= currentStep;
                        const active = idx === currentStep;
                        return (
                          <div key={s} className={`progress-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                            <div className="progress-dot">
                              {done && idx < currentStep ? '✓' : active ? <span className="progress-pulse" /> : null}
                            </div>
                            <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                            {idx < STEPS.length - 1 && (
                              <div className={`progress-line ${done && idx < currentStep ? 'done' : ''}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isCancelled && (
                    <div className="order-cancelled-bar">
                      <XCircle size={14} /> This order was cancelled
                    </div>
                  )}

                  {/* ── Expandable details ── */}
                  {isOpen && (
                    <div className="order-details animate-fade">
                      {/* Product items */}
                      {items.length > 0 && (
                        <div className="order-items-section">
                          <div className="order-items-label">Items Ordered</div>
                          {items.map(item => (
                            <div key={item.id} className="order-item-row">
                              {/* Product image or placeholder */}
                              <div className="order-item-img">
                                {item.product_image
                                  ? <img src={item.product_image} alt={item.product_name} />
                                  : <Package size={20} style={{ color: '#ccc' }} />
                                }
                              </div>
                              <div className="order-item-info">
                                <div className="order-item-name">{item.product_name}</div>
                                <div className="order-item-meta">
                                  Qty: {item.quantity} × ₹{parseFloat(item.price).toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div className="order-item-total">
                                ₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}
                              </div>
                              {/* Review link — only for delivered orders */}
                              {statusKey === 'delivered' && item.product_id && (
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                  <Link
                                    to={`/products/${item.product_id}?tab=reviews`}
                                    className="btn btn-sm btn-outline"
                                    style={{ whiteSpace: 'nowrap', fontSize: 11 }}
                                  >
                                    <Star size={11} /> Review
                                  </Link>
                                  <Link
                                    to={`/returns?product_id=${item.product_id}`}
                                    className="btn btn-sm"
                                    style={{ whiteSpace: 'nowrap', fontSize: 11, background: '#fff0f3', color: '#ff3f6c', border: '1px solid #ffccd8', borderRadius: 6 }}
                                  >
                                    <RotateCcw size={11} /> Return
                                  </Link>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Order meta */}
                      <div className="order-detail-rows">
                        <div className="order-detail-row">
                          <span>Shipping Address</span>
                          <strong>{order.shipping_address || '—'}</strong>
                        </div>
                        <div className="order-detail-row">
                          <span>Payment</span>
                          <strong>Cash on Delivery</strong>
                        </div>
                        <div className="order-detail-row total-row">
                          <span>Total</span>
                          <strong>₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
