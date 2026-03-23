import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ShoppingCart, Users, RotateCcw } from 'lucide-react';
import '../pages/admin/Admin.css';

const links = [
  { to: '/admin/dashboard',  icon: <LayoutDashboard size={16}/>, label: 'Dashboard' },
  { to: '/admin/products',   icon: <Package size={16}/>,         label: 'Products' },
  { to: '/admin/categories', icon: <Tag size={16}/>,             label: 'Categories' },
  { to: '/admin/orders',     icon: <ShoppingCart size={16}/>,    label: 'Orders' },
  { to: '/admin/returns',    icon: <RotateCcw size={16}/>,       label: 'Returns' },
  { to: '/admin/users',      icon: <Users size={16}/>,           label: 'Users' },
];

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-label">Seller Panel</div>
          <div className="sidebar-brand-name">MyShop Admin</div>
        </div>
        <div className="sidebar-section-label">Main Menu</div>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            {l.icon} {l.label}
          </NavLink>
        ))}
        <div className="sidebar-footer">MyShop v1.0 · Seller Panel</div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
