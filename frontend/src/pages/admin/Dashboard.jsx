import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Tag, ShoppingCart, Plus, Eye, TrendingUp, ArrowRight } from 'lucide-react';
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
      change: '+12% this month', link: '/admin/users'
    },
    {
      label: 'Total Products', value: stats.total_products,
      icon: <Package size={24}/>, bg: '#f0fff8', color: '#03a685',
      change: '+5 this week', link: '/admin/products'
    },
    {
      label: 'Categories', value: stats.total_categories,
      icon: <Tag size={24}/>, bg: '#fff4ec', color: '#ff905a',
      change: 'Active categories', link: '/admin/categories'
    },
    {
      label: 'Total Orders', value: stats.total_orders,
      icon: <ShoppingCart size={24}/>, bg: '#eef2ff', color: '#3880ff',
      change: '+8% this week', link: '/admin/orders'
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
                <div className="stat-change">↑ {c.change}</div>
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

      {/* Recent activity placeholder */}
      <div style={{background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
          <h2 style={{fontSize:16, fontWeight:800}}>Recent Activity</h2>
          <Link to="/admin/orders" className="btn btn-ghost btn-xs">View All <ArrowRight size={12}/></Link>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          {[
            {icon:'🛒', text:'New order received for your product', time:'2 min ago', color:'#fff0f3'},
            {icon:'📦', text:'Product stock running low', time:'1 hr ago', color:'#fff4ec'},
            {icon:'⭐', text:'New review on your product', time:'3 hr ago', color:'#f0fff8'},
            {icon:'💰', text:'Payment confirmed for order', time:'5 hr ago', color:'#eef2ff'},
          ].map((a,i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:14, padding:'10px 14px', background:'#fafafa', borderRadius:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:a.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{a.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>{a.text}</div>
                <div style={{fontSize:11,color:'var(--text-light)'}}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
