import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Package, X, Zap, Search, ChevronDown, Check, Tag, Eye, Star } from 'lucide-react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, predictPrice, getProductRatings, getComments, adminDeleteComment } from '../../utils/api';
import { useToast } from '../../components/Toast';

const emptyForm = { name: '', description: '', price: '', stock_quantity: '', image: '', category_id: '' };

/* ── Category card-grid picker ── */
function CategoryPicker({ categories, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = categories.find(c => String(c.id) === String(value));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (categories.length === 0) {
    return (
      <div style={{ padding: '12px 16px', background: '#fff4ec', borderRadius: 8, fontSize: 13, color: '#ff905a', border: '1.5px solid #ffd0a8' }}>
        ⚠️ No categories found. Please create a category from the Categories page first.
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 14px', border: `1.5px solid ${open ? '#ff3f6c' : '#eaeaec'}`,
          borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 600, color: selected ? '#282c3f' : '#94969f',
          transition: 'all 0.2s', boxShadow: open ? '0 0 0 3px rgba(255,63,108,0.1)' : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selected ? (
            <>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#fff0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                🏷️
              </span>
              {selected.name}
            </>
          ) : (
            <>
              <Tag size={15} style={{ color: '#94969f' }} />
              Select a category
            </>
          )}
        </span>
        <ChevronDown size={16} style={{ color: '#94969f', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', borderRadius: 12, border: '1.5px solid #eaeaec',
          boxShadow: '0 12px 40px rgba(0,0,0,0.14)', padding: 12,
          animation: 'scaleIn 0.2s ease',
          maxHeight: 320, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#94969f', marginBottom: 10, padding: '0 4px' }}>
            Choose Category ({categories.length} available)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {categories.map((cat, i) => {
              const isSelected = String(cat.id) === String(value);
              const colors = ['#fff0f3', '#f0fff8', '#eef2ff', '#fff4ec', '#f5f0ff', '#f0f9ff'];
              const icons = ['👗', '📱', '🏠', '⚽', '💄', '👜', '👔', '🧒', '🎮', '📚'];
              const bg = colors[i % colors.length];
              const icon = icons[i % icons.length];
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { onChange(String(cat.id)); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    border: `1.5px solid ${isSelected ? '#ff3f6c' : 'transparent'}`,
                    background: isSelected ? '#fff0f3' : '#fafafa',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'all 0.18s', position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f5f5f6'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fafafa'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#ff3f6c' : '#282c3f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.name}
                    </div>
                    {cat.description && (
                      <div style={{ fontSize: 10, color: '#94969f', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cat.description.slice(0, 28)}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#ff3f6c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Star display ── */
function Stars({ value, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= value ? '#f5a623' : 'none'} color={i <= value ? '#f5a623' : '#ddd'} />
      ))}
    </span>
  );
}

/* ── Reviews Panel (slide-in) ── */
function ReviewsPanel({ product, onClose, toast }) {
  const [ratings, setRatings] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingComment, setDeletingComment] = useState(null);
  const [tab, setTab] = useState('ratings');

  useEffect(() => {
    if (!product) return;
    setLoading(true);
    Promise.allSettled([
      getProductRatings(product.id),
      getComments(product.id),
    ]).then(([rRes, cRes]) => {
      if (rRes.status === 'fulfilled') {
        setRatings(rRes.value.data?.ratings || []);
      }
      if (cRes.status === 'fulfilled') {
        setComments(Array.isArray(cRes.value.data) ? cRes.value.data : []);
      }
    }).finally(() => setLoading(false));
  }, [product]);

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    setDeletingComment(commentId);
    try {
      await adminDeleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast('Comment deleted', 'info');
    } catch {
      toast('Failed to delete comment', 'error');
    } finally { setDeletingComment(null); }
  };

  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : 0;

  if (!product) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, backdropFilter: 'blur(2px)' }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '95vw',
        background: '#fff', zIndex: 301, boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.28s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eaeaec', display: 'flex', alignItems: 'center', gap: 14 }}>
          {product.image
            ? <img src={product.image} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid #eaeaec' }} />
            : <div style={{ width: 52, height: 52, background: '#f4f4f5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={22} color="#ccc" /></div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#282c3f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
            <div style={{ fontSize: 12, color: '#94969f', marginTop: 2 }}>{product.category_name}</div>
            {ratings.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Stars value={Math.round(avgRating)} size={13} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#282c3f' }}>{avgRating}</span>
                <span style={{ fontSize: 11, color: '#94969f' }}>({ratings.length} ratings)</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#94969f' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eaeaec', padding: '0 24px' }}>
          {[
            { key: 'ratings', label: `Ratings (${ratings.length})` },
            { key: 'comments', label: `Comments (${comments.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                color: tab === t.key ? '#ff3f6c' : '#94969f',
                borderBottom: tab === t.key ? '2px solid #ff3f6c' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner" /></div>
          ) : tab === 'ratings' ? (
            ratings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94969f' }}>
                <Star size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p>No ratings yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ratings.map(r => (
                  <div key={r.id} style={{ background: '#fafafa', borderRadius: 12, padding: '14px 16px', border: '1px solid #eaeaec' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff3f6c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                          {r.user?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#282c3f' }}>{r.user}</span>
                      </div>
                      <Stars value={r.rating} size={13} />
                    </div>
                    {r.review && <p style={{ fontSize: 13, color: '#535766', margin: 0, lineHeight: 1.5 }}>"{r.review}"</p>}
                    <div style={{ fontSize: 11, color: '#94969f', marginTop: 6 }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94969f' }}>
                <Package size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p>No comments yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comments.map(c => (
                  <div key={c.id} style={{ background: '#fafafa', borderRadius: 12, padding: '14px 16px', border: '1px solid #eaeaec' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#282c3f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {c.user?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#282c3f' }}>{c.user}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        disabled={deletingComment === c.id}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff3f6c', padding: '4px 6px', borderRadius: 6, flexShrink: 0 }}
                        title="Delete comment"
                      >
                        {deletingComment === c.id ? <span className="spinner spinner-sm" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: '#535766', margin: 0, lineHeight: 1.5 }}>{c.comment}</p>
                    <div style={{ fontSize: 11, color: '#94969f', marginTop: 6 }}>
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {/* Replies */}
                    {c.replies?.length > 0 && (
                      <div style={{ marginTop: 10, paddingLeft: 16, borderLeft: '2px solid #eaeaec' }}>
                        {c.replies.map(rep => (
                          <div key={rep.id} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#535766' }}>↳ {rep.user}</span>
                              <button
                                onClick={() => handleDeleteComment(rep.id)}
                                disabled={deletingComment === rep.id}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff3f6c', padding: '2px 4px' }}
                              >
                                {deletingComment === rep.id ? <span className="spinner spinner-sm" /> : <Trash2 size={11} />}
                              </button>
                            </div>
                            <p style={{ fontSize: 12, color: '#94969f', margin: '2px 0 0' }}>{rep.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catsLoading, setCatsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const pRes = await getProducts();
      setProducts(Array.isArray(pRes.data) ? pRes.data : []);
    } catch { setProducts([]); }
    setLoading(false);
  };

  const loadCategories = async () => {
    setCatsLoading(true);
    try {
      const cRes = await getCategories();
      const list = Array.isArray(cRes.data) ? cRes.data : (cRes.data?.results || []);
      setCategories(list);
    } catch (err) {
      console.error('Categories fetch failed:', err);
      setCategories([]);
    }
    setCatsLoading(false);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const load = () => { loadProducts(); loadCategories(); };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    loadCategories(); // always refresh categories when opening modal
    setModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      stock_quantity: p.stock_quantity,
      image: p.image || '',
      category_id: String(p.category_id || ''),
    });
    loadCategories(); // always refresh categories when opening modal
    setModal(true);
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.category_id) { toast('Please select a category', 'warning'); return; }
    setSaving(true);
    try {
      if (editing) {
        // If category changed, use the create endpoint with new category, else just update
        if (String(form.category_id) !== String(editing.category_id)) {
          await deleteProduct(editing.id);
          await createProduct(form.category_id, form);
          toast('Product updated with new category!', 'success');
        } else {
          await updateProduct(editing.id, form);
          toast('Product updated! Cache refreshed via Celery.', 'success');
        }
      } else {
        await createProduct(form.category_id, form);
        toast('Product created! Notifications sent via Celery.', 'success');
      }
      setModal(false);
      load();
    } catch (err) {
      const d = err.response?.data;
      toast(typeof d === 'object' ? Object.values(d).flat().join(', ') : 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast('Product deleted', 'info');
      load();
    } catch { toast('Failed to delete', 'error'); }
  };

  const handlePredictPrice = async () => {
    if (!form.description || !form.category_id || !form.stock_quantity) {
      toast('Fill description, category and stock first', 'warning'); return;
    }
    const cat = categories.find(c => String(c.id) === String(form.category_id));
    if (!cat) { toast('Select a valid category', 'warning'); return; }
    setPredicting(true);
    try {
      const { data } = await predictPrice({
        description: form.description,
        category: cat.name,
        stock_quantity: parseInt(form.stock_quantity),
      });
      setForm(f => ({ ...f, price: parseFloat(data.predicted_price).toFixed(2) }));
      toast(`AI predicted price: ₹${parseFloat(data.predicted_price).toFixed(2)}`, 'success');
    } catch { toast('Prediction needs more product data', 'warning'); }
    finally { setPredicting(false); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><Package size={22} /> Products</h1>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={15} /> Add Product</button>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, maxWidth: 400 }}>
        <Search size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
        <input
          style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', flex: 1, background: 'transparent' }}
          placeholder="Search products or categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-light)' }}>No products found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {p.image
                        ? <img src={p.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                        : <div style={{ width: 44, height: 44, background: '#f4f4f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><Package size={18} /></div>
                      }
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{p.description?.slice(0, 45)}...</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-info">{p.category_name}</span></td>
                  <td><strong style={{ color: '#ff3f6c' }}>₹{parseFloat(p.price).toLocaleString('en-IN')}</strong></td>
                  <td>
                    <span className={`badge ${p.stock_quantity === 0 ? 'badge-danger' : p.stock_quantity <= 5 ? 'badge-warning' : 'badge-success'}`}>
                      {p.stock_quantity === 0 ? 'Out of Stock' : `${p.stock_quantity} units`}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {p.is_active ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setReviewProduct(p)} className="btn btn-sm btn-ghost" title="View Reviews"><Eye size={13} /></button>
                      <button onClick={() => openEdit(p)} className="btn btn-sm btn-ghost" title="Edit"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-danger" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? '✏️ Edit Product' : '📦 Add New Product'}</h3>
              <button onClick={() => setModal(false)} className="btn btn-icon btn-ghost"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Nike Air Max 270"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              {/* ── Category visual picker ── */}
              <div className="form-group">
                <label className="form-label">
                  Category *
                </label>
                {catsLoading ? (
                  <div style={{ padding: '12px 16px', background: '#f5f5f6', borderRadius: 8, fontSize: 13, color: '#94969f', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spinner spinner-sm" /> Loading categories...
                  </div>
                ) : (
                  <CategoryPicker
                    categories={categories}
                    value={form.category_id}
                    onChange={val => setForm(f => ({ ...f, category_id: val }))}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-input"
                  placeholder="Describe the product in detail..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Price (₹) *
                    <button
                      type="button"
                      onClick={handlePredictPrice}
                      disabled={predicting}
                      style={{
                        background: 'linear-gradient(90deg,#ff3f6c,#ff905a)', color: '#fff',
                        border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 10,
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        opacity: predicting ? 0.7 : 1,
                      }}
                    >
                      <Zap size={10} /> {predicting ? 'Predicting...' : 'AI Predict'}
                    </button>
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.stock_quantity}
                    onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL (optional)</label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                />
                {form.image && (
                  <img
                    src={form.image}
                    alt="preview"
                    style={{ marginTop: 8, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                    onError={e => e.target.style.display = 'none'}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : null}
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reviews Panel ── */}
      {reviewProduct && (
        <ReviewsPanel
          product={reviewProduct}
          onClose={() => setReviewProduct(null)}
          toast={toast}
        />
      )}
    </div>
  );
}
