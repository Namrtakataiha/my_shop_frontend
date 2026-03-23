import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, CheckCircle, Package } from 'lucide-react';
import { getCart, checkout } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import './Checkout.css';

export default function Checkout() {
  const [cartData, setCartData] = useState({ items: [], total: 0 });
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const { refreshCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getCart().then(r => setCartData(r.data)).catch(() => navigate('/cart'));
  }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!address.trim()) { toast('Please enter shipping address', 'warning'); return; }
    setLoading(true);
    try {
      const { data } = await checkout({ shipping_address: address, payment_method: 'cod' });
      setOrderNum(data.order_number);
      setPlaced(true);
      refreshCart();
      toast('Order placed successfully!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Checkout failed', 'error');
    } finally { setLoading(false); }
  };

  if (placed) return (
    <div className="checkout-success">
      <div className="success-card animate-scale">
        <div className="success-icon"><CheckCircle size={64} /></div>
        <h2>Order Placed!</h2>
        <p>Your order <strong>{orderNum}</strong> has been placed successfully.</p>
        <p className="success-sub">Payment: Cash on Delivery. Our team will contact you soon.</p>
        <div className="success-actions">
          <button onClick={() => navigate('/orders')} className="btn btn-primary btn-lg">Track Orders</button>
          <button onClick={() => navigate('/products')} className="btn btn-outline btn-lg">Continue Shopping</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-layout">
          {/* Form */}
          <div className="checkout-form-section animate-left">
            <form onSubmit={handleCheckout}>
              <div className="checkout-section-card">
                <h3><MapPin size={20} /> Shipping Address</h3>
                <div className="form-group">
                  <label className="form-label">Full Delivery Address</label>
                  <textarea
                    className="form-input"
                    placeholder="House No, Street, City, State, PIN Code"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="checkout-section-card">
                <h3><Truck size={20} /> Payment Method</h3>
                <div className="payment-option selected">
                  <div className="payment-radio" />
                  <div>
                    <strong>Cash on Delivery (COD)</strong>
                    <p>Pay when your order arrives</p>
                  </div>
                  <span className="badge badge-success">Available</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <span className="spinner spinner-sm" /> : <CheckCircle size={20} />}
                {loading ? 'Placing Order...' : `Place Order • ₹${parseFloat(cartData.total).toLocaleString('en-IN')}`}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="checkout-summary animate-right">
            <h3>Order Summary</h3>
            <div className="checkout-items">
              {cartData.items?.map(item => (
                <div key={item.id} className="checkout-item">
                  <div className="checkout-item-img"><Package size={20} /></div>
                  <div className="checkout-item-info">
                    <span>{item.product_name}</span>
                    <small>Qty: {item.quantity}</small>
                  </div>
                  <span className="checkout-item-price">
                    ₹{(parseFloat(item.product_price) * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
            <div className="checkout-total-row"><span>Subtotal</span><span>₹{parseFloat(cartData.total).toLocaleString('en-IN')}</span></div>
            <div className="checkout-total-row"><span>Delivery</span><span className="text-success">FREE</span></div>
            <div className="checkout-total-row checkout-grand-total">
              <span>Total</span>
              <span>₹{parseFloat(cartData.total).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
