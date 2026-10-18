import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, ShoppingCart, Menu, X, Package, Home, Compass, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { itemCount } = useCart();
  const [searchInput, setSearchInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchInput.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
  };

  return (
    <>
      {/* Top Promotional Announcement Banner */}
      <div className="top-announcement-bar">
        <span className="top-announcement-tag">Special Offer</span>
        <span>
          Flat ₹200 OFF using coupon <strong>APNICART200</strong> • Free Express Delivery across India on orders above ₹999!
        </span>
      </div>

      <header className="navbar">
        <div className="container navbar-container">
          {/* Brand Logo */}
          <Link to="/" className="navbar-brand">
            <div className="brand-icon-wrapper">
              <ShoppingBag size={22} />
            </div>
            <span>
              Apni<span className="brand-text-accent">Cart</span>
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <Search size={18} className="navbar-search-icon" />
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search electronic gadgets, fashion apparel, accessories..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="navbar-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </form>

          {/* Desktop Navigation Links */}
          <nav>
            <ul className="navbar-nav">
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Home size={17} /> Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Compass size={17} /> Products
                </NavLink>
              </li>
              <li>
                <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Package size={17} /> My Orders
                </NavLink>
              </li>
              <li>
                <Link to="/cart" className="cart-btn-link" aria-label="Shopping Cart">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Mobile Cart & Hamburger Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/cart" className="cart-btn-link mobile-cart-btn" aria-label="Shopping Cart" style={{ display: 'none' }}>
              <ShoppingCart size={20} />
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </Link>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1.25rem', position: 'relative' }}>
            <Search size={18} className="navbar-search-icon" />
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Home size={17} /> Home
            </Link>
            <Link to="/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Compass size={17} /> Explore Catalog
            </Link>
            <Link to="/cart" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              <ShoppingCart size={17} /> Cart ({itemCount} items)
            </Link>
            <Link to="/orders" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Package size={17} /> My Orders
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
