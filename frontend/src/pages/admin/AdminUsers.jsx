import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { getAdminUsers } from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAdminUsers()
      .then(r => { setUsers(r.data); setFiltered(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
  }, [search, users]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1><Users size={24} /> Users ({filtered.length})</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '2px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
          <Search size={16} style={{ color: 'var(--text-light)' }} />
          <input
            style={{ border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit' }}
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? <div className="page-loader"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Email</th><th>Role</th><th>Mobile</th><th>Verified</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--primary), #ff9a56)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      <strong>{u.username}</strong>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-info'}`}>{u.role === 'admin' ? '💼 Seller' : '🛍️ Customer'}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-light)' }}>{u.mobile_no || '—'}</td>
                  <td><span className={`badge ${u.is_verified ? 'badge-success' : 'badge-warning'}`}>{u.is_verified ? '✓ Verified' : 'Pending'}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-light)' }}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
