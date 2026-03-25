import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ArrowRight, ChevronLeft, ChevronRight,
  Shield, Headphones, RotateCcw, Truck, TrendingUp, Sparkles
} from 'lucide-react';
import { getProducts, getCategories } from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const SLIDES = [
  {
    eyebrow: 'New Season Arrivals',
    title: "India's Favourite\nFashion Destination",
    sub: 'Discover 50,000+ styles. Delivered fast, priced right.',
    cta: 'Shop Now', link: '/products',
    c1: '#ff3f6c', c2: '#ff905a', bg: '#1a0010', badge: '70% OFF',
  },
  {
    eyebrow: 'Tech Deals',
    title: "Top Electronics\nAt Best Prices",
    sub: 'Smartphones, laptops, gadgets — all at unbeatable deals.',
    cta: 'Explore Deals', link: '/products',
    c1: '#4facfe', c2: '#00f2fe', bg: '#00101a', badge: 'NEW',
  },
  {
    eyebrow: 'Trending Now',
    title: "Style That\nTurns Heads",
    sub: "Curated picks from top designers. Fresh drops every week.",
    cta: 'Shop Trending', link: '/products',
    c1: '#a855f7', c2: '#ec4899', bg: '#0d0010', badge: 'HOT',
  },
];

const FEATURES = [
  { icon: <Truck size={20}/>,      bg: '#fff0f3', color: '#ff3f6c', title: 'Free Delivery',  sub: 'Orders above ₹499' },
  { icon: <Shield size={20}/>,     bg: '#e6f9f5', color: '#03a685', title: 'Secure Payment', sub: '100% safe & encrypted' },
  { icon: <Headphones size={20}/>, bg: '#eef2ff', color: '#5c6bc0', title: '24/7 Support',   sub: 'Always here to help' },
  { icon: <RotateCcw size={20}/>,  bg: '#fff4ec', color: '#ff905a', title: 'Easy Returns',   sub: '7-day hassle-free' },
];

const TRENDING = [
  { emoji: '👟', label: 'Sneakers',    off: '40% OFF', bg: '#fff0f3', color: '#ff3f6c' },
  { emoji: '👜', label: 'Handbags',    off: '35% OFF', bg: '#f0f4ff', color: '#5c6bc0' },
  { emoji: '⌚', label: 'Watches',     off: '50% OFF', bg: '#e6f9f5', color: '#03a685' },
  { emoji: '🕶️', label: 'Sunglasses', off: '30% OFF', bg: '#fff4ec', color: '#ff905a' },
];

export default function Home() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [slide, setSlide]           = useState(0);
  const [email, setEmail]           = useState('');
  const [subbed, setSubbed]         = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => { setProducts(p.data.slice(0, 8)); setCategories(c.data.slice(0, 8)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
  };
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, []);

  const goTo = i => { setSlide(i); startTimer(); };
  const sl = SLIDES[slide];

  return (
    <div className="hm">

      {/* ── HERO ── */}
      <section className="hm-hero" style={{ background: sl.bg }}>
        <div className="hm-orb hm-orb1" style={{ background: `radial-gradient(circle,${sl.c1}44 0%,transparent 70%)` }}/>
        <div className="hm-orb hm-orb2" style={{ background: `radial-gradient(circle,${sl.c2}33 0%,transparent 70%)` }}/>

        <div className="container hm-hero-wrap" key={`s${slide}`}>
          <div className="hm-hero-left">
            <span className="hm-eyebrow" style={{ color: sl.c1, borderColor: `${sl.c1}55`, background: `${sl.c1}12` }}>
              {sl.eyebrow}
            </span>
            <h1 className="hm-h1">
              {sl.title.split('\n').map((line, i) => (
                <span key={i}>
                  {i === 0 ? line : (
                    <><br/><span style={{ background: `linear-gradient(90deg,${sl.c1},${sl.c2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{line}</span></>
                  )}
                </span>
              ))}
            </h1>
            <p className="hm-sub">{sl.sub}</p>
            <div className="hm-hero-btns">
              <button className="hm-btn-fill" style={{ background: `linear-gradient(90deg,${sl.c1},${sl.c2})` }} onClick={() => navigate(sl.link)}>
                {sl.cta} <ArrowRight size={15}/>
              </button>
              <button className="hm-btn-ghost" onClick={() => navigate('/products')}>Browse All</button>
            </div>
            <div className="hm-stats">
              <div className="hm-stat"><strong>50K+</strong><span>Products</span></div>
              <div className="hm-stat-sep"/>
              <div className="hm-stat"><strong>10K+</strong><span>Customers</span></div>
              <div className="hm-stat-sep"/>
              <div className="hm-stat"><strong>4.8★</strong><span>Rating</span></div>
            </div>
          </div>

          <div className="hm-hero-right">
            <div className="hm-circle" style={{ borderColor: `${sl.c1}33` }}>
              <div className="hm-ring" style={{ borderColor: `${sl.c1}22` }}/>
              <div className="hm-ring hm-ring2" style={{ borderColor: `${sl.c2}18` }}/>
              <ShoppingBag size={90} style={{ color: `${sl.c1}66`, position: 'relative', zIndex: 1 }}/>
              <div className="hm-badge" style={{ background: `linear-gradient(90deg,${sl.c1},${sl.c2})` }}>{sl.badge}</div>
            </div>
          </div>
        </div>

        <button className="hm-nav hm-nav-l" onClick={() => goTo((slide - 1 + SLIDES.length) % SLIDES.length)}><ChevronLeft size={16}/></button>
        <button className="hm-nav hm-nav-r" onClick={() => goTo((slide + 1) % SLIDES.length)}><ChevronRight size={16}/></button>
        <div className="hm-dots">
          {SLIDES.map((_, i) => (
            <button key={i} className={`hm-dot${i === slide ? ' on' : ''}`}
              style={i === slide ? { background: sl.c1, width: 22 } : {}}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </section>

      {/* ── FEATURES BAR ── */}
      <div className="hm-feats">
        <div className="container hm-feats-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="hm-feat">
              <div className="hm-feat-ico" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
              <div>
                <div className="hm-feat-title">{f.title}</div>
                <div className="hm-feat-sub">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="hm-sec hm-white">
          <div className="container">
            <div className="hm-sec-head">
              <div><div className="hm-bar"/><h2>Shop by Category</h2><p>Find exactly what you're looking for</p></div>
              <Link to="/products" className="hm-more">View All <ArrowRight size={13}/></Link>
            </div>
            <div className="hm-cats">
              {categories.map(cat => (
                <Link key={cat.id} to={`/products?category_name=${encodeURIComponent(cat.name)}`} className="hm-cat">
                  <div className="hm-cat-circle">
                    <span className="hm-cat-letter">{cat.name.charAt(0)}</span>
                  </div>
                  <span className="hm-cat-name">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ── */}
      <section className="hm-sec hm-gray">
        <div className="container">
          <div className="hm-sec-head">
            <div><div className="hm-bar"/><h2>Featured Products</h2><p>Handpicked deals just for you</p></div>
            <Link to="/products" className="hm-more">View All <ArrowRight size={13}/></Link>
          </div>
          {loading ? (
            <div className="grid-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 200, marginBottom: 12 }}/>
                  <div className="skeleton" style={{ height: 14, marginBottom: 8 }}/>
                  <div className="skeleton" style={{ height: 12, width: '60%' }}/>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid-4">
              {products.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          ) : (
            <div className="empty-state"><ShoppingBag size={48}/><h3>No products yet</h3><p>Check back soon.</p></div>
          )}
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section className="hm-trending">
        <div className="container hm-trending-wrap">
          <div className="hm-trending-left">
            <div className="hm-trend-badge"><TrendingUp size={13}/> Trending Now</div>
            <h2>What's Hot<br/>This <span>Season</span></h2>
            <p>Handpicked by our style experts. Updated every week with the freshest picks.</p>
            <Link to="/products" className="hm-btn-fill" style={{ background: 'linear-gradient(90deg,#ff3f6c,#ff905a)', textDecoration: 'none' }}>
              <Sparkles size={14}/> Explore Trending
            </Link>
          </div>
          <div className="hm-trend-cards">
            {TRENDING.map((item, i) => (
              <Link key={i} to="/products" className="hm-trend-card" style={{ background: item.bg }}>
                <span className="hm-trend-emoji">{item.emoji}</span>
                <span className="hm-trend-label">{item.label}</span>
                <span className="hm-trend-off" style={{ color: item.color }}>{item.off}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SELL CTA ── */}
      <section className="hm-cta">
        <div className="container hm-cta-wrap">
          <div className="hm-cta-left">
            <span className="hm-eyebrow" style={{ color: '#ff3f6c', borderColor: '#ff3f6c55', background: '#ff3f6c12' }}>
              <Sparkles size={11}/> For Sellers
            </span>
            <h2>Start Selling on <em>MyShop</em> Today</h2>
            <p>Join thousands of sellers reaching millions of customers. Easy setup, powerful analytics, and instant payouts.</p>
            <div className="hm-cta-btns">
              <Link to="/register" className="hm-btn-fill" style={{ background: 'linear-gradient(90deg,#ff3f6c,#ff905a)' }}>
                Become a Seller <ArrowRight size={15}/>
              </Link>
              <Link to="/products" className="hm-btn-ghost-light">Browse Products</Link>
            </div>
          </div>
          <div className="hm-cta-tiles">
            {[['📦','Easy Listing'],['💰','Fast Payouts'],['📊','Analytics'],['🚀','Grow Fast']].map(([ico, lbl], i) => (
              <div key={i} className="hm-cta-tile"><span>{ico}</span><span>{lbl}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="hm-nl">
        <div className="container hm-nl-wrap">
          <h2>Get Exclusive Deals in Your Inbox</h2>
          <p>Subscribe and be the first to know about flash sales, new arrivals, and special offers.</p>
          {subbed ? (
            <div className="hm-nl-ok">🎉 You're subscribed! Check your inbox for a welcome gift.</div>
          ) : (
            <form className="hm-nl-form" onSubmit={e => { e.preventDefault(); if (email) setSubbed(true); }}>
              <input type="email" placeholder="Enter your email address" value={email} onChange={e => setEmail(e.target.value)} required/>
              <button type="submit" className="hm-btn-fill" style={{ background: '#ff3f6c', flexShrink: 0 }}>
                Subscribe <ArrowRight size={14}/>
              </button>
            </form>
          )}
          <span className="hm-nl-note">No spam. Unsubscribe anytime.</span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="hm-footer">
        <div className="container">
          <div className="hm-footer-grid">
            <div className="hm-footer-brand">
              <div className="hm-footer-logo"><ShoppingBag size={15}/><span>My<em>Shop</em></span></div>
              <p>India's favourite online shopping destination for fashion, electronics, and lifestyle products.</p>
              <div className="hm-footer-socials">
                {['📘','📸','🐦','▶️'].map((s, i) => <a key={i} href="#">{s}</a>)}
              </div>
            </div>
            <div className="hm-footer-col">
              <h4>Company</h4>
              <Link to="/">About Us</Link><Link to="/">Careers</Link><Link to="/">Blog</Link>
            </div>
            <div className="hm-footer-col">
              <h4>Help</h4>
              <Link to="/">FAQ</Link><Link to="/">Shipping</Link>
              <Link to="/returns">Returns</Link><Link to="/orders">Track Order</Link>
            </div>
            <div className="hm-footer-col">
              <h4>Contact</h4>
              <span>help@myshop.com</span><span>+91 98765 43210</span><span>Mon–Sat, 9am–6pm</span>
            </div>
          </div>
          <div className="hm-footer-bottom">
            <span>© 2025 MyShop. All rights reserved.</span>
            <div className="hm-footer-tags">
              <span>🔒 SSL Secured</span><span>✅ Verified Seller</span><span>🇮🇳 Made in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
