import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, ShoppingCart,
  Users, RotateCcw, ChevronLeft, ChevronRight, ShoppingBag
} from 'lucide-react';
import '../pages/admin/Admin.css';

const links = [
  { to: '/admin/dashboard',  icon: <LayoutDashboard size={18}/>, label: 'Dashboard' },
  { to: '/admin/products',   icon: <Package size={18}/>,         label: 'Products' },
  { to: '/admin/categories', icon: <Tag size={18}/>,             label: 'Categories' },
  { to: '/admin/orders',     icon: <ShoppingCart size={18}/>,    label: 'Orders' },
  { to: '/admin/returns',    icon: <RotateCcw size={18}/>,       label: 'Returns' },
  { to: '/admin/users',      icon: <Users size={18}/>,           label: 'Users' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile toggle button */}
      <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(o => !o)}>
        <ShoppingBag size={16}/> <span>Menu</span>
      </button>

      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><ShoppingBag size={18}/></div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-label">Seller Panel</div>
              <div className="sidebar-brand-name">MyShop Admin</div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}
        </button>

        {!collapsed && <div className="sidebar-section-label">Main Menu</div>}

        <nav className="sidebar-nav">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              title={collapsed ? l.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-link-icon">{l.icon}</span>
              {!collapsed && <span className="sidebar-link-label">{l.label}</span>}
              {collapsed && <span className="sidebar-tooltip">{l.label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-dot" />
            MyShop v1.0 · Seller Panel
          </div>
        )}
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
