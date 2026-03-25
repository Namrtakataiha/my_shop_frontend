import { useState, useEffect, useRef } from 'react';
import {
  RotateCcw, Package, Clock, CheckCircle, XCircle,
  CreditCard, BadgeCheck, AlertCircle, ChevronDown,
  X, Truck, ArrowRight, ShieldCheck, Zap, Sparkles, Calendar
} from 'lucide-react';
import { getMyOrders, createReturnRequest, getMyReturns, updatePickupDate, requestRefund } from '../utils/api';
import { useToast } from '../components/Toast';
import './Returns.css';

const STATUS_CFG = {
  pending:             { color: '#ff905a', bg: '#fff4ec', icon: <Clock size={13} />,        label: 'Under Review',      step: 1 },
  approved:            { color: '#03a685', bg: '#e6f9f5', icon: <CheckCircle size={13} />,  label: 'Approved',          step: 2 },
  denied:              { color: '#ff3f6c', bg: '#fff0f3', icon: <XCircle size={13} />,      label: 'Denied',            step: -1 },
  pickup_in_progress:  { color: '#5c6bc0', bg: '#eef2ff', icon: <Truck size={13} />,        label: 'Pickup In Progress',step: 3 },
  completed:           { color: '#03a685', bg: '#e6f9f5', icon: <BadgeCheck size={13} />,   label: 'Completed',         step: 4 },
};

const REFUND_CFG = {
  none:      null,
  pending:   { color: '#ff905a', bg: '#fff4ec', label: 'Refund Pending',   icon: <CreditCard size={12} /> },
  processed: { color: '#03a685', bg: '#e6f9f5', label: 'Refund Processed', icon: <BadgeCheck size={12} /> },
};

const REASONS = [
  { label: 'Wrong item received', emoji: '📦' },
  { label: 'Damaged product',     emoji: '💔' },
  { label: 'Not as described',    emoji: '🔍' },
  { label: 'Changed my mind',     emoji: '🤔' },
  { label: 'Quality issue',       emoji: '⚠️' },
];

const FLOW_STEPS = [
  { icon: '🛍️', label: 'Request',   },
  // { icon: '🔍', label: 'Review',    },
  { icon: '✅', label: 'Approved'},
  { icon: '🚚', label: 'Pickup',    },
  { icon: '💰', label: 'Refund',  },
];

export default function Returns() {
  const toast = useToast();
  const [tab, setTab] = useState('request');
  const [returns, setReturns] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeItem, setActiveItem] = useState(null); // { product_id, product_name, product_image, order_id, order_number, quantity, price }
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successKey, setSuccessKey] = useState(null);
  const reasonRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.allSettled([getMyReturns(), getMyOrders()])
      .then(([rRes, oRes]) => {
        if (rRes.status === 'fulfilled') setReturns(rRes.value.data || []);
        if (oRes.status === 'fulfilled') {
          const orders = (oRes.value.data || []).filter(o => o.order_status === 'delivered');
          setDeliveredOrders(orders);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (activeItem && reasonRef.current) {
      setTimeout(() => reasonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
  }, [activeItem]);

  // Build a set of "order_id:product_id" that already have active return requests
  const requestedKeys = new Set(
    returns
      .filter(r => r.status !== 'denied')
      .map(r => `${r.order}:${r.product}`)
  );

  const handleSubmit = async () => {
    if (!reason.trim()) { toast('Please select or enter a reason', 'warning'); return; }
    setSubmitting(true);
    try {
      await createReturnRequest({
        order_id: activeItem.order_id,
        product_id: activeItem.product_id,
        reason,
      });
      const key = `${activeItem.order_id}:${activeItem.product_id}`;
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 3000);
      toast('Return request submitted! Seller will review it soon.', 'success');
      setActiveItem(null);
      setReason('');
      load();
      setTimeout(() => setTab('status'), 800);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit return request', 'error');
    } finally { setSubmitting(false); }
  };

  const handleUpdatePickup = async (id, date) => {
    try {
      await updatePickupDate(id, { pickup_date: new Date(date).toISOString() });
      toast('Pickup date updated!', 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update pickup date', 'error');
    }
  };

  const handleRequestRefund = async (id) => {
    try {
      await requestRefund(id);
      toast('Refund request initiated!', 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to request refund', 'error');
    }
  };

  const pendingApproved = returns.filter(r => ['pending', 'approved', 'pickup_in_progress'].includes(r.status));
  const refundList      = returns.filter(r => r.status === 'completed' || r.refund_status === 'processed' || r.refund_status === 'pending');

  const TABS = [
    { key: 'request', label: 'Request Return', icon: <RotateCcw size={15} />,   count: null },
    { key: 'status',  label: 'Status',          icon: <Clock size={15} />,       count: pendingApproved.length || null },
    { key: 'refund',  label: 'Refund',           icon: <CreditCard size={15} />, count: refundList.length || null },
  ];

  if (loading) return (
    <div className="returns-page">
      <div className="returns-loading">
        <div className="returns-loading-spinner"><RotateCcw size={32} className="spin-icon" /></div>
        <p>Loading your returns...</p>
      </div>
    </div>
  );

  return (
    <div className="returns-page">
      <div className="returns-bg-blob blob-1" />
      <div className="returns-bg-blob blob-2" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <div className="returns-hero">
          <div className="returns-hero-content">
            <div className="returns-hero-badge"><ShieldCheck size={14} /> 7-Day Easy Returns</div>
            <h1 className="returns-hero-title">Returns <span className="returns-hero-accent">&amp;</span> Refunds</h1>
            <p className="returns-hero-sub">Hassle-free returns on all delivered orders within 7 days</p>
            <div className="returns-hero-stats">
              <div className="returns-hero-stat"><Zap size={14} /> <span>Fast Processing</span></div>
              <div className="returns-hero-stat"><ShieldCheck size={14} /> <span>Secure Refunds</span></div>
              <div className="returns-hero-stat"><Sparkles size={14} /> <span>No Questions Asked</span></div>
            </div>
          </div>
          <div className="returns-hero-visual">
            <div className="returns-hero-circle c1" />
            <div className="returns-hero-circle c2" />
            <div className="returns-hero-icon-wrap">↩️</div>
          </div>
        </div>

        {/* Flow */}
        <div className="returns-flow">
          {FLOW_STEPS.map((s, i) => (
            <div key={i} className="returns-flow-item">
              <div className="returns-flow-icon">{s.icon}</div>
              <div className="returns-flow-label">{s.label}</div>
              <div className="returns-flow-desc">{s.desc}</div>
              {i < FLOW_STEPS.length - 1 && <ArrowRight size={14} className="returns-flow-arrow" />}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="returns-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`returns-tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.icon}
              <span>{t.label}</span>
              {t.count > 0 && <span className={`returns-tab-badge ${t.key === 'refund' ? 'green' : ''}`}>{t.count}</span>}
            </button>
          ))}
          <div className="returns-tab-indicator" />
        </div>

        {/* TAB 1: Request Return — shows delivered orders + their products */}
        {tab === 'request' && (
          <div className="tab-content-enter">
            {deliveredOrders.length === 0 ? (
              <EmptyState icon="📦" title="No delivered orders" desc="You can only return products from delivered orders within 7 days of delivery." />
            ) : (
              deliveredOrders.map(order => (
                <div key={order.id} className="returns-order-group">
                  <div className="returns-order-label">
                    <Package size={13} /> Order #{order.order_number}
                    <span className="returns-order-date">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="returns-product-list">
                    {(order.items || []).map((item, idx) => {
                      const key = `${order.id}:${item.product_id}`;
                      const alreadyRequested = requestedKeys.has(key);
                      const isActive = activeItem?.order_id === order.id && activeItem?.product_id === item.product_id;
                      const isSuccess = successKey === key;
                      return (
                        <div
                          key={key}
                          className={`returns-product-card ${isActive ? 'active' : ''} ${isSuccess ? 'success-flash' : ''}`}
                          style={{ animationDelay: `${idx * 0.06}s` }}
                        >
                          <div className="returns-product-row">
                            <div className="returns-product-img">
                              {item.product_image
                                ? <img src={item.product_image} alt={item.product_name} />
                                : <Package size={26} style={{ color: '#ccc' }} />
                              }
                              {alreadyRequested && <div className="returns-img-overlay"><CheckCircle size={18} /></div>}
                            </div>
                            <div className="returns-product-info">
                              <div className="returns-product-name">{item.product_name}</div>
                              <div className="returns-product-meta">
                                <span>Qty {item.quantity}</span>
                                <span className="dot">·</span>
                                <span>₹{parseFloat(item.price).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            {alreadyRequested ? (
                              <div className="returns-requested-badge"><CheckCircle size={13} /> Requested</div>
                            ) : (
                              <button
                                className={`returns-return-btn ${isActive ? 'cancel' : ''}`}
                                onClick={() => {
                                  if (isActive) { setActiveItem(null); setReason(''); }
                                  else { setActiveItem({ ...item, order_id: order.id, order_number: order.order_number }); setReason(''); }
                                }}
                              >
                                {isActive ? <><X size={13} /> Cancel</> : <><RotateCcw size={13} /> Return</>}
                              </button>
                            )}
                          </div>

                          {isActive && (
                            <div className="returns-reason-panel" ref={reasonRef}>
                              <div className="returns-reason-title">Why are you returning <strong>{item.product_name}</strong>?</div>
                              <div className="return-reason-chips">
                                {REASONS.map(r => (
                                  <button key={r.label} type="button" onClick={() => setReason(r.label)}
                                    className={`return-reason-chip ${reason === r.label ? 'selected' : ''}`}>
                                    <span className="chip-emoji">{r.emoji}</span> {r.label}
                                  </button>
                                ))}
                              </div>
                              <textarea
                                className="form-input returns-textarea"
                                rows={2}
                                placeholder="Or describe in your own words..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                              />
                              <div className="returns-reason-actions">
                                <button className="btn btn-ghost btn-sm" onClick={() => { setActiveItem(null); setReason(''); }}>
                                  <X size={13} /> Cancel
                                </button>
                                <button
                                  className="btn btn-primary btn-sm returns-submit-btn"
                                  onClick={handleSubmit}
                                  disabled={submitting || !reason.trim()}
                                >
                                  {submitting
                                    ? <><span className="spinner spinner-sm" /> Submitting...</>
                                    : <><RotateCcw size={13} /> Submit Request</>
                                  }
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: Status */}
        {tab === 'status' && (
          <div className="tab-content-enter">
            {pendingApproved.length === 0 ? (
              <EmptyState icon="📋" title="No active requests" desc="Your pending and approved return requests will appear here." />
            ) : (
              <div className="returns-list">
                {pendingApproved.map((r, i) => (
                  <ReturnCard
                    key={r.id} r={r} i={i}
                    expanded={expanded} setExpanded={setExpanded}
                    onUpdatePickup={handleUpdatePickup}
                    onRequestRefund={handleRequestRefund}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Refund */}
        {tab === 'refund' && (
          <div className="tab-content-enter">
            {refundList.length === 0 ? (
              <EmptyState icon="💰" title="No refunds yet" desc="Completed returns and refund status will appear here." />
            ) : (
              <div className="returns-list">
                {refundList.map((r, i) => (
                  <ReturnCard
                    key={r.id} r={r} i={i}
                    expanded={expanded} setExpanded={setExpanded}
                    onUpdatePickup={handleUpdatePickup}
                    onRequestRefund={handleRequestRefund}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function ReturnCard({ r, i, expanded, setExpanded, onUpdatePickup, onRequestRefund }) {
  const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
  const refundCfg = REFUND_CFG[r.refund_status || 'none'];
  const isOpen = expanded === r.id;
  const [pickupInput, setPickupInput] = useState('');
  const [pickupUpdating, setPickupUpdating] = useState(false);
  const [refundRequesting, setRefundRequesting] = useState(false);

  const STEPS = ['Requested', 'Under Review', 'Approved', 'Pickup', 'Refunded'];
  const step = cfg.step;

  const handlePickup = async () => {
    if (!pickupInput) return;
    setPickupUpdating(true);
    await onUpdatePickup(r.id, pickupInput);
    setPickupUpdating(false);
  };

  const handleRefund = async () => {
    setRefundRequesting(true);
    await onRequestRefund(r.id);
    setRefundRequesting(false);
  };

  // Serializer returns product/order as IDs
  const productName = r.product_name || `Product #${r.product}`;
  const productImage = r.product_image || null;
  const orderNum = r.order_number || (r.order ? `#${r.order}` : null);

  return (
    <div className="return-card" style={{ animationDelay: `${i * 0.07}s` }}>
      <div className="return-card-main" onClick={() => setExpanded(isOpen ? null : r.id)}>
        <div className="return-card-img">
          {productImage
            ? <img src={productImage} alt={productName} />
            : <Package size={22} style={{ color: '#ccc' }} />
          }
        </div>
        <div className="return-card-info">
          <div className="return-product-name">{productName}</div>
          <div className="return-date">
            {new Date(r.request_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {orderNum && <div className="return-order-num">Order {orderNum}</div>}
        </div>
        <div className="return-card-right">
          <span className="return-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.icon} {cfg.label}
          </span>
          {refundCfg && (
            <span className="return-status-badge" style={{ color: refundCfg.color, background: refundCfg.bg }}>
              {refundCfg.icon} {refundCfg.label}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`return-chevron ${isOpen ? 'open' : ''}`} />
      </div>

      {/* Progress */}
      {r.status !== 'denied' && (
        <div className="return-progress">
          {STEPS.map((s, idx) => (
            <div key={s} className={`rp-step ${idx <= step ? 'done' : ''} ${idx === step ? 'active' : ''}`}>
              <div className="rp-dot">{idx < step ? '✓' : idx === step ? <span className="rp-pulse" /> : null}</div>
              <span className="rp-label">{s}</span>
              {idx < STEPS.length - 1 && <div className={`rp-line ${idx < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Expanded */}
      {isOpen && (
        <div className="return-card-detail">
          <div className="return-detail-grid">
            <div className="return-detail-item">
              <span className="rdl">Reason</span>
              <span className="rdv">"{r.reason}"</span>
            </div>
            <div className="return-detail-item">
              <span className="rdl">Status</span>
              <span className="rdv" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            {r.pickup_date && (
              <div className="return-detail-item">
                <span className="rdl">Pickup Date</span>
                <span className="rdv pickup-date">
                  📅 {new Date(r.pickup_date).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {r.refund_status && r.refund_status !== 'none' && (
              <div className="return-detail-item">
                <span className="rdl">Refund</span>
                <span className="rdv" style={{ color: refundCfg?.color }}>{refundCfg?.label || '—'}</span>
              </div>
            )}
          </div>

          {/* Customer action: set pickup date when approved */}
          {r.status === 'approved' && (
            <div className="return-info-box teal">
              <Calendar size={14} />
              <div style={{ flex: 1 }}>
                <strong>Set Your Pickup Date</strong>
                <div style={{ fontSize: 12, marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="datetime-local"
                    className="form-input"
                    style={{ flex: 1, minWidth: 180, fontSize: 12, padding: '6px 10px' }}
                    value={pickupInput}
                    onChange={e => setPickupInput(e.target.value)}
                    min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                  />
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handlePickup}
                    disabled={!pickupInput || pickupUpdating}
                  >
                    {pickupUpdating ? <span className="spinner spinner-sm" /> : <><Calendar size={12} /> Confirm</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Customer action: request refund when pickup in progress */}
          {r.status === 'pickup_in_progress' && r.refund_status === 'none' && (
            <div className="return-info-box orange">
              <Truck size={14} />
              <div style={{ flex: 1 }}>
                <strong>Pickup In Progress</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>Once the item is collected, request your refund.</div>
                <button
                  className="btn btn-sm btn-primary"
                  style={{ marginTop: 8 }}
                  onClick={handleRefund}
                  disabled={refundRequesting}
                >
                  {refundRequesting ? <span className="spinner spinner-sm" /> : <><CreditCard size={12} /> Request Refund</>}
                </button>
              </div>
            </div>
          )}

          {r.status === 'denied' && (
            <div className="return-info-box red">
              <AlertCircle size={14} /> Your return request was not approved. Contact support for help.
            </div>
          )}
          {r.status === 'completed' && r.refund_status === 'processed' && (
            <div className="return-info-box green">
              <BadgeCheck size={16} />
              <div>
                <strong>Refund Processed!</strong>
                <div style={{ fontSize: 12, marginTop: 2 }}>Your refund has been processed to your original payment method.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="returns-empty">
      <div className="returns-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
