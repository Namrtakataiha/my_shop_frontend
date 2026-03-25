import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Star, Package } from 'lucide-react';
import { addToCart } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import './ProductCard.css';

export default function ProductCard({ product, scoreBadge, scoreBadgeType }) {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast('Please login to add items to cart', 'warning'); return; }
    if (user.role !== 'user') { toast('Only customers can add to cart', 'info'); return; }
    setAdding(true);
    try {
      await addToCart({ product_id: product.id, quantity: 1 });
      setAdded(true);
      refreshCart();
      toast(`${product.name} added to cart!`, 'success');
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add to cart', 'error');
    } finally {
      setAdding(false);
    }
  };

  const discount = Math.floor(Math.random() * 20) + 5;
  const originalPrice = (parseFloat(product.price) * (1 + discount / 100)).toFixed(0);

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      {scoreBadge && (
        <div className={`product-score-badge ${scoreBadgeType || 'exact'}`}>
          {scoreBadge}
        </div>
      )}
      <div className="product-img-wrap">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-img" loading="lazy" />
        ) : (
          <div className="product-img-placeholder">
            <Package size={48} />
          </div>
        )}
        <div className="product-overlay">
          <button className="overlay-btn" title="Quick View">
            <Eye size={18} />
          </button>
        </div>
        {product.stock_quantity === 0 && (
          <div className="out-of-stock-badge">Out of Stock</div>
        )}
        {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
          <div className="low-stock-badge">Only {product.stock_quantity} left!</div>
        )}
        <div className="discount-badge">-{discount}%</div>
      </div>

      <div className="product-info">
        <div className="product-category">{product.category_name}</div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-stars">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} fill={i < 4 ? '#ffc107' : 'none'} color={i < 4 ? '#ffc107' : '#ddd'} />
          ))}
          <span>({product.comments?.length || 0})</span>
        </div>
        <div className="product-price-row">
          <span className="price">₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
          <span className="price-old">₹{parseFloat(originalPrice).toLocaleString('en-IN')}</span>
        </div>
        <button
          className={`btn btn-primary btn-full add-cart-btn ${added ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={adding || product.stock_quantity === 0}
        >
          {adding ? (
            <span className="spinner spinner-sm" />
          ) : added ? (
            '✓ Added!'
          ) : (
            <><ShoppingCart size={16} /> Add to Cart</>
          )}
        </button>
      </div>
    </Link>
  );
}
