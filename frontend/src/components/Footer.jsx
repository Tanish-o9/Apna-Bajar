import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand info */}
          <div className="footer-col">
            <Link to="/" className="navbar-brand" style={{ color: '#ffffff' }}>
              <div className="brand-icon-wrapper">
                <ShoppingBag size={20} />
              </div>
              <span>
                Apni<span className="brand-text-accent" style={{ color: '#60a5fa' }}>Cart</span>
              </span>
            </Link>
            <p className="footer-desc">
              Your one-stop destination for authentic lifestyle, fashion, electronics, and home essentials. Fast delivery and reliable Cash on Delivery nationwide.
            </p>
            <div className="footer-demo-pill">
              Academic &amp; Bug-Hunting Evaluation Baseline
            </div>
          </div>

          {/* Categories */}
          <div className="footer-col">
            <h4>Categories</h4>
            <ul className="footer-links">
              <li>
                <Link to="/products?category=Electronics">Electronics</Link>
              </li>
              <li>
                <Link to="/products?category=Fashion">Fashion</Link>
              </li>
              <li>
                <Link to="/products?category=Accessories">Accessories</Link>
              </li>
              <li>
                <Link to="/products?category=Home%20Essentials">Home Essentials</Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/products">All Products</Link>
              </li>
              <li>
                <Link to="/cart">Shopping Cart</Link>
              </li>
              <li>
                <Link to="/orders">My Orders</Link>
              </li>
            </ul>
          </div>

          {/* Trust Guarantees */}
          <div className="footer-col">
            <h4>Why Choose ApniCart</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Truck size={18} style={{ color: '#38bdf8' }} />
                <span>Free delivery on orders over ₹999</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <ShieldCheck size={18} style={{ color: '#34d399' }} />
                <span>Simulated COD Payment with zero risk</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <RefreshCw size={18} style={{ color: '#fb923c' }} />
                <span>Real-time inventory and pricing sync</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} ApniCart. Developed for College Bug-Hunting Competition baseline.</p>
          <p>Built with React &amp; Express. All product trademarks belong to their respective owners.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
