import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Tag, ShoppingCart, Plus, Eye } from 'lucide-react';
import { getAdminDashboard } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    {
      label: 'Total Customers', value: stats.total_users,
      icon: <Users size={24}/>, bg: '#fff0f3', color: '#ff3f6c',
      link: '/admin/users'
    },
    {
      label: 'Total Products', value: stats.total_products,
      icon: <Package size={24}/>, bg: '#f0fff8', color: '#03a685',
      link: '/admin/products'
    },
    {
      label: 'Categories', value: stats.total_categories,
      icon: <Tag size={24}/>, bg: '#fff4ec', color: '#ff905a',
      link: '/admin/categories'
    },
    {
      label: 'Total Orders', value: stats.total_orders,
      icon: <ShoppingCart size={24}/>, bg: '#eef2ff', color: '#3880ff',
      link: '/admin/orders'
    },
  ] : [];

  return (
    <div className="admin-page">
      {/* Welcome */}
      <div className="admin-welcome animate-fade">
        <div className="admin-welcome-text">
          <h1>Good day, {user?.username} 👋</h1>
          <p>Here's what's happening with your store today</p>
        </div>
        <div className="admin-welcome-actions">
          <Link to="/admin/products" className="btn btn-primary btn-sm"><Plus size={14}/> Add Product</Link>
          <Link to="/admin/orders"   className="btn btn-ghost btn-sm" style={{color:'#fff',borderColor:'rgba(255,255,255,0.3)'}}><Eye size={14}/> Orders</Link>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="stats-grid">
          {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{height:100,borderRadius:12}}/>)}
        </div>
      ) : (
        <div className="stats-grid">
          {statCards.map((c, i) => (
            <Link
              key={i}
              to={c.link}
              className="stat-card animate-fade"
              style={{'--stat-color': c.color, animationDelay:`${i*0.08}s`}}
            >
              <div className="stat-icon" style={{background:c.bg, color:c.color}}>{c.icon}</div>
              <div>
                <div className="stat-value">{c.value?.toLocaleString('en-IN')}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-grid">
          {[
            { to:'/admin/products',   icon:'📦', bg:'#fff0f3', label:'Add Product',      sub:'List new items' },
            { to:'/admin/categories', icon:'🏷️', bg:'#f0fff8', label:'Categories',       sub:'Manage categories' },
            { to:'/admin/orders',     icon:'🛒', bg:'#eef2ff', label:'Manage Orders',    sub:'Update status' },
            { to:'/admin/users',      icon:'👥', bg:'#fff4ec', label:'View Customers',   sub:'User management' },
          ].map((c,i) => (
            <Link key={i} to={c.to} className="quick-card animate-fade" style={{animationDelay:`${i*0.08}s`}}>
              <div className="quick-card-icon" style={{background:c.bg}}>{c.icon}</div>
              <span>{c.label}</span>
              <span style={{fontSize:11,color:'var(--text-light)',fontWeight:500}}>{c.sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
