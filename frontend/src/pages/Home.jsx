import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Truck, Shield, Headphones, ArrowRight,
  Zap, TrendingUp, Gift, Star, RefreshCw, Tag
} from 'lucide-react';
import { getProducts, getCategories } from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const CAT_EMOJIS = { Men:'👔', Women:'👗', Kids:'🧒', Electronics:'📱', Home:'🏠', Beauty:'💄', Sports:'⚽', Accessories:'👜', default:'🛍️' };

function DealTimer() {
  const [time, setTime] = useState({ h: 5, m: 42, s: 17 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime(p => {
        let { h, m, s } = p;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = n => String(n).padStart(2, '0');
  return (
    <div className="deal-timer">
      <div className="timer-box"><strong>{pad(time.h)}</strong><span>Hrs</span></div>
      <span className="timer-sep">:</span>
      <div className="timer-box"><strong>{pad(time.m)}</strong><span>Min</span></div>
      <span className="timer-sep">:</span>
      <div className="timer-box"><strong>{pad(time.s)}</strong><span>Sec</span></div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([p, c]) => { setProducts(p.data.slice(0, 8)); setCategories(c.data.slice(0, 8)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const features = [
    { icon: '🚚', color: '#fff0f3', title: 'Free Delivery', desc: 'On orders above ₹499' },
    { icon: '🔒', color: '#f0fff8', title: 'Secure Payment', desc: '100% safe & encrypted' },
    { icon: '🎧', color: '#f0f4ff', title: '24/7 Support',   desc: 'Always here to help' },
    { icon: '↩️', color: '#fffbf0', title: 'Easy Returns',   desc: '7-day hassle-free returns' },
  ];

  return (
    <div className="home">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text animate-left">
            <div className="hero-eyebrow"><Zap size={12}/> New Arrivals Every Day</div>
            <h1>India's Favourite<br/><span className="hero-highlight">Fashion & Lifestyle</span><br/>Destination</h1>
            <p>Discover 50,000+ products from top brands. Unbeatable prices, lightning-fast delivery.</p>
            <div className="hero-btns">
              <button onClick={() => navigate('/products')} className="btn btn-primary btn-lg">
                Shop Now <ArrowRight size={17}/>
              </button>
              <button onClick={() => navigate('/register')} className="btn btn-white btn-lg">
                Join Free
              </button>
            </div>
            <div className="hero-stats">
              <div className="h-stat"><strong>50K+</strong><span>Products</span></div>
              <div className="h-divider"/>
              <div className="h-stat"><strong>10K+</strong><span>Customers</span></div>
              <div className="h-divider"/>
              <div className="h-stat"><strong>4.8★</strong><span>Rating</span></div>
            </div>
          </div>

          <div className="hero-visual animate-right">
            <div className="hero-img-wrap">
              <div className="hero-circle-bg animate-float"/>
              <div className="hero-center-icon"><ShoppingBag size={100}/></div>
              <div className="hero-float-card fc1">
                <div className="fc-icon" style={{background:'rgba(255,63,108,0.2)'}}>🔥</div>
                <div><div style={{fontSize:11,opacity:0.7}}>Today's Deal</div><div>Up to 70% OFF</div></div>
              </div>
              <div className="hero-float-card fc2">
                <div className="fc-icon" style={{background:'rgba(255,144,90,0.2)'}}>⚡</div>
                <div><div style={{fontSize:11,opacity:0.7}}>Flash Sale</div><div>Ends in 5h</div></div>
              </div>
              <div className="hero-float-card fc3">
                <div className="fc-icon" style={{background:'rgba(56,128,255,0.2)'}}>🚚</div>
                <div><div style={{fontSize:11,opacity:0.7}}>Free Delivery</div><div>Above ₹499</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <div className="features-strip">
        <div className="features-strip-inner">
          {features.map((f, i) => (
            <div key={i} className="feat-item animate-fade" style={{animationDelay:`${i*0.08}s`}}>
              <div className="feat-icon" style={{background:f.color}}>{f.icon}</div>
              <div><h4>{f.title}</h4><p>{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROMO BANNERS ── */}
      <section className="section" style={{background:'#fff', paddingBottom:0}}>
        <div className="container">
          <div className="promo-grid">
            <Link to="/products?category_name=Women" className="promo-card promo-1">
              <div className="promo-bg"/>
              <span className="promo-tag">NEW</span>
              <div className="promo-card-content">
                <h3>Women's Fashion</h3>
                <p>Trending styles this season</p>
              </div>
            </Link>
            <Link to="/products?category_name=Electronics" className="promo-card promo-2">
              <div className="promo-bg"/>
              <span className="promo-tag">HOT</span>
              <div className="promo-card-content">
                <h3>Electronics</h3>
                <p>Latest gadgets & tech</p>
              </div>
            </Link>
            <Link to="/products?category_name=Sports" className="promo-card promo-3">
              <div className="promo-bg"/>
              <span className="promo-tag">SALE</span>
              <div className="promo-card-content">
                <h3>Sports & Fitness</h3>
                <p>Gear up for greatness</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      {categories.length > 0 && (
        <section className="section" style={{background:'#fff'}}>
          <div className="container">
            <div className="sec-header">
              <div className="sec-header-left">
                <div className="sec-line"/>
                <h2>Shop by Category</h2>
                <p>Find exactly what you're looking for</p>
              </div>
              <Link to="/products" className="btn btn-ghost btn-sm">View All <ArrowRight size={14}/></Link>
            </div>
            <div className="cats-scroll">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  to={`/products?category_name=${encodeURIComponent(cat.name)}`}
                  className="cat-pill animate-fade"
                  style={{animationDelay:`${i*0.06}s`}}
                >
                  <div className="cat-pill-icon">
                    {CAT_EMOJIS[cat.name] || CAT_EMOJIS.default}
                  </div>
                  <span className="cat-pill-name">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DEAL TIMER + PRODUCTS ── */}
      <section className="section">
        <div className="container">
          <div className="deal-banner animate-fade">
            <div className="deal-banner-left">
              <h3>⚡ Flash Sale — Deals of the Day</h3>
              <p>Grab them before they're gone!</p>
            </div>
            <DealTimer/>
          </div>

          {loading ? (
            <div className="grid-4">
              {[...Array(8)].map((_,i) => (
                <div key={i} className="card" style={{padding:16}}>
                  <div className="skeleton" style={{height:220,marginBottom:12}}/>
                  <div className="skeleton" style={{height:14,marginBottom:8}}/>
                  <div className="skeleton" style={{height:12,width:'60%'}}/>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid-4">
              {products.map((p, i) => (
                <div key={p.id} className="animate-fade" style={{animationDelay:`${i*0.05}s`}}>
                  <ProductCard product={p}/>
                </div>
              ))}
            </div>
          )}

          <div style={{textAlign:'center', marginTop:36}}>
            <Link to="/products" className="btn btn-outline btn-lg">
              View All Products <ArrowRight size={17}/>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SELL CTA ── */}
      <section className="cta-section">
        <div className="container cta-inner">
          <div className="cta-text animate-left">
            <h2>Start Selling on<br/><span style={{color:'#ff3f6c'}}>MyShop</span> Today</h2>
            <p>Join thousands of sellers reaching millions of customers. Easy setup, powerful analytics, and instant payouts.</p>
            <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
              <Link to="/register" className="btn btn-primary btn-lg">Become a Seller <ArrowRight size={17}/></Link>
              <Link to="/products" className="btn btn-ghost btn-lg" style={{color:'#fff', borderColor:'rgba(255,255,255,0.3)'}}>Browse Products</Link>
            </div>
          </div>
          <div className="cta-visual animate-right">
            <div className="cta-cards">
              {[
                {icon:'📦', label:'Easy Listing'},
                {icon:'💰', label:'Fast Payouts'},
                {icon:'📊', label:'Analytics'},
                {icon:'🚀', label:'Grow Fast'},
              ].map((c,i) => (
                <div key={i} className="cta-mini-card animate-fade" style={{animationDelay:`${i*0.1}s`}}>
                  <div className="cmc-icon">{c.icon}</div>
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div className="logo-icon"><ShoppingBag size={16}/></div>
                <span style={{fontSize:20,fontWeight:900,color:'#fff'}}>My<span style={{color:'#ff3f6c'}}>Shop</span></span>
              </div>
              <p>India's favourite online shopping destination for fashion, electronics, and lifestyle products.</p>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/">About Us</Link>
              <Link to="/">Careers</Link>
              <Link to="/">Press</Link>
              <Link to="/">Blog</Link>
            </div>
            <div className="footer-col">
              <h4>Help</h4>
              <Link to="/">FAQ</Link>
              <Link to="/">Shipping</Link>
              <Link to="/">Returns</Link>
              <Link to="/">Track Order</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <span>help@myshop.com</span>
              <span>+91 98765 43210</span>
              <span>Mon–Sat, 9am–6pm</span>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 MyShop. All rights reserved.</span>
            <div className="footer-badges">
              <span className="footer-badge">🔒 SSL Secured</span>
              <span className="footer-badge">✅ Verified Seller</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
