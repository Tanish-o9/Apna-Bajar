import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Tv,
  Shirt,
  Watch,
  Home as HomeIcon,
  Truck,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Star,
  Flame,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../services/api';

const categoriesList = [
  { name: 'Electronics', icon: Tv, desc: 'ANC Audio, smart wearables & accessories' },
  { name: 'Fashion', icon: Shirt, desc: 'Classic denim, tees & athletic sneakers' },
  { name: 'Accessories', icon: Watch, desc: 'Leather wallets, backpacks & sunglasses' },
  { name: 'Home Essentials', icon: HomeIcon, desc: 'Minimalist lamps, mugs & diffusers' },
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadFeatured = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchProducts({ featured: true });
        if (isMounted) {
          if (res && res.data) {
            setFeaturedProducts(res.data);
          }
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
        if (isMounted) {
          setError('Could not connect to the backend server. Please verify the Express API is running on port 5000.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Dual-Column Modern Hero Banner */}
        <section className="hero-section">
          <div className="hero-grid">
            {/* Left Column Content */}
            <div className="hero-content">
              <div className="hero-pill">
                <Sparkles size={16} /> Certified Quality • Direct to Consumer
              </div>
              <h1 className="hero-title">
                Upgrade Your Everyday Essentials with{' '}
                <span className="hero-title-highlight">ApniCart</span>.
              </h1>
              <p className="hero-subtitle">
                Discover curated high-fidelity audio, timeless fashion, everyday accessories, and modern home decor. Verified quality with transparent prices and Cash on Delivery nationwide.
              </p>
              <div className="hero-buttons">
                <button
                  className="btn btn-accent btn-lg"
                  onClick={() => navigate('/products')}
                  id="hero-shop-now-btn"
                >
                  Shop Now <ArrowRight size={18} />
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'transparent' }}
                  onClick={() => navigate('/orders')}
                >
                  Track Orders
                </button>
              </div>

              {/* Social Proof Strip */}
              <div className="hero-social-proof">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={16} fill="#f59e0b" />
                  ))}
                </div>
                <span>
                  <strong>4.9 / 5</strong> rating from 12,000+ satisfied customers across India
                </span>
              </div>
            </div>

            {/* Right Column Showcase Card */}
            <div className="hero-showcase-card">
              <div className="hero-floating-badge badge-top-left">
                <Flame size={18} style={{ color: '#f97316' }} />
                <span>
                  <strong>Trending #1</strong> in Electronics
                </span>
              </div>

              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"
                alt="Featured Headphone"
                className="hero-showcase-img"
              />

              <div className="hero-floating-badge badge-bottom-right">
                <Zap size={18} style={{ color: '#eab308' }} />
                <span>
                  <strong>Free Express Delivery</strong> on orders &gt; ₹999
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Highlights */}
        <section className="trust-strip">
          <div className="trust-item">
            <div className="trust-icon-box" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.975rem', fontWeight: '700' }}>Free Express Delivery</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>On all orders above ₹999 across India</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <CreditCard size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.975rem', fontWeight: '700' }}>Cash on Delivery</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Pay comfortably at your doorstep</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.975rem', fontWeight: '700' }}>100% Authentic Quality</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Directly sourced &amp; verified items</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon-box" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.975rem', fontWeight: '700' }}>7-Day Easy Returns</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Hassle-free replacement guarantee</p>
            </div>
          </div>
        </section>

        {/* Explore Categories */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
                Curated Collections
              </span>
              <h2 style={{ fontSize: '1.85rem' }}>Browse by Category</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                Explore popular categories hand-picked for quality, durability, and style
              </p>
            </div>
            <Link to="/products" className="btn btn-outline btn-sm">
              View All <ArrowRight size={15} />
            </Link>
          </div>

          <div className="categories-grid">
            {categoriesList.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.name}
                  className="category-card"
                  onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                >
                  <div className="category-icon-box">
                    <IconComp size={30} />
                  </div>
                  <div>
                    <h3 className="category-name">{cat.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                      {cat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured Products Section */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: '0.4rem' }}>
                Weekly Bestsellers
              </span>
              <h2 style={{ fontSize: '1.85rem' }}>Featured Products</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                Top-rated items loved by thousands of shoppers this season
              </p>
            </div>
            <Link to="/products" className="btn btn-outline btn-sm">
              See Full Catalog <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="products-grid">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="product-card"
                  style={{ height: '390px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  <div className="skeleton" style={{ height: '210px', width: '100%' }}></div>
                  <div className="skeleton" style={{ height: '18px', width: '35%' }}></div>
                  <div className="skeleton" style={{ height: '26px', width: '85%' }}></div>
                  <div className="skeleton" style={{ height: '38px', width: '100%', marginTop: 'auto' }}></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="empty-state">
              <h3 className="empty-state-title">Backend API Notice</h3>
              <p className="empty-state-desc">{error}</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Retry Connection
              </button>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="empty-state">
              <h3 className="empty-state-title">No Featured Products</h3>
              <p className="empty-state-desc">Featured items will appear here once seeded in the database.</p>
              <Link to="/products" className="btn btn-primary">
                Browse Full Catalog
              </Link>
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Promotional Offer Banner */}
        <section className="promo-banner">
          <div className="promo-text">
            <h3>Special Welcome Discount — Flat ₹200 OFF</h3>
            <p style={{ marginBottom: '1rem' }}>
              Apply coupon <span className="promo-coupon-badge">APNICART200</span> at checkout on your first order. Plus get Free Express Delivery on orders over ₹999!
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} style={{ color: '#34d399' }} /> Valid for all users
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} style={{ color: '#34d399' }} /> Instant checkout discount
              </span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ backgroundColor: '#ffffff', color: 'var(--primary)', fontWeight: '800', flexShrink: 0 }}
            onClick={() => navigate('/products')}
          >
            Claim Offer Now <ArrowRight size={18} />
          </button>
        </section>
      </div>
    </div>
  );
};

export default Home;
