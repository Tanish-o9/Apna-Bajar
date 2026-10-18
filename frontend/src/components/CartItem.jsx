import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../services/api';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product._id, quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < product.stock) {
      updateQuantity(product._id, quantity + 1);
    }
  };

  const handleRemove = () => {
    removeFromCart(product._id);
  };

  const lineTotal = (product.price || 0) * quantity;
  const isMax = quantity >= product.stock;

  return (
    <div className="cart-item-row" id={`cart-item-${product._id}`}>
      {/* Product Image */}
      <img
        src={product.image}
        alt={product.name}
        className="cart-item-img"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
        }}
      />

      {/* Product Details */}
      <div className="cart-item-info">
        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>
          {product.category}
        </span>
        <h4 className="cart-item-name">{product.name}</h4>
        <span className="cart-item-unit-price">
          Unit Price: <strong>{formatPrice(product.price)}</strong>
        </span>
        {isMax && (
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '500' }}>
            Max available stock ({product.stock}) selected
          </span>
        )}
      </div>

      {/* Quantity Stepper */}
      <div className="quantity-controls">
        <button
          type="button"
          className="qty-btn"
          onClick={handleDecrement}
          disabled={quantity <= 1}
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className="qty-display">{quantity}</span>
        <button
          type="button"
          className="qty-btn"
          onClick={handleIncrement}
          disabled={isMax}
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Line Total & Remove */}
      <div className="cart-item-actions">
        <span className="cart-line-total">{formatPrice(lineTotal)}</span>
        <button
          type="button"
          className="remove-btn"
          onClick={handleRemove}
          title="Remove from cart"
          aria-label="Remove item"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
