import { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle, Clock, RefreshCw, CreditCard, BadgeCheck, Calendar } from 'lucide-react';
import { getAdminReturns, approveOrRejectReturn, processRefund } from '../../utils/api';
import { useToast } from '../../components/Toast';

const STATUS_CFG = {
  pending:   { color: 'warning', icon: <Clock size={13} />,        label: 'Pending' },
  approved:  { color: 'success', icon: <CheckCircle size={13} />,  label: 'Approved' },
  denied:    { color: 'danger',  icon: <XCircle size={13} />,      label: 'Denied' },
  completed: { color: 'info',    icon: <BadgeCheck size={13} />,   label: 'Completed' },
};

const REFUND_CFG = {
  none:      { color: '#94969f', bg: '#f5f5f6', label: 'No Refund' },
  pending:   { color: '#ff905a', bg: '#fff4ec', label: 'Refund Pending' },
  processed: { color: '#03a685', bg: '#e6f9f5', label: 'Refund Processed' },
};

export default function AdminReturns() {
  const toast = useToast();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('all');
  // Approve modal state
  const [approveModal, setApproveModal] = useState(null); // holds return object
  const [pickupDate, setPickupDate] = useState('');

  const load = () => {
    setLoading(true);
    getAdminReturns()
      .then(r => setReturns(Array.isArray(r.data) ? r.data : []))
      .catch(() => setReturns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async () => {
    if (!approveModal) return;
    setUpdating(approveModal.id + '_status');
    try {
      const payload = { action: 'approve' };
      if (pickupDate) payload.pickup_date = new Date(pickupDate).toISOString();
      await approveOrRejectReturn(approveModal.id, payload);
      toast('Return approved! Customer notified.', 'success');
      setApproveModal(null);
      setPickupDate('');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setUpdating(null); }
  };

  const handleDeny = async (id) => {
    setUpdating(id + '_status');
    try {
      await approveOrRejectReturn(id, { action: 'deny' });
      toast('Return request denied.', 'info');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setUpdating(null); }
  };

  const handleProcessRefund = async (id) => {
    setUpdating(id + '_refund');
    try {
      await processRefund(id);
      toast('Return completed & refund processed! Both parties notified.', 'success');
      load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to process refund', 'error');
    } finally { setUpdating(null); }
  };

  const filtered = filter === 'all' ? returns : returns.filter(r => r.status === filter);

  // Min datetime = now
  const minDatetime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><RotateCcw size={22} /> Return Requests</h1>
        <button onClick={load} className="btn btn-outline btn-sm"><RefreshCw size={14} /> Refresh</button>
      </div>

      {/* Filter tabs */}
      <div className="tab-nav" style={{ marginBottom: 24 }}>
        {['all', 'pending', 'approved', 'denied', 'completed'].map(f => (
          <button key={f} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {` (${f === 'all' ? returns.length : returns.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
            <RotateCcw size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p>No {filter !== 'all' ? filter : ''} return requests</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((r, i) => {
              const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
              const refundCfg = REFUND_CFG[r.refund_status || 'none'];
              return (
                <div key={r.id} className="return-admin-card animate-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="return-admin-product">
                    <div className="return-admin-product-name">{r.product_name}</div>
                    {r.order_number && (
                      <div style={{ fontSize: 11, color: '#ff3f6c', fontWeight: 600 }}>#{r.order_number}</div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                      {new Date(r.request_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="return-admin-customer">
                    <div className="customer-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                      {r.customer?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{r.customer}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{r.customer_email}</div>
                    </div>
                  </div>

                  <div className="return-admin-reason">
                    <span>"{r.reason}"</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
                    <span className={`badge badge-${cfg.color}`} style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {r.status !== 'pending' && r.status !== 'denied' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: refundCfg.color, background: refundCfg.bg }}>
                        <CreditCard size={11} /> {refundCfg.label}
                      </span>
                    )}
                    {r.pickup_date && (
                      <span style={{ fontSize: 11, color: '#535766', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> Pickup: {new Date(r.pickup_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => { setApproveModal(r); setPickupDate(''); }} disabled={!!updating}>
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeny(r.id)} disabled={updating === r.id + '_status'}>
                          {updating === r.id + '_status' ? <span className="spinner spinner-sm" /> : <XCircle size={13} />} Deny
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && r.refund_status === 'pending' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: 'linear-gradient(90deg,#03a685,#00c9a7)', color: '#fff', border: 'none' }}
                        onClick={() => handleProcessRefund(r.id)}
                        disabled={updating === r.id + '_refund'}
                      >
                        {updating === r.id + '_refund' ? <span className="spinner spinner-sm" /> : <CreditCard size={13} />}
                        Mark Returned & Refund
                      </button>
                    )}
                    {r.status === 'completed' && (
                      <span style={{ fontSize: 12, color: '#03a685', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BadgeCheck size={14} /> Done
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Approve modal with pickup date ── */}
      {approveModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setApproveModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title"><Calendar size={18} /> Set Pickup Date</h3>
              <button onClick={() => setApproveModal(null)} className="btn btn-icon btn-ghost"><XCircle size={18} /></button>
            </div>
            <div style={{ padding: '4px 0 16px' }}>
              <p style={{ fontSize: 13, color: '#535766', marginBottom: 16 }}>
                Approving return for <strong>{approveModal.product_name}</strong> by <strong>{approveModal.customer}</strong>.
                Set a pickup date so the customer knows when to expect pickup.
              </p>
              <div className="form-group">
                <label className="form-label"><Calendar size={13} /> Pickup Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  min={minDatetime}
                  value={pickupDate}
                  onChange={e => setPickupDate(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setApproveModal(null)} className="btn btn-ghost">Cancel</button>
              <button
                className="btn btn-success"
                onClick={handleApprove}
                disabled={!pickupDate || updating === approveModal.id + '_status'}
              >
                {updating === approveModal.id + '_status' ? <span className="spinner spinner-sm" /> : <CheckCircle size={14} />}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

