import { useState, useEffect, useRef } from 'react';
import {
  RotateCcw, Package, Clock, CheckCircle, XCircle,
  CreditCard, BadgeCheck, AlertCircle, ChevronDown,
  X, Truck, ArrowRight, Sparkles, ShieldCheck, Zap
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { createReturnRequest, getMyReturns, getMyOrders } from '../utils/api';
import { useToast } from '../components/Toast';
import './Returns.css';

const STATUS_CFG = {
  pending:   { color: '#ff905a', bg: '#fff4ec', icon: <Clock size={13} />,        label: 'Under Review', step: 1 },
  approved:  { color: '#03a685', bg: '#e6f9f5', icon: <CheckCircle size={13} />,  label: 'Approved',     step: 2 },
  denied:    { color: '#ff3f6c', bg: '#fff0f3', icon: <XCircle size={13} />,      label: 'Denied',       step: -1 },
  completed: { color: '#5c6bc0', bg: '#eef2ff', icon: <BadgeCheck size={13} />,   label: 'Completed',    step: 4 },
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
  { icon: '🛍️', label: 'Request',  desc: 'Submit return' },
  { icon: '🔍', label: 'Review',   desc: 'Seller reviews' },
  { icon: '✅', label: 'Approved', desc: 'Pickup scheduled' },
  { icon: '💰', label: 'Refund',   desc: 'Money returned' },
];

export default function Returns() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('request');
  const [returns, setReturns] = useState([]);
  const [deliveredItems, setDeliveredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successItem, setSuccessItem] = useState(null);
  const reasonRef = useRef(null);

  const load = () => {
    setLoading(true);
    Promise.allSettled([getMyReturns(), getMyOrders()])
      .then(([rRes, oRes]) => {
        if (rRes.status === 'fulfilled') setReturns(rRes.value.data || []);
        if (oRes.status === 'fulfilled') {
          const items = [];
          (oRes.value.data || []).forEach(order => {
            if (order.order_status !== 'delivered') return;
            (order.items || []).forEach(item => {
              const key = `${item.product_id}_${order.id}`;
              if (!items.find(i => i._key === key)) {
                items.push({ ...item, order_id: order.id, order_number: order.order_number, _key: key });
              }
            });
          });
          setDeliveredItems(items);
          const pid = searchParams.get('product_id');
          if (pid) {
            const found = items.find(i => String(i.product_id) === String(pid));
            if (found) { setActiveItem(found); setTab('request'); }
          }
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

  const openReason = (item) => { setActiveItem(item); setReason(''); };
  const closeReason = () => { setActiveItem(null); setReason(''); };

  const handleSubmit = async () => {
    if (!reason.trim()) { toast('Please select or enter a reason', 'warning'); return; }
    setSubmitting(true);
    try {
      await createReturnRequest(activeItem.product_id, { reason });
      setSuccessItem(activeItem._key);
      setTimeout(() => setSuccessItem(null), 3000);
      toast('Return request submitted! Seller will review it soon.', 'success');
      closeReason();
      load();
      setTimeout(() => setTab('approved'), 800);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit return request', 'error');
    } finally { setSubmitting(false); }
  };

  const requestedProductIds = new Set(
    returns.filter(r => r.status !== 'denied').map(r => String(r.product_id))
  );

  const pendingApproved = returns.filter(r => r.status === 'pending' || r.status === 'approved');
  const refundList      = returns.filter(r => r.status === 'completed' || r.refund_status === 'processed');

  const TABS = [
    { key: 'request',  label: 'Request Return', icon: <RotateCcw size={15} />,   count: null },
    { key: 'approved', label: 'Status',          icon: <CheckCircle size={15} />, count: pendingApproved.length },
    { key: 'refund',   label: 'Refund',          icon: <CreditCard size={15} />,  count: refundList.length },
  ];

  if (loading) return (
    <div className="returns-page">
      <div className="returns-loading">
        <div className="returns-loading-spinner">
          <RotateCcw size={32} className="spin-icon" />
        </div>
        <p>Loading your returns...</p>
      </div>
    </div>
  );

  return (
    <div className="returns-page">
      {/* Animated background blobs */}
      <div className="returns-bg-blob blob-1" />
      <div className="returns-bg-blob blob-2" />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Hero ── */}
        <div className="returns-hero">
          <div className="returns-hero-content">
            <div className="returns-hero-badge">
              <ShieldCheck size={14} /> 7-Day Easy Returns
            </div>
            <h1 className="returns-hero-title">
              Returns <span className="returns-hero-accent">&amp;</span> Refunds
            </h1>
            <p className="returns-hero-sub">
              Hassle-free returns on all delivered orders within 7 days
            </p>
            <div className="returns-hero-stats">
              <div className="returns-hero-stat">
                <Zap size={14} /> <span>Fast Processing</span>
              </div>
              <div className="returns-hero-stat">
                <ShieldCheck size={14} /> <span>Secure Refunds</span>
              </div>
              <div className="returns-hero-stat">
                <Sparkles size={14} /> <span>No Questions Asked</span>
              </div>
            </div>
          </div>
          <div className="returns-hero-visual">
            <div className="returns-hero-circle c1" />
            <div className="returns-hero-circle c2" />
            <div className="returns-hero-icon-wrap">↩️</div>
          </div>
        </div>

        {/* ── Flow steps ── */}
        <div className="returns-flow">
          {FLOW_STEPS.map((s, i) => (
            <div key={i} className="returns-flow-item">
              <div className="returns-flow-icon">{s.icon}</div>
              <div className="returns-flow-label">{s.label}</div>
              <div className="returns-flow-desc">{s.desc}</div>
              {i < FLOW_STEPS.length - 1 && (
                <ArrowRight size={14} className="returns-flow-arrow" />
              )}
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="returns-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`returns-tab-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className={`returns-tab-badge ${t.key === 'refund' ? 'green' : ''}`}>{t.count}</span>
              )}
            </button>
          ))}
          <div
            className="returns-tab-indicator"
            style={{ '--tab-index': TABS.findIndex(t => t.key === tab) }}
          />
        </div>

        {/* ── TAB 1: Request Return ── */}
        {tab === 'request' && (
          <div className="tab-content-enter">
            {deliveredItems.length === 0 ? (
              <EmptyState
                icon="📦"
                title="No delivered orders"
                desc="You can only return products from delivered orders within 7 days of delivery."
              />
            ) : (
              <>
                <div className="returns-section-header">
                  <div className="returns-section-title">
                    <Package size={16} /> Delivered Products
                    <span className="returns-count-pill">{deliveredItems.length}</span>
                  </div>
                  <p className="returns-section-hint">Click "Return" on any product to start a return request</p>
                </div>
                <div className="returns-product-list">
                  {deliveredItems.map((item, idx) => {
                    const alreadyRequested = requestedProductIds.has(String(item.product_id));
                    const isActive = activeItem?._key === item._key;
                    const isSuccess = successItem === item._key;
                    return (
                      <div
                        key={item._key}
                        className={`returns-product-card ${isActive ? 'active' : ''} ${isSuccess ? 'success-flash' : ''}`}
                        style={{ animationDelay: `${idx * 0.07}s` }}
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
                              <span>Order #{item.order_number}</span>
                              <span className="dot">·</span>
                              <span>Qty {item.quantity}</span>
                            </div>
                            <div className="returns-product-price">
                              ₹{parseFloat(item.price).toLocaleString('en-IN')}
                            </div>
                          </div>
                          {alreadyRequested ? (
                            <div className="returns-requested-badge">
                              <CheckCircle size={13} /> Return Requested
                            </div>
                          ) : (
                            <button
                              className={`returns-return-btn ${isActive ? 'cancel' : ''}`}
                              onClick={() => isActive ? closeReason() : openReason(item)}
                            >
                              {isActive
                                ? <><X size={13} /> Cancel</>
                                : <><RotateCcw size={13} /> Return</>
                              }
                            </button>
                          )}
                        </div>

                        {/* Inline reason picker */}
                        {isActive && (
                          <div className="returns-reason-panel" ref={reasonRef}>
                            <div className="returns-reason-header">
                              <div className="returns-reason-title">
                                Why are you returning <strong>{item.product_name}</strong>?
                              </div>
                            </div>
                            <div className="return-reason-chips">
                              {REASONS.map(r => (
                                <button
                                  key={r.label}
                                  type="button"
                                  onClick={() => setReason(r.label)}
                                  className={`return-reason-chip ${reason === r.label ? 'selected' : ''}`}
                                >
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
                              <button className="btn btn-ghost btn-sm" onClick={closeReason}>
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
              </>
            )}
          </div>
        )}

        {/* ── TAB 2: Status (Pending + Approved) ── */}
        {tab === 'approved' && (
          <div className="tab-content-enter">
            {pendingApproved.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No active requests"
                desc="Your pending and approved return requests will appear here."
              />
            ) : (
              <>
                <div className="returns-section-header">
                  <div className="returns-section-title">
                    <Clock size={16} /> Active Requests
                    <span className="returns-count-pill">{pendingApproved.length}</span>
                  </div>
                </div>
                <div className="returns-list">
                  {pendingApproved.map((r, i) => (
                    <ReturnCard key={r.id} r={r} i={i} expanded={expanded} setExpanded={setExpanded} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB 3: Refund ── */}
        {tab === 'refund' && (
          <div className="tab-content-enter">
            {refundList.length === 0 ? (
              <EmptyState
                icon="💰"
                title="No refunds yet"
                desc="Completed returns and refund status will appear here."
              />
            ) : (
              <>
                <div className="returns-section-header">
                  <div className="returns-section-title">
                    <CreditCard size={16} /> Refund Status
                    <span className="returns-count-pill green">{refundList.length}</span>
                  </div>
                </div>
                <div className="returns-list">
                  {refundList.map((r, i) => (
                    <ReturnCard key={r.id} r={r} i={i} expanded={expanded} setExpanded={setExpanded} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Return status card ── */
function ReturnCard({ r, i, expanded, setExpanded }) {
  const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
  const refundCfg = REFUND_CFG[r.refund_status || 'none'];
  const isOpen = expanded === r.id;

  const progressStep = cfg.step;

  return (
    <div
      className="return-card"
      style={{ animationDelay: `${i * 0.07}s` }}
    >
      {/* Main clickable row */}
      <div className="return-card-main" onClick={() => setExpanded(isOpen ? null : r.id)}>
        <div className="return-card-img">
          {r.product_image
            ? <img src={r.product_image} alt={r.product_name} />
            : <Package size={22} style={{ color: '#ccc' }} />
          }
        </div>
        <div className="return-card-info">
          <div className="return-product-name">{r.product_name}</div>
          <div className="return-date">
            Requested {new Date(r.request_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {r.order_number && (
            <div className="return-order-num">Order #{r.order_number}</div>
          )}
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
        <ChevronDown
          size={16}
          className={`return-chevron ${isOpen ? 'open' : ''}`}
        />
      </div>

      {/* Progress bar */}
      {r.status !== 'denied' && (
        <div className="return-progress">
          {['Requested', 'Under Review', 'Approved', 'Pickup', 'Refunded'].map((s, idx) => (
            <div key={s} className={`rp-step ${idx <= progressStep ? 'done' : ''} ${idx === progressStep ? 'active' : ''}`}>
              <div className="rp-dot">{idx < progressStep ? '✓' : idx === progressStep ? <span className="rp-pulse" /> : null}</div>
              <span className="rp-label">{s}</span>
              {idx < 4 && <div className={`rp-line ${idx < progressStep ? 'done' : ''}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {isOpen && (
        <div className="return-card-detail">
          <div className="return-detail-grid">
            <div className="return-detail-item">
              <span className="rdl">Reason</span>
              <span className="rdv">"{r.reason}"</span>
            </div>
            <div className="return-detail-item">
              <span className="rdl">Status</span>
              <span className="rdv" style={{ color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
            </div>
            {r.pickup_date && (
              <div className="return-detail-item">
                <span className="rdl">Pickup Date</span>
                <span className="rdv pickup-date">
                  📅 {new Date(r.pickup_date).toLocaleString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            )}
            {r.refund_status && r.refund_status !== 'none' && (
              <div className="return-detail-item">
                <span className="rdl">Refund</span>
                <span className="rdv" style={{ color: refundCfg?.color, fontWeight: 700 }}>
                  {refundCfg?.label || '—'}
                </span>
              </div>
            )}
          </div>

          {r.status === 'approved' && !r.pickup_date && (
            <div className="return-info-box orange">
              <Clock size={14} /> Seller will schedule a pickup date soon. You'll be notified.
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
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  Your refund has been processed to your original payment method.
                </div>
              </div>
            </div>
          )}
          {r.status === 'approved' && r.pickup_date && (
            <div className="return-info-box teal">
              <Truck size={14} />
              <div>
                <strong>Pickup Scheduled</strong>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  Keep the product ready. Our team will pick it up on the scheduled date.
                </div>
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
