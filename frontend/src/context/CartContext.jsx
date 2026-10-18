import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'apnicart_cart';
const SESSION_STORAGE_KEY = 'apnicart_demo_session_id';

// Threshold: ₹999 = 99900 paise
export const FREE_DELIVERY_THRESHOLD = 99900;
// Delivery charge: ₹49 = 4900 paise
export const STANDARD_DELIVERY_CHARGE = 4900;

export const CartProvider = ({ children }) => {
  // Initialize Demo Session ID
  const [demoSessionId] = useState(() => {
    let stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      stored = 'session_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(SESSION_STORAGE_KEY, stored);
    }
    return stored;
  });

  // Initialize Cart State from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return [];
    }
  });

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 3200);
  };

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  // Add Item to Cart
  const addToCart = (product, quantity = 1) => {
    if (!product || !product._id) return;

    if (product.stock <= 0) {
      showToast(`Sorry, "${product.name}" is currently out of stock.`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product._id === product._id);

      if (existingIndex > -1) {
        const existingItem = prevCart[existingIndex];
        const newQty = existingItem.quantity + quantity;

        if (newQty > product.stock) {
          showToast(`Maximum stock reached for "${product.name}" (${product.stock} available).`, 'info');
          const updated = [...prevCart];
          updated[existingIndex] = { ...existingItem, quantity: product.stock };
          return updated;
        }

        const updated = [...prevCart];
        updated[existingIndex] = { ...existingItem, quantity: newQty };
        showToast(`Updated "${product.name}" quantity to ${newQty}.`, 'success');
        return updated;
      } else {
        const addedQty = Math.min(quantity, product.stock);
        showToast(`Added "${product.name}" to cart!`, 'success');
        return [...prevCart, { product, quantity: addedQty }];
      }
    });
  };

  // Update Item Quantity
  const updateQuantity = (productId, newQuantity) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product._id === productId) {
          const maxStock = item.product.stock;
          let boundedQty = parseInt(newQuantity, 10);
          if (isNaN(boundedQty) || boundedQty < 1) boundedQty = 1;
          if (boundedQty > maxStock) {
            showToast(`Only ${maxStock} units available for this item.`, 'info');
            boundedQty = maxStock;
          }
          return { ...item, quantity: boundedQty };
        }
        return item;
      });
    });
  };

  // Remove Item from Cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const itemToRemove = prevCart.find((item) => item.product._id === productId);
      if (itemToRemove) {
        showToast(`Removed "${itemToRemove.product.name}" from cart.`, 'info');
      }
      return prevCart.filter((item) => item.product._id !== productId);
    });
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Computed Totals
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const subtotal = cart.reduce(
    (total, item) => total + (item.product.price || 0) * item.quantity,
    0
  );

  const deliveryCharge =
    cart.length === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_CHARGE;

  const totalAmount = subtotal + deliveryCharge;

  return (
    <CartContext.Provider
      value={{
        cart,
        demoSessionId,
        itemCount,
        subtotal,
        deliveryCharge,
        totalAmount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toast,
        showToast,
        setToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
