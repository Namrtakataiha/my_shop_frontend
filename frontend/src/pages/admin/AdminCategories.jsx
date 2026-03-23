import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../utils/api';
import { useToast } from '../../components/Toast';

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => getCategories().then(r => setCategories(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await updateCategory(editing.id, form); toast('Category updated!', 'success'); }
      else { await createCategory(form); toast('Category created!', 'success'); }
      setModal(false); load();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await deleteCategory(id); toast('Category deleted', 'info'); load(); }
    catch (err) { toast(err.response?.data?.error || 'Cannot delete (has products)', 'error'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><Tag size={24} /> Categories</h1>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={16} /> Add Category</button>
      </div>

      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td style={{ color: 'var(--text-light)', fontSize: 13 }}>{c.description || '—'}</td>
                  <td><span className={`badge ${c.is_active ? 'badge-success' : 'badge-danger'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-light)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(c)} className="btn btn-sm btn-outline"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-danger"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Category' : 'New Category'}</h3>
              <button onClick={() => setModal(false)} className="btn btn-icon btn-outline"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : null}
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
