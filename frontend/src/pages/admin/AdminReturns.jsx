import { useState, useEffect } from 'react';
import {
  RotateCcw, CheckCircle, XCircle, Clock, RefreshCw,
  CreditCard, BadgeCheck, Truck, Package, ChevronDown
} from 'lucide-react';
import { getAdminReturns, approveReturnRequest, processPickup, processRefund } from '../../utils/api';
import { useToast } from '../../components/Toast';

const STATUS_CFG = {
  pending:            { color: '#ff905a', bg: '#fff4ec', icon: <Clock size={13} />,        label: 'Pending' },
  approved:           { color: '#03a685', bg: '#e6f9f5', icon: <CheckCircle size={13} />,  label: 'Approved' },
  denied:             { color: '#ff3f6c', bg: '#fff0f3', icon: <XCircle size={13} />,      label: 'Denied' },
  pickup_in_progress: { color: '#5c6bc0', bg: '#eef2ff', icon: <Truck size={13} />,        label: 'Pickup In Progress' },
  completed:          { color: '#03a685', bg: '#e6f9f5', icon: <BadgeCheck size={13} />,   label: 'Completed' },
};

const REFUND_CFG = {
  none:      { color: '#94969f', bg: '#f5f5f6', label: 'No Refund' },
  pending:   { color: '#ff905a', bg: '#fff4ec', label: 'Refund Pending' },
  processed: { color: '#03a685', bg: '#e6f9f5', label: 'Refund Processed' },
};

const FILTERS = ['all', 'pending', 'approved', 'pickup_in_progress', 'denied', 'completed'];

export default function AdminReturns() {
  const toast = useToast();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true);
    getAdminReturns()
      .then(r => setReturns(Array.isArray(r.data) ? r.data : []))
      .catch(() => setReturns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setUpdating(id + '_approve');
    try {
      await approveReturnRequest(id, { approve: true });
      toast('Return request approved!', 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setUpdating(null); }
  };

  const handleDeny = async (id) => {
    setUpdating(id + '_deny');
    try {
      await approveReturnRequest(id, { approve: false });
      toast('Return request denied.', 'info');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setUpdating(null); }
  };

  const handleProcessPickup = async (id) => {
    setUpdating(id + '_pickup');
    try {
      await processPickup(id);
      toast('Pickup marked as in progress!', 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setUpdating(null); }
  };

  const handleProcessRefund = async (id) => {
    setUpdating(id + '_refund');
    try {
      await processRefund(id);
      toast('Refund processed successfully!', 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to process refund', 'error');
    } finally { setUpdating(null); }
  };

  const filtered = filter === 'all' ? returns : returns.filter(r => r.status === filter);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><RotateCcw size={22} /> Return Requests</h1>
        <button onClick={load} className="btn btn-outline btn-sm"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Filter tabs */}
      <div className="tab-nav" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 4 }}>
        {FILTERS.map(f => {
          const count = f === 'all' ? returns.length : returns.filter(r => r.status === f).length;
          return (
            <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'pickup_in_progress' ? 'Pickup' : f.charAt(0).toUpperCase() + f.slice(1)}
              {` (${count})`}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
          <RotateCcw size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p>No {filter !== 'all' ? filter : ''} return requests</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((r, i) => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
            const refundCfg = REFUND_CFG[r.refund_status || 'none'];
            const isOpen = expanded === r.id;

            // Serializer returns product/order as IDs — use nested fields if available
            const productName = r.product_name || `Product #${r.product}`;
            const customerName = r.customer || r.user_name || `User #${r.user}`;
            const customerEmail = r.customer_email || r.user_email || '';

            return (
              <div key={r.id} className="return-admin-card animate-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                  {/* Product */}
                  <div className="return-admin-product">
                    <div className="return-admin-product-name">{productName}</div>
                    {r.order && <div style={{ fontSize: 11, color: '#ff3f6c', fontWeight: 600 }}>Order #{r.order}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                      {new Date(r.request_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="return-admin-customer">
                    <div className="customer-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                      {customerName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{customerName}</div>
                      {customerEmail && <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{customerEmail}</div>}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="return-admin-reason">"{r.reason}"</div>

                  {/* Status badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end', marginLeft: 'auto' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: refundCfg.color, background: refundCfg.bg }}>
                      <CreditCard size={11} /> {refundCfg.label}
                    </span>
                    {r.pickup_date && (
                      <span style={{ fontSize: 11, color: '#535766' }}>
                        📅 {new Date(r.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {r.status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleApprove(r.id)} disabled={!!updating}>
                          {updating === r.id + '_approve' ? <span className="spinner spinner-sm" /> : <CheckCircle size={13} />} Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeny(r.id)} disabled={!!updating}>
                          {updating === r.id + '_deny' ? <span className="spinner spinner-sm" /> : <XCircle size={13} />} Deny
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#5c6bc0', color: '#fff', border: 'none' }}
                        onClick={() => handleProcessPickup(r.id)}
                        disabled={updating === r.id + '_pickup'}
                      >
                        {updating === r.id + '_pickup' ? <span className="spinner spinner-sm" /> : <Truck size={13} />} Start Pickup
                      </button>
                    )}
                    {r.status === 'pickup_in_progress' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: 'linear-gradient(90deg,#03a685,#00c9a7)', color: '#fff', border: 'none' }}
                        onClick={() => handleProcessRefund(r.id)}
                        disabled={updating === r.id + '_refund'}
                      >
                        {updating === r.id + '_refund' ? <span className="spinner spinner-sm" /> : <CreditCard size={13} />} Process Refund
                      </button>
                    )}
                    {r.status === 'completed' && (
                      <span style={{ fontSize: 12, color: '#03a685', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BadgeCheck size={14} /> Done
                      </span>
                    )}
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      style={{ padding: '6px 8px' }}
                    >
                      <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94969f', textTransform: 'uppercase', marginBottom: 3 }}>Reason</div>
                      <div style={{ fontSize: 13, color: '#282c3f' }}>"{r.reason}"</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94969f', textTransform: 'uppercase', marginBottom: 3 }}>Request Date</div>
                      <div style={{ fontSize: 13, color: '#282c3f' }}>
                        {new Date(r.request_date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {r.pickup_date && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94969f', textTransform: 'uppercase', marginBottom: 3 }}>Pickup Date</div>
                        <div style={{ fontSize: 13, color: '#5c6bc0', fontWeight: 600 }}>
                          {new Date(r.pickup_date).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94969f', textTransform: 'uppercase', marginBottom: 3 }}>Refund Status</div>
                      <div style={{ fontSize: 13, color: refundCfg.color, fontWeight: 600 }}>{refundCfg.label}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
