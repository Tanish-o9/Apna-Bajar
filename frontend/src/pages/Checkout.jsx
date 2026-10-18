import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MapPin,
  Lock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrderApi, formatPrice } from '../services/api';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const Checkout = () => {
  const { cart, subtotal, deliveryCharge, totalAmount, demoSessionId, clearCart, showToast } =
    useCart();
  const navigate = useNavigate();

  // Form Fields
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Validate form client-side
  const validate = () => {
    const errs = {};

    if (!formData.customerName.trim() || formData.customerName.trim().length < 2) {
      errs.customerName = 'Please enter your full name (minimum 2 characters)';
    }

    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!formData.email.trim() || !emailPattern.test(formData.email)) {
      errs.email = 'Please provide a valid email address';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      errs.phone = 'Please enter a valid 10-digit Indian phone number starting with 6-9';
    }

    if (!formData.address.trim()) {
      errs.address = 'Street / delivery address is required';
    }

    if (!formData.city.trim()) {
      errs.city = 'City is required';
    }

    if (!formData.state.trim()) {
      errs.state = 'State is required';
    }

    const pinPattern = /^[1-9][0-9]{5}$/;
    if (!formData.pincode.trim() || !pinPattern.test(formData.pincode.trim())) {
      errs.pincode = 'Please enter a valid 6-digit Indian PIN code';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    if (cart.length === 0) {
      setApiError('Your cart is empty. Please add items before checking out.');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        demoSessionId,
        customerName: formData.customerName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''),
        shippingAddress: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        items: cart.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
      };

      const res = await createOrderApi(orderPayload, demoSessionId);

      if (res && res.success) {
        clearCart();
        showToast('🎉 Order placed successfully! Redirecting to orders...', 'success');
        setTimeout(() => {
          navigate('/orders', { state: { newOrderPlaced: true, orderId: res.data._id } });
        }, 600);
      } else {
        setApiError(res.message || 'Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const errMsg =
        err.response?.data?.message ||
        'An unexpected error occurred while processing your order. Please check your network and try again.';
      setApiError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon-box" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              <AlertCircle size={36} />
            </div>
            <h2 className="empty-state-title">Your Cart is Empty</h2>
            <p className="empty-state-desc">
              You must have at least one item in your cart to proceed with checkout.
            </p>
            <Link to="/products" className="btn btn-primary">
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Checkout Stepper Bar */}
        <div className="checkout-stepper">
          <div className="checkout-step">
            <span className="step-num">✓</span>
            <span>1. Review Cart</span>
          </div>
          <span style={{ color: 'var(--border-color)', fontWeight: 'bold' }}>—</span>
          <div className="checkout-step active">
            <span className="step-num">2</span>
            <span>2. Shipping &amp; Payment</span>
          </div>
          <span style={{ color: 'var(--border-color)', fontWeight: 'bold' }}>—</span>
          <div className="checkout-step">
            <span className="step-num">3</span>
            <span>3. Order Placed</span>
          </div>
        </div>

        {/* Page Heading */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.4rem' }}>Shipping &amp; Checkout</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Enter your delivery information to complete your order with Cash on Delivery.
          </p>
        </div>

        {apiError && (
          <div
            style={{
              padding: '1.15rem 1.4rem',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <AlertCircle size={22} />
            <span style={{ fontSize: '0.925rem', fontWeight: '600' }}>{apiError}</span>
          </div>
        )}

        <div className="checkout-layout">
          {/* Left Panel: Customer Shipping Form */}
          <div className="checkout-form-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <MapPin size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Delivery Address</h2>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                {/* Full Name */}
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="customerName">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    className={`form-input ${errors.customerName ? 'input-error' : ''}`}
                    placeholder="e.g. Aarav Sharma"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                  />
                  {errors.customerName && <span className="field-error-msg">{errors.customerName}</span>}
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="aarav@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <span className="field-error-msg">{errors.email}</span>}
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Mobile Phone (10 digits) *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    maxLength={10}
                    className={`form-input ${errors.phone ? 'input-error' : ''}`}
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                  {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
                </div>

                {/* Street Address */}
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="address">
                    Complete Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className={`form-input ${errors.address ? 'input-error' : ''}`}
                    placeholder="Flat/House No., Street Name, Landmark"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                  {errors.address && <span className="field-error-msg">{errors.address}</span>}
                </div>

                {/* City */}
                <div className="form-group">
                  <label className="form-label" htmlFor="city">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className={`form-input ${errors.city ? 'input-error' : ''}`}
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                  {errors.city && <span className="field-error-msg">{errors.city}</span>}
                </div>

                {/* State */}
                <div className="form-group">
                  <label className="form-label" htmlFor="state">
                    State *
                  </label>
                  <select
                    id="state"
                    name="state"
                    className={`form-input ${errors.state ? 'input-error' : ''}`}
                    value={formData.state}
                    onChange={handleChange}
                    required
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {errors.state && <span className="field-error-msg">{errors.state}</span>}
                </div>

                {/* PIN Code */}
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="pincode">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    maxLength={6}
                    className={`form-input ${errors.pincode ? 'input-error' : ''}`}
                    placeholder="560001"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                  />
                  {errors.pincode && <span className="field-error-msg">{errors.pincode}</span>}
                </div>
              </div>

              {/* Payment Method Selector Card */}
              <div className="cod-badge-box">
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Cash on Delivery (Simulated)</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Pay safely with cash or QR code / UPI upon doorstep delivery. Zero risk.
                  </p>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={isSubmitting}
                id="place-order-submit-btn"
                style={{ fontSize: '1.1rem' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="spinner" /> Securing &amp; Processing Order...
                  </>
                ) : (
                  <>
                    Confirm Order ({formatPrice(totalAmount)}) <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <Link to="/cart" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ArrowLeft size={15} /> Modify Shopping Cart
                </Link>
              </div>
            </form>
          </div>

          {/* Right Panel: Order Summary Preview */}
          <aside className="summary-card">
            <h2 className="summary-title">Order Items ({cart.length})</h2>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.35rem' }}>
              {cart.map((item) => (
                <div
                  key={item.product._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    padding: '0.65rem 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: '700',
                          color: 'var(--text-main)',
                          maxWidth: '180px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.product.name}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Qty: {item.quantity} &times; {formatPrice(item.product.price)}
                      </div>
                    </div>
                  </div>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {formatPrice((item.product.price || 0) * item.quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>
                {deliveryCharge === 0 ? (
                  <strong style={{ color: 'var(--success)' }}>FREE</strong>
                ) : (
                  formatPrice(deliveryCharge)
                )}
              </span>
            </div>

            <div className="summary-row total-row">
              <span>Grand Total</span>
              <span style={{ color: 'var(--primary)' }}>{formatPrice(totalAmount)}</span>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                padding: '0.85rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: '1.45',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <Lock size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Academic Evaluation Mode</span>
              </div>
              Orders are associated with your isolated session token. No real monetary transactions will occur.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
