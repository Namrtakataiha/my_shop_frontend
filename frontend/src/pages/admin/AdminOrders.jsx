import { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, RefreshCw, ChevronDown, ChevronUp, Package, User } from 'lucide-react';
import { getAdminOrders, updateOrderStatus, getAllPayments, updatePaymentStatus } from '../../utils/api';
import { useToast } from '../../components/Toast';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors = { pending: 'warning', processing: 'info', shipped: 'primary', delivered: 'success', cancelled: 'danger' };

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [oRes, pRes] = await Promise.allSettled([getAdminOrders(), getAllPayments()]);
      if (oRes.status === 'fulfilled') {
        const data = Array.isArray(oRes.value.data) ? oRes.value.data : [];
        setOrders(data);
      }
      if (pRes.status === 'fulfilled') {
        const data = Array.isArray(pRes.value.data) ? pRes.value.data : [];
        setPayments(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      toast(`Order updated to "${newStatus}". Email sent via Celery!`, 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  const handlePaymentUpdate = async (orderId) => {
    try {
      await updatePaymentStatus(orderId);
      toast('Payment marked as paid! Notification sent.', 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><ShoppingCart size={22} /> Orders & Payments</h1>
        <button onClick={load} className="btn btn-outline btn-sm"><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="tab-nav" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
          Orders ({orders.length})
        </button>
        <button className={`tab-btn ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>
          Payments ({payments.length})
        </button>
      </div>

      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <>
          {/* ── Orders tab ── */}
          {tab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>No orders for your products yet</p>
                </div>
              ) : orders.map((o, i) => {
                const isOpen = expanded[o.id];
                // customer name: try user_name, username, or fallback to user field
                const customerName = o.user_name || o.username || (typeof o.user === 'string' ? o.user : `Customer #${o.user}`);
                const customerEmail = o.user_email || '';

                return (
                  <div key={o.id} className="order-admin-card animate-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                    {/* Card header */}
                    <div className="order-admin-header">
                      <div className="order-admin-meta">
                        <span className="order-number" style={{ fontSize: 14, fontWeight: 800 }}>#{o.order_number}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                          {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Customer info */}
                      <div className="order-admin-customer">
                        <div className="customer-avatar">{customerName?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#282c3f' }}>{customerName}</div>
                          {customerEmail && <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{customerEmail}</div>}
                        </div>
                      </div>

                      <strong style={{ color: '#ff3f6c', fontSize: 16, whiteSpace: 'nowrap' }}>
                        ₹{parseFloat(o.total_amount).toLocaleString('en-IN')}
                      </strong>

                      <span className={`badge badge-${statusColors[o.status] || 'info'}`}>
                        {o.status?.charAt(0).toUpperCase() + o.status?.slice(1)}
                      </span>

                      {/* Status selector */}
                      <select
                        className="status-select"
                        value={o.status}
                        onChange={e => handleStatusChange(o.id, e.target.value)}
                        style={{ minWidth: 130 }}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>

                      <button className="order-toggle-btn" onClick={() => toggle(o.id)}>
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>

                    {/* Expanded: order items */}
                    {isOpen && (
                      <div className="order-admin-items animate-fade">
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-light)', marginBottom: 10 }}>
                          Order Items
                        </div>
                        {o.items && o.items.length > 0 ? (
                          o.items.map(item => (
                            <div key={item.id} className="order-admin-item-row">
                              <div style={{ width: 40, height: 40, background: '#f5f5f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={18} style={{ color: '#ccc' }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.product_name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Qty: {item.quantity}</div>
                              </div>
                              <strong style={{ color: '#ff3f6c', fontSize: 13 }}>
                                ₹{parseFloat(item.price * item.quantity).toLocaleString('en-IN')}
                              </strong>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: 13, color: 'var(--text-light)' }}>No item details available</p>
                        )}

                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: 'var(--text-light)' }}>Shipping Address</span>
                            <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{o.shipping_address || '—'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: 'var(--text-light)' }}>Customer</span>
                            <strong>{customerName}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Payments tab ── */}
          {tab === 'payments' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Payment</th>
                    <th>Order Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>No payments found</td></tr>
                  ) : payments.map(p => (
                    <tr key={p.order_id}>
                      <td><strong>#{p.order_number}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="customer-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {p.customer?.[0]?.toUpperCase()}
                          </div>
                          {p.customer}
                        </div>
                      </td>
                      <td><strong style={{ color: '#ff3f6c' }}>₹{parseFloat(p.total_amount).toLocaleString('en-IN')}</strong></td>
                      <td><span className="badge badge-info">{p.payment_method?.toUpperCase()}</span></td>
                      <td>
                        <span className={`badge badge-${p.payment_status === 'success' ? 'success' : 'warning'}`}>
                          {p.payment_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${statusColors[p.order_status] || 'info'}`}>
                          {p.order_status}
                        </span>
                      </td>
                      <td>
                        {p.payment_status !== 'success' && (
                          <button onClick={() => handlePaymentUpdate(p.order_id)} className="btn btn-sm btn-success">
                            <CreditCard size={12} /> Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
