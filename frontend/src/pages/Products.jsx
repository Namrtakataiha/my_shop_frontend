import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import { getProducts, getCategories } from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Products.css';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    product_name: searchParams.get('product_name') || '',
    category_name: searchParams.get('category_name') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    ordering: searchParams.get('ordering') || '',
  });

  const fetchProducts = useCallback(async () => {
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
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { getCategories().then(r => setCategories(r.data)).catch(() => {}); }, []);

  const applyFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSearchParams(prev => { if (value) prev.set(key, value); else prev.delete(key); return prev; });
  };

  const clearFilters = () => {
    setFilters({ product_name: '', category_name: '', min_price: '', max_price: '', ordering: '' });
    setSearchParams({});
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="container">
          <h1>All Products</h1>
          <p>{loading ? 'Loading...' : `${products.length} products found`}</p>
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
              <input
                type="text"
                placeholder="Product name..."
                value={filters.product_name}
                onChange={e => applyFilter('product_name', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="category-filters">
              <button
                className={`cat-btn ${!filters.category_name ? 'active' : ''}`}
                onClick={() => applyFilter('category_name', '')}
              >All</button>
              {categories.map(c => (
                <button
                  key={c.id}
                  className={`cat-btn ${filters.category_name === c.name ? 'active' : ''}`}
                  onClick={() => applyFilter('category_name', c.name)}
                >{c.name}</button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min ₹"
                value={filters.min_price}
                onChange={e => applyFilter('min_price', e.target.value)}
                className="form-input"
              />
              <span>—</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={filters.max_price}
                onChange={e => applyFilter('max_price', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <select
              value={filters.ordering}
              onChange={e => applyFilter('ordering', e.target.value)}
              className="form-input"
            >
              <option value="">Default</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
              <option value="-name">Name: Z-A</option>
            </select>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="products-main">
          <div className="products-toolbar">
            <button className="btn btn-outline btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={16} /> Filters
            </button>
            <span className="products-count">{products.length} results</span>
            <select
              value={filters.ordering}
              onChange={e => applyFilter('ordering', e.target.value)}
              className="form-input sort-select"
            >
              <option value="">Sort: Default</option>
              <option value="price">Price ↑</option>
              <option value="-price">Price ↓</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
            </select>
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
