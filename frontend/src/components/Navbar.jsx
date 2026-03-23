import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import {
  ShoppingCart, LogOut, Menu, X, Search,
  Package, LayoutDashboard, ShoppingBag, Tag, Users, ChevronDown, User, Settings, Heart, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const categories = ['Men', 'Women', 'Kids', 'Electronics', 'Home', 'Beauty', 'Sports', 'Accessories'];

function ProfileDropdown({ user, onLogout, onClose }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : <User size={16} />;

  const email = user.email || localStorage.getItem('email') || '';

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      {/* Header */}
      <div className="profile-dropdown-header">
        <div className="profile-dropdown-avatar">{initials}</div>
        <div className="profile-dropdown-info">
          <span className="profile-dropdown-name">{user.username}</span>
          {email && <span className="profile-dropdown-email">{email}</span>}
          <span className={`profile-role-badge ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}>
            {user.role === 'admin' ? '🏪 Seller' : '🛍️ Customer'}
          </span>
        </div>
      </div>

      <div className="profile-dropdown-divider" />

      {/* Details */}
      <div className="profile-dropdown-body">
        <div className="profile-detail-row">
          <span className="profile-detail-label">Username</span>
          <span className="profile-detail-value">{user.username}</span>
        </div>
        {email && (
          <div className="profile-detail-row">
            <span className="profile-detail-label">Email</span>
            <span className="profile-detail-value">{email}</span>
          </div>
        )}
        <div className="profile-detail-row">
          <span className="profile-detail-label">Role</span>
          <span className="profile-detail-value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
        </div>
      </div>

      <div className="profile-dropdown-divider" />

      {/* Profile link */}
      <Link to="/profile" className="profile-nav-link" onClick={onClose}>
        <User size={14} /> My Profile
      </Link>

      <div className="profile-dropdown-divider" />

      {/* Logout */}
      <button className="profile-logout-btn" onClick={onLogout}>
        <LogOut size={15} />
        Sign Out
      </button>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileBtnRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setProfileOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/products?product_name=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = () => { logout(); navigate('/'); setProfileOpen(false); };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      {/* ── Main bar ── */}
      <div className="nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div className="logo-icon"><ShoppingBag size={18} /></div>
          <span className="logo-text">My<span className="logo-accent">Shop</span></span>
        </Link>

        {/* Search */}
        <form className="nav-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products, brands and more"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit"><Search size={16} /></button>
        </form>

        {/* Desktop links */}
        <div className="nav-links">
          {!user ? (
            <>
              <Link to="/products" className="nav-link">Products</Link>
              <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          ) : user.role === 'admin' ? (
            <>
              <NavLink to="/admin/dashboard" className={({isActive})=>`nav-link${isActive?' active-link':''}`}>
                <LayoutDashboard size={15}/> Dashboard
              </NavLink>
              <NavLink to="/admin/products" className={({isActive})=>`nav-link${isActive?' active-link':''}`}>
                <Package size={15}/> Products
              </NavLink>
              <NavLink to="/admin/orders" className={({isActive})=>`nav-link${isActive?' active-link':''}`}>
                <ShoppingCart size={15}/> Orders
              </NavLink>
              {/* Profile avatar with dropdown */}
              <div className="nav-profile-wrap" ref={profileBtnRef}>
                <button
                  className="nav-avatar-btn"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-label="Profile"
                >
                  <div className="nav-avatar">{user.username?.[0]?.toUpperCase()}</div>
                  <span className="nav-username">{user.username}</span>
                  <ChevronDown size={13} className={`profile-chevron${profileOpen ? ' open' : ''}`} />
                </button>
                {profileOpen && (
                  <ProfileDropdown user={user} onLogout={handleLogout} onClose={() => setProfileOpen(false)} />
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/products" className="nav-link">Products</Link>
              <Link to="/orders"   className="nav-link"><Package size={15}/> Orders</Link>
              <Link to="/wishlist" className="nav-link"><Heart size={15}/> Wishlist</Link>
              <Link to="/returns"  className="nav-link"><RotateCcw size={15}/> Returns</Link>
              <Link to="/cart"     className="nav-cart-btn">
                <ShoppingCart size={19}/>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              {/* Profile avatar with dropdown */}
              <div className="nav-profile-wrap" ref={profileBtnRef}>
                <button
                  className="nav-avatar-btn"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-label="Profile"
                >
                  <div className="nav-avatar">{user.username?.[0]?.toUpperCase()}</div>
                  <span className="nav-username">{user.username}</span>
                  <ChevronDown size={13} className={`profile-chevron${profileOpen ? ' open' : ''}`} />
                </button>
                {profileOpen && (
                  <ProfileDropdown user={user} onLogout={handleLogout} onClose={() => setProfileOpen(false)} />
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="menu">
          {menuOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>

      {/* ── Category bar (only for non-admin) ── */}
      {user?.role !== 'admin' && (
        <div className="nav-cats">
          <div className="nav-cats-inner">
            {categories.map(c => (
              <Link
                key={c}
                to={`/products?category_name=${encodeURIComponent(c)}`}
                className="nav-cat-link"
              >{c}</Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="nav-mobile">
          <form className="nav-search-mobile" onSubmit={handleSearch}>
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
            <button type="submit"><Search size={15}/></button>
          </form>

          {!user ? (
            <>
              <Link to="/products" className="mobile-link"><Package size={16}/> Products</Link>
              <div className="mobile-divider"/>
              <Link to="/login"    className="mobile-link">Login</Link>
              <Link to="/register" className="mobile-link">Register</Link>
            </>
          ) : user.role === 'admin' ? (
            <>
              {/* Mobile profile header */}
              <div className="mobile-profile-header">
                <div className="nav-avatar" style={{width:42,height:42,fontSize:16}}>{user.username?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:'#282c3f'}}>{user.username}</div>
                  <span className="profile-role-badge role-admin" style={{fontSize:10}}>🏪 Seller</span>
                </div>
              </div>
              <div className="mobile-divider"/>
              <Link to="/admin/dashboard"  className="mobile-link"><LayoutDashboard size={16}/> Dashboard</Link>
              <Link to="/admin/products"   className="mobile-link"><Package size={16}/> Products</Link>
              <Link to="/admin/categories" className="mobile-link"><Tag size={16}/> Categories</Link>
              <Link to="/admin/orders"     className="mobile-link"><ShoppingCart size={16}/> Orders</Link>
              <Link to="/admin/users"      className="mobile-link"><Users size={16}/> Users</Link>
              <div className="mobile-divider"/>
              <Link to="/profile" className="mobile-link"><User size={16}/> My Profile</Link>
              <div className="mobile-divider"/>
              <button onClick={handleLogout} className="mobile-link mobile-logout"><LogOut size={16}/> Sign Out</button>
            </>
          ) : (
            <>
              {/* Mobile profile header */}
              <div className="mobile-profile-header">
                <div className="nav-avatar" style={{width:42,height:42,fontSize:16}}>{user.username?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:'#282c3f'}}>{user.username}</div>
                  <span className="profile-role-badge role-user" style={{fontSize:10}}>🛍️ Customer</span>
                </div>
              </div>
              <div className="mobile-divider"/>
              <Link to="/products" className="mobile-link"><Package size={16}/> Products</Link>
              <Link to="/cart"     className="mobile-link"><ShoppingCart size={16}/> Cart {cartCount > 0 && `(${cartCount})`}</Link>
              <Link to="/orders"   className="mobile-link"><Package size={16}/> My Orders</Link>
              <Link to="/wishlist" className="mobile-link"><Heart size={16}/> Wishlist</Link>
              <Link to="/returns"  className="mobile-link"><RotateCcw size={16}/> Returns</Link>
              <div className="mobile-divider"/>
              <Link to="/profile" className="mobile-link"><User size={16}/> My Profile</Link>
              <div className="mobile-divider"/>
              <button onClick={handleLogout} className="mobile-link mobile-logout"><LogOut size={16}/> Sign Out</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
