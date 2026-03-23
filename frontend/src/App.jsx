import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';

import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';

import Profile from './pages/Profile';

import Wishlist from './pages/Wishlist';
import Returns from './pages/Returns';
import AdminReturns from './pages/admin/AdminReturns';

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User (Customer) */}
        <Route path="/cart" element={<ProtectedRoute role="user"><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute role="user"><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute role="user"><Orders /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute role="user"><Wishlist /></ProtectedRoute>} />
        <Route path="/returns" element={<ProtectedRoute role="user"><Returns /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Admin (Seller) */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
