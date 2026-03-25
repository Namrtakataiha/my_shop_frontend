import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { SlidersHorizontal, X, Search, Camera } from 'lucide-react';
import { getProducts, getCategories } from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Products.css';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [imageResults, setImageResults] = useState(null);

  // Pick up imageResults whenever navigation state changes (including same-page navigate)
  useEffect(() => {
    if (location.state?.imageResults !== undefined) {
      setImageResults(location.state.imageResults);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // isImageMode: imageResults is an object with exact/similar/suggestion keys
  const isImageMode = imageResults && typeof imageResults === 'object' && !Array.isArray(imageResults);

  const [filters, setFilters] = useState({
    product_name: searchParams.get('product_name') || '',
    category_name: searchParams.get('category_name') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    ordering: searchParams.get('ordering') || '',
  });

  const fetchProducts = useCallback(async () => {
    if (isImageMode) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await getProducts(params);
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, imageResults]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { getCategories().then(r => setCategories(r.data)).catch(() => {}); }, []);
  useEffect(() => { if (isImageMode) setLoading(false); }, [isImageMode]);

  const applyFilter = (key, value) => {
    setImageResults(null); // clear image search when user applies a filter
    setFilters(prev => ({ ...prev, [key]: value }));
    setSearchParams(prev => { if (value) prev.set(key, value); else prev.delete(key); return prev; });
  };

  const clearFilters = () => {
    setImageResults(null);
    setFilters({ product_name: '', category_name: '', min_price: '', max_price: '', ordering: '' });
    setSearchParams({});
  };

  const hasFilters = Object.values(filters).some(Boolean) || isImageMode;
  const displayProducts = isImageMode ? [] : products;

  const totalImageResults = isImageMode
    ? (imageResults.exact?.length || 0) + (imageResults.similar?.length || 0) + (imageResults.suggestion?.length || 0)
    : 0;

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="container">
          <h1>{isImageMode ? '📷 Visual Search Results' : 'All Products'}</h1>
          <p>
            {loading ? 'Searching...' : isImageMode ? `${totalImageResults} products found` : `${products.length} products found`}
            {isImageMode && (
              <button onClick={clearFilters} className="img-search-clear-btn">
                <X size={12} /> Clear image search
              </button>
            )}
          </p>
          {isImageMode && (
            <div className="img-search-banner">
              <Camera size={16} />
              {imageResults.detected_category
                ? `Detected: ${imageResults.detected_category} — showing visually similar products`
                : 'Showing results grouped by visual similarity'}
            </div>
          )}
        </div>
      </div>

      <div className="container products-layout">
        {/* Sidebar Filters */}
        <aside className={`filters-sidebar ${showFilters ? 'open' : ''}`}>
          <div className="filters-header">
            <h3>Filters</h3>
            {hasFilters && <button onClick={clearFilters} className="btn btn-sm btn-outline"><X size={14} /> Clear</button>}
          </div>
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="filter-search">
              <Search size={16} />
              <input type="text" placeholder="Product name..." value={filters.product_name} onChange={e => applyFilter('product_name', e.target.value)} />
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="category-filters">
              <button className={`cat-btn ${!filters.category_name ? 'active' : ''}`} onClick={() => applyFilter('category_name', '')}>All</button>
              {categories.map(c => (
                <button key={c.id} className={`cat-btn ${filters.category_name === c.name ? 'active' : ''}`} onClick={() => applyFilter('category_name', c.name)}>{c.name}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Price Range</label>
            <div className="price-inputs">
              <input type="number" placeholder="Min ₹" value={filters.min_price} onChange={e => applyFilter('min_price', e.target.value)} className="form-input" />
              <span>—</span>
              <input type="number" placeholder="Max ₹" value={filters.max_price} onChange={e => applyFilter('max_price', e.target.value)} className="form-input" />
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <select value={filters.ordering} onChange={e => applyFilter('ordering', e.target.value)} className="form-input">
              <option value="">Default</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
              <option value="-name">Name: Z-A</option>
            </select>
          </div>
        </aside>

        {/* Products Main */}
        <main className="products-main">
          <div className="products-toolbar">
            <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <span className="products-count">
              {isImageMode ? `${totalImageResults} results` : `${products.length} results`}
            </span>
            {!isImageMode && (
              <select value={filters.ordering} onChange={e => applyFilter('ordering', e.target.value)} className="form-input sort-select">
                <option value="">Sort: Default</option>
                <option value="price">Price ↑</option>
                <option value="-price">Price ↓</option>
                <option value="name">Name A-Z</option>
                <option value="-name">Name Z-A</option>
              </select>
            )}
          </div>

          {loading ? (
            <div className="grid-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 200, marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 16, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '60%' }} />
                </div>
              ))}
            </div>
          ) : isImageMode ? (
            /* ── Image search grouped results ── */
            <div className="img-results-wrap">
              {totalImageResults === 0 ? (
                <div className="empty-state">
                  <Camera size={64} color="#eaeaec" />
                  <h3>No similar products found</h3>
                  <p>Try uploading a clearer product image</p>
                  <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: 16 }}>Browse All Products</button>
                </div>
              ) : (
                <>
                  {imageResults.exact?.length > 0 && (
                    <div className="img-result-section">
                      <div className="img-result-section-header exact">
                        <span className="img-result-badge exact">✓ Exact Match</span>
                        <span className="img-result-count">{imageResults.exact.length} product{imageResults.exact.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid-4">
                        {imageResults.exact.map((p, i) => (
                          <div key={p.id} className="animate-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                            <ProductCard product={p} scoreBadge={`${Math.round(p.similarity_score * 100)}% match`} scoreBadgeType="exact" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imageResults.similar?.length > 0 && (
                    <div className="img-result-section">
                      <div className="img-result-section-header similar">
                        <span className="img-result-badge similar">≈ Similar Style</span>
                        <span className="img-result-count">{imageResults.similar.length} product{imageResults.similar.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid-4">
                        {imageResults.similar.map((p, i) => (
                          <div key={p.id} className="animate-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                            <ProductCard product={p} scoreBadge={`${Math.round(p.similarity_score * 100)}% match`} scoreBadgeType="similar" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imageResults.suggestion?.length > 0 && (
                    <div className="img-result-section">
                      <div className="img-result-section-header suggestion">
                        <span className="img-result-badge suggestion">
                          💡 {imageResults.detected_category
                            ? `Other ${imageResults.detected_category} Products`
                            : 'You May Also Like'}
                        </span>
                        <span className="img-result-count">{imageResults.suggestion.length} product{imageResults.suggestion.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid-4">
                        {imageResults.suggestion.map((p, i) => (
                          <div key={p.id} className="animate-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                            <ProductCard product={p} scoreBadge="Suggested" scoreBadgeType="suggestion" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <Search size={64} />
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
              {hasFilters && <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: 16 }}>Clear Filters</button>}
            </div>
          ) : (
            <div className="grid-4">
              {products.map((p, i) => (
                <div key={p.id} className="animate-fade" style={{ animationDelay: `${i * 0.04}s` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
