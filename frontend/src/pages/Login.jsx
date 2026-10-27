import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { loginApi, registerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { login } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleFillDemo = () => {
    setIsRegister(false);
    setFormData({
      name: '',
      email: 'demo@apnicart.com',
      password: 'password123',
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.email.trim() || !formData.password) {
      setError('Please provide all required fields');
      return;
    }

    if (isRegister && (!formData.name.trim() || formData.name.trim().length < 2)) {
      setError('Please enter a valid full name (minimum 2 characters)');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const res = await registerApi(formData.name, formData.email, formData.password);
        if (res && res.success) {
          login(res.user, res.token);
          showToast(`Welcome to ApniCart, ${res.user.name}!`, 'success');
          navigate(from, { replace: true });
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        const res = await loginApi(formData.email, formData.password);
        if (res && res.success && res.token) {
          login(res.user, res.token);
          showToast(`Welcome back, ${res.user.name}!`, 'success');
          navigate(from, { replace: true });
        } else {
          setError(res.message || 'Invalid email or password');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication request failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '480px' }}>
      <div className="summary-card" style={{ padding: '2.25rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
            }}
          >
            {isRegister ? <UserPlus size={28} /> : <LogIn size={28} />}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {isRegister ? 'Create Your Account' : 'Welcome to ApniCart'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isRegister
              ? 'Join ApniCart for instant checkout and order tracking'
              : 'Sign in to access your orders and saved cart items'}
          </p>
        </div>

        {/* Demo Credentials Quick Fill Banner */}
        <div
          style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={14} style={{ color: 'var(--primary)' }} /> Demo Credentials
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              demo@apnicart.com • password123
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="btn btn-sm"
            style={{
              fontSize: '0.75rem',
              padding: '0.3rem 0.65rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
            }}
          >
            Auto Fill
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundColor: !isRegister ? 'var(--bg-card)' : 'transparent',
              color: !isRegister ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundColor: isRegister ? 'var(--bg-card)' : 'transparent',
              color: isRegister ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <label htmlFor="auth-name" className="form-label" style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Tanish Rajput"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                />
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.15rem' }}>
            <label htmlFor="auth-email" className="form-label" style={{ fontWeight: '600', fontSize: '0.875rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="auth-password" className="form-label" style={{ fontWeight: '600', fontSize: '0.875rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="form-control"
                style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ fontWeight: '700', fontSize: '1rem', width: '100%' }}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
