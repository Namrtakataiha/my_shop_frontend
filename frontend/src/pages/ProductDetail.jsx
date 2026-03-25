import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Star, MessageCircle, Send, Trash2, Edit2, Package, Zap, Heart } from 'lucide-react';
import { getProducts, addToCart, getComments, addComment, replyComment, updateComment, deleteComment, adminDeleteComment, getRecommendations, addToWishlist, removeFromWishlist, getWishlist, addRating, getProductRatings } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import ProductCard from '../components/ProductCard';
import ImageViewer from '../components/ImageViewer';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [ratings, setRatings] = useState({ average: 0, count: 0, ratings: [] });
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [tab, setTab] = useState(searchParams.get('tab') || 'description');
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingReview, setRatingReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getProducts({ product_name: '' });
        const found = Array.isArray(data) ? data.find(p => p.id === parseInt(id)) : null;
        setProduct(found);
        if (found) {
          const [cRes, rRes, ratRes] = await Promise.allSettled([
            getComments(found.id),
            getRecommendations(found.id),
            getProductRatings(found.id),
          ]);
          if (cRes.status === 'fulfilled') setComments(cRes.value.data);
          if (rRes.status === 'fulfilled') setRecommendations(rRes.value.data.recommended_products || []);
          if (ratRes.status === 'fulfilled') setRatings(ratRes.value.data);
        }
        // Check wishlist
        if (user) {
          const wRes = await getWishlist().catch(() => null);
          if (wRes) {
            const inWishlist = wRes.data.some(p => p.id === parseInt(id));
            setWishlisted(inWishlist);
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!user) { toast('Please login first', 'warning'); return; }
    if (user.role !== 'user') { toast('Only customers can add to cart', 'info'); return; }
    setAdding(true);
    try {
      await addToCart({ product_id: product.id, quantity: qty });
      refreshCart();
      toast(`${product.name} added to cart!`, 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add to cart', 'error');
    } finally { setAdding(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment(product.id, { comment: commentText });
      setCommentText('');
      const { data } = await getComments(product.id);
      setComments(data);
      toast('Comment added!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add comment', 'error');
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      await replyComment(product.id, commentId, { comment: replyText });
      setReplyText(''); setReplyingTo(null);
      const { data } = await getComments(product.id);
      setComments(data);
      toast('Reply added!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to reply', 'error');
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      await updateComment(commentId, { comment: editText });
      setEditingComment(null); setEditText('');
      const { data } = await getComments(product.id);
      setComments(data);
      toast('Comment updated!', 'success');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      if (user.role === 'admin') await adminDeleteComment(commentId);
      else await deleteComment(commentId);
      const { data } = await getComments(product.id);
      setComments(data);
      toast('Comment deleted', 'info');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  const handleWishlist = async () => {
    if (!user) { toast('Please login first', 'warning'); return; }
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await removeFromWishlist(product.id);
        setWishlisted(false);
        toast('Removed from wishlist', 'info');
      } else {
        await addToWishlist(product.id);
        setWishlisted(true);
        toast('Added to wishlist!', 'success');
      }
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    } finally { setWishlistLoading(false); }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!userRating) { toast('Please select a star rating', 'warning'); return; }
    setSubmittingRating(true);
    try {
      await addRating({ product_id: product.id, rating: userRating, review: ratingReview });
      toast('Rating submitted!', 'success');
      const { data } = await getProductRatings(product.id);
      setRatings(data);
      setUserRating(0);
      setRatingReview('');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit rating', 'error');
    } finally { setSubmittingRating(false); }
  };

  if (loading) return (
    <div className="page-loader" style={{ paddingTop: 100 }}>
      <div className="spinner" />
      <p>Loading product...</p>
    </div>
  );

  if (!product) return (
    <div className="empty-state" style={{ paddingTop: 120 }}>
      <Package size={64} />
      <h3>Product not found</h3>
      <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Products</Link>
    </div>
  );

  const discount = Math.floor(Math.random() * 20) + 5;
  const originalPrice = (parseFloat(product.price) * (1 + discount / 100)).toFixed(0);

  return (
    <div className="product-detail-page">
      <div className="container">
        <Link to="/products" className="back-link"><ArrowLeft size={18} /> Back to Products</Link>

        <div className="product-detail-grid">
          {/* Image */}
          <div className="detail-img-section animate-left">
            <div className="detail-img-wrap">
              {product.image ? (
                <ImageViewer
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div className="detail-img-placeholder"><Package size={80} /></div>
              )}
              <div className="detail-discount-badge">-{discount}%</div>
            </div>
          </div>

          {/* Info */}
          <div className="detail-info animate-right">
            <div className="detail-category">{product.category_name}</div>
            <h1 className="detail-title">{product.name}</h1>

            <div className="detail-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill={i < Math.round(ratings.average) ? '#ffc107' : 'none'} color={i < Math.round(ratings.average) ? '#ffc107' : '#ddd'} />
              ))}
              <span>{ratings.average > 0 ? `${ratings.average} (${ratings.count} ratings)` : `${comments.length} reviews`}</span>
            </div>

            <div className="detail-price-row">
              <span className="price" style={{ fontSize: 32 }}>₹{parseFloat(product.price).toLocaleString('en-IN')}</span>
              <span className="price-old" style={{ fontSize: 18 }}>₹{parseFloat(originalPrice).toLocaleString('en-IN')}</span>
              <span className="badge badge-success">Save {discount}%</span>
            </div>

            <div className="detail-stock">
              {product.stock_quantity > 0 ? (
                <span className="badge badge-success">✓ In Stock ({product.stock_quantity} available)</span>
              ) : (
                <span className="badge badge-danger">✗ Out of Stock</span>
              )}
            </div>

            {product.stock_quantity > 0 && user?.role === 'user' && (
              <div className="detail-qty">
                <label>Quantity:</label>
                <div className="qty-control">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}>+</button>
                </div>
              </div>
            )}

            <div className="detail-actions">
              {user?.role === 'user' && (
                <button className="btn btn-primary btn-lg" onClick={handleAddToCart} disabled={adding || product.stock_quantity === 0}>
                  {adding ? <span className="spinner spinner-sm" /> : <ShoppingCart size={20} />}
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              )}
              {!user && (
                <Link to="/login" className="btn btn-primary btn-lg"><ShoppingCart size={20} /> Login to Buy</Link>
              )}
              {/* Wishlist button */}
              <button
                className={`btn btn-lg ${wishlisted ? 'btn-danger' : 'btn-ghost'}`}
                onClick={handleWishlist}
                disabled={wishlistLoading}
                title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={20} fill={wishlisted ? '#fff' : 'none'} />
              </button>
            </div>

            <div className="detail-features">
              <div className="detail-feature"><Zap size={16} /> Fast Delivery</div>
              <div className="detail-feature">🔒 Secure Payment</div>
              <div className="detail-feature">↩ Easy Returns</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          <div className="tab-nav">
            {['description', 'reviews', 'ratings'].map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'description' ? 'Description' : t === 'reviews' ? `Reviews (${comments.length})` : `Ratings (${ratings.count})`}
              </button>
            ))}
          </div>

          {tab === 'description' && (
            <div className="tab-content animate-fade">
              <p style={{ lineHeight: 1.8, color: 'var(--text-light)' }}>{product.description}</p>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="tab-content animate-fade">
              {/* Add comment — customers only */}
              {user && user.role === 'user' && (
                <form onSubmit={handleComment} className="comment-form">
                  <textarea
                    className="form-input"
                    placeholder="Write your review..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <button type="submit" className="btn btn-primary"><Send size={16} /> Post Review</button>
                </form>
              )}

              {/* Seller info banner */}
              {user?.role === 'admin' && (
                <div style={{ padding: '12px 16px', background: '#f0f9ff', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#0984e3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={15} /> Customer reviews for this product
                </div>
              )}

              {/* Comments list */}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <MessageCircle size={48} />
                    <h3>No reviews yet</h3>
                    <p>Be the first to review this product!</p>
                  </div>
                ) : comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-avatar">{c.user_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <strong>{c.user_name}</strong>
                        <span className="comment-date">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="comment-actions">
                        {user && (user.username === c.user_name || user.role === 'admin') && (
                          <>
                            {user.username === c.user_name && (
                              <button onClick={() => { setEditingComment(c.id); setEditText(c.comment); }} className="btn btn-sm btn-outline">
                                <Edit2 size={12} />
                              </button>
                            )}
                            <button onClick={() => handleDeleteComment(c.id)} className="btn btn-sm btn-danger">
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingComment === c.id ? (
                      <div className="edit-form">
                        <textarea className="form-input" value={editText} onChange={e => setEditText(e.target.value)} rows={2} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleEditComment(c.id)} className="btn btn-primary btn-sm">Save</button>
                          <button onClick={() => setEditingComment(null)} className="btn btn-outline btn-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="comment-text">{c.comment}</p>
                        {c.sentiment && (() => {
                          const S = {
                            positive: { bg: '#e6f9f5', color: '#03a685', label: '😊 Positive' },
                            negative: { bg: '#fff0f3', color: '#ff3f6c', label: '😞 Negative' },
                            neutral:  { bg: '#f4f4f5', color: '#94969f', label: '😐 Neutral'  },
                          };
                          const s = S[c.sentiment] || S.neutral;
                          return (
                            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: s.bg, color: s.color, marginTop: 4 }}>
                              {s.label}
                            </span>
                          );
                        })()}
                      </>
                    )}

                    {/* Replies */}
                    {c.replies?.map(r => (
                      <div key={r.id} className="reply-item">
                        <div className="comment-avatar reply-avatar">{r.user_name?.[0]?.toUpperCase()}</div>
                        <div>
                          <strong>{r.user_name}</strong>
                          <p>{r.comment}</p>
                        </div>
                        {user && (user.username === r.user_name || user.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(r.id)} className="btn btn-sm btn-danger"><Trash2 size={12} /></button>
                        )}
                      </div>
                    ))}

                    {user && (
                      <button className="reply-btn" onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}>
                        <MessageCircle size={14} /> Reply
                      </button>
                    )}
                    {replyingTo === c.id && (
                      <div className="reply-form">
                        <input className="form-input" placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                        <button onClick={() => handleReply(c.id)} className="btn btn-primary btn-sm"><Send size={14} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {tab === 'ratings' && (
            <div className="tab-content animate-fade">
              {/* Rating summary */}
              <div className="rating-summary">
                <div className="rating-big">{ratings.average || '—'}</div>
                <div>
                  <div className="rating-stars-row">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} fill={i < Math.round(ratings.average) ? '#ffc107' : 'none'} color={i < Math.round(ratings.average) ? '#ffc107' : '#ddd'} />
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{ratings.count} rating{ratings.count !== 1 ? 's' : ''}</div>
                </div>
              </div>

              {/* Submit rating — customers only */}
              {user?.role === 'user' && (
                <form onSubmit={handleRatingSubmit} className="rating-form">
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Rate this product</div>
                  <div className="star-picker">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setUserRating(n)}>
                        <Star size={28} fill={n <= userRating ? '#ffc107' : 'none'} color={n <= userRating ? '#ffc107' : '#ddd'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="form-input"
                    placeholder="Write a review (optional)..."
                    value={ratingReview}
                    onChange={e => setRatingReview(e.target.value)}
                    rows={2}
                    style={{ marginTop: 10 }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingRating || !userRating} style={{ marginTop: 10 }}>
                    {submittingRating ? <span className="spinner spinner-sm" /> : <Star size={14} />}
                    Submit Rating
                  </button>
                </form>
              )}

              {/* Ratings list */}
              <div className="ratings-list">
                {ratings.ratings?.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <Star size={40} color="#eaeaec" />
                    <p>No ratings yet</p>
                  </div>
                ) : ratings.ratings?.map(r => (
                  <div key={r.id} className="rating-item">
                    <div className="comment-avatar">{r.user?.[0]?.toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 13 }}>{r.user}</strong>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} fill={i < r.rating ? '#ffc107' : 'none'} color={i < r.rating ? '#ffc107' : '#ddd'} />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.review && <p style={{ fontSize: 13, color: 'var(--text-light)', margin: 0 }}>{r.review}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Recommendations */}        {recommendations.length > 0 && (
          <div className="recommendations">
            <h2 className="section-title">You May Also Like</h2>
            <div className="grid-4">
              {recommendations.map((p, i) => (
                <div key={p.id} className="animate-fade" style={{ animationDelay: `${i * 0.1}s` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
