import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { getCart, updateCartItem, removeCartItem, clearCart } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import './Cart.css';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { refreshCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await getCart();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleQty = async (id, qty) => {
    if (qty < 1) return;
    try {
      await updateCartItem(id, { quantity: qty });
      load(); refreshCart();
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleRemove = async (id) => {
    try {
      await removeCartItem(id);
      load(); refreshCart();
      toast('Item removed', 'info');
    } catch { toast('Failed to remove', 'error'); }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      setItems([]); setTotal(0); refreshCart();
      toast('Cart cleared', 'info');
    } catch { toast('Failed to clear cart', 'error'); }
  };

  if (loading) return (
    <div className="page-loader" style={{ paddingTop: 100 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1><ShoppingBag size={28} /> Shopping Cart</h1>
          {items.length > 0 && (
            <button onClick={handleClear} className="btn btn-outline btn-sm"><Trash2 size={14} /> Clear All</button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="empty-state animate-fade">
            <ShoppingBag size={80} />
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything yet</p>
            <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 20 }}>
              Start Shopping <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item, i) => (
                <div key={item.id} className="cart-item animate-fade" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="cart-item-img">
                    <Package size={32} />
                  </div>
                  <div className="cart-item-info">
                    <h3>{item.product_name}</h3>
                    <span className="cart-item-price">₹{parseFloat(item.product_price).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="cart-item-qty">
                    <button onClick={() => handleQty(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQty(item.id, item.quantity + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="cart-item-total">
                    ₹{(parseFloat(item.product_price) * item.quantity).toLocaleString('en-IN')}
                  </div>
                  <button onClick={() => handleRemove(item.id)} className="cart-remove">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary animate-right">
              <h2>Order Summary</h2>
              <div className="summary-row"><span>Subtotal ({items.length} items)</span><span>₹{parseFloat(total).toLocaleString('en-IN')}</span></div>
              <div className="summary-row"><span>Delivery</span><span className="text-success">FREE</span></div>
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>₹{parseFloat(total).toLocaleString('en-IN')}</span>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-full btn-lg">
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              <Link to="/products" className="btn btn-outline btn-full" style={{ marginTop: 10 }}>
                Continue Shopping
              </Link>
              <div className="summary-secure">🔒 Secure & Encrypted Checkout</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
