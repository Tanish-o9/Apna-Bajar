import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import Login from './pages/Login';

import './styles/global.css';
import './styles/components.css';

// Toast Notification Floating Overlay
const ToastOverlay = () => {
  const { toast } = useCart();
  if (!toast) return null;

  return (
    <div className="toast-container">
      <div className={`toast-item toast-${toast.type || 'info'}`}>
        {toast.type === 'error' ? (
          <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
        ) : toast.type === 'info' ? (
          <Info size={18} style={{ color: 'var(--primary)' }} />
        ) : (
          <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

const AppContent = () => {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ToastOverlay />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
