import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Package } from 'lucide-react';
import { getWishlist, removeFromWishlist, addToCart } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import './Wishlist.css';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [adding, setAdding] = useState(null);
  const { refreshCart } = useCart();
  const toast = useToast();

  const load = () => {
    setLoading(true);
    getWishlist()
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await removeFromWishlist(productId);
      setItems(prev => prev.filter(p => p.id !== productId));
      toast('Removed from wishlist', 'info');
    } catch { toast('Failed to remove', 'error'); }
    finally { setRemoving(null); }
  };

  const handleAddToCart = async (product) => {
    setAdding(product.id);
    try {
      await addToCart({ product_id: product.id, quantity: 1 });
      refreshCart();
      toast(`${product.name} added to cart!`, 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add to cart', 'error');
    } finally { setAdding(null); }
  };

  if (loading) return (
    <div className="wishlist-page">
      <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header animate-fade">
          <h1><Heart size={26} fill="#ff3f6c" color="#ff3f6c" /> My Wishlist</h1>
          <p>{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state animate-fade">
            <Heart size={72} color="#eaeaec" />
            <h3>Your wishlist is empty</h3>
            <p>Save products you love to buy them later</p>
            <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 20 }}>
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {items.map((product, i) => (
              <div key={product.id} className="wishlist-card animate-fade" style={{ animationDelay: `${i * 0.06}s` }}>
                <Link to={`/products/${product.id}`} className="wishlist-img-wrap">
                  {product.image
                    ? <img src={product.image} alt={product.name} />
                    : <div className="wishlist-img-placeholder"><Package size={40} /></div>
                  }
                  {product.stock_quantity === 0 && (
                    <div className="wishlist-oos-badge">Out of Stock</div>
                  )}
                </Link>

                <div className="wishlist-info">
                  <span className="wishlist-category">{product.category_name}</span>
                  <Link to={`/products/${product.id}`} className="wishlist-name">{product.name}</Link>
                  <div className="wishlist-price">
                    ₹{parseFloat(product.price).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="wishlist-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={adding === product.id || product.stock_quantity === 0}
                  >
                    {adding === product.id ? <span className="spinner spinner-sm" /> : <ShoppingCart size={14} />}
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemove(product.id)}
                    disabled={removing === product.id}
                    title="Remove from wishlist"
                  >
                    {removing === product.id ? <span className="spinner spinner-sm" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
