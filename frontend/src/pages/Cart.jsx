import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  Truck,
  ShieldCheck,
  Trash2,
  Tag,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useCart, FREE_DELIVERY_THRESHOLD } from '../context/CartContext';
import CartItem from '../components/CartItem';
import { formatPrice } from '../services/api';

const Cart = () => {
  const { cart, subtotal, deliveryCharge, totalAmount, clearCart, showToast } = useCart();
  const navigate = useNavigate();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in paise
  const [couponApplied, setCouponApplied] = useState(false);

  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal;
  const deliveryProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    if (couponCode.trim().toUpperCase() === 'APNICART200') {
      if (subtotal < 50000) {
        showToast('Coupon APNICART200 requires a minimum order of ₹500', 'info');
        return;
      }
      setAppliedDiscount(20000); // ₹200 = 20,000 paise
      setCouponApplied(true);
      showToast('🎉 Coupon APNICART200 applied! You saved ₹200.', 'success');
    } else {
      showToast('Invalid coupon code. Try using APNICART200', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setAppliedDiscount(0);
    setCouponCode('');
    showToast('Coupon removed', 'info');
  };

  const finalTotalAmount = Math.max(0, totalAmount - appliedDiscount);

  if (cart.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon-box">
              <ShoppingCart size={38} />
            </div>
            <h2 className="empty-state-title">Your Shopping Cart is Empty</h2>
            <p className="empty-state-desc">
              Looks like you haven't added anything to your cart yet. Explore our verified collection and discover something you love!
            </p>
            <Link to="/products" className="btn btn-primary btn-lg" id="empty-cart-shop-btn">
              Explore Catalog <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>Your Shopping Cart</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
              Review your items, apply promotional coupons, and proceed to secure checkout.
            </p>
          </div>
          <button
            onClick={clearCart}
            className="btn btn-sm"
            style={{ color: 'var(--danger)', border: '1.5px solid #fecaca', backgroundColor: '#fef2f2' }}
          >
            <Trash2 size={14} /> Clear Cart
          </button>
        </div>

        {/* 2-Column Cart Layout */}
        <div className="cart-layout">
          {/* Left Column: Cart Items Panel */}
          <div className="cart-items-panel">
            {/* Free Shipping Milestone Progress Bar */}
            <div className="free-shipping-progress-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-main)' }}>
                  <Truck size={18} style={{ color: 'var(--primary)' }} />
                  {isFreeDelivery ? (
                    <span style={{ color: 'var(--success)' }}>
                      🎉 Congratulations! You unlocked <strong>FREE Express Delivery</strong>!
                    </span>
                  ) : (
                    <span>
                      Add <strong>{formatPrice(remainingForFreeDelivery)}</strong> more to get <strong>FREE Express Delivery</strong>
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{deliveryProgress}%</span>
              </div>

              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${deliveryProgress}%` }}></div>
              </div>
            </div>

            <div style={{ paddingBottom: '0.85rem', borderBottom: '1.5px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cart Items ({cart.length})
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Prices in INR</span>
            </div>

            <div>
              {cart.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/products')}
              >
                <ArrowLeft size={16} /> Continue Shopping
              </button>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <aside className="summary-card">
            <h2 className="summary-title">Order Summary</h2>

            {/* Promo Code Input Box */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
                Apply Coupon Code
              </label>
              {!couponApplied ? (
                <form onSubmit={handleApplyCoupon} className="coupon-input-group">
                  <input
                    type="text"
                    className="coupon-input"
                    placeholder="Enter APNICART200"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: '700' }}>
                    Apply
                  </button>
                </form>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    backgroundColor: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--success)',
                    fontWeight: '600',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} /> APNICART200 (-₹200)
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'underline' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="summary-row">
              <span>Items Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            {couponApplied && (
              <div className="summary-row" style={{ color: 'var(--success)' }}>
                <span>Coupon Discount</span>
                <strong>- {formatPrice(appliedDiscount)}</strong>
              </div>
            )}

            <div className="summary-row">
              <span>Estimated Delivery</span>
              <span>
                {deliveryCharge === 0 ? (
                  <strong style={{ color: 'var(--success)' }}>FREE</strong>
                ) : (
                  formatPrice(deliveryCharge)
                )}
              </span>
            </div>

            <div className="summary-row total-row">
              <span>Final Total</span>
              <span style={{ color: 'var(--primary)' }}>{formatPrice(finalTotalAmount)}</span>
            </div>

            {/* Proceed to Checkout CTA */}
            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: '1.75rem' }}
              onClick={() => navigate('/checkout')}
              id="proceed-to-checkout-btn"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>

            {/* Guarantees */}
            <div
              style={{
                marginTop: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                <span>Simulated Cash on Delivery (COD)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={16} style={{ color: 'var(--primary)' }} />
                <span>Estimated Delivery: 2-4 business days</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;
