import React from 'react';
import { ShoppingCart, Check, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../services/api';

const ProductCard = ({ product }) => {
  const { addToCart, cart } = useCart();

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // Check if item is already in cart
  const cartItem = cart.find((item) => item.product._id === product._id);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const isMaxInCart = cartQty >= product.stock;

  // Compute simulated original MRP (~30% higher)
  const originalMrp = Math.round(product.price * 1.32);
  const discountPercent = Math.round(((originalMrp - product.price) / originalMrp) * 100);

  // Generate deterministic rating based on product name length
  const ratingValue = (4.3 + (product.name.length % 6) * 0.1).toFixed(1);
  const reviewCount = 60 + (product.name.length * 11) % 180;

  const handleAdd = () => {
    if (!isOutOfStock && !isMaxInCart) {
      addToCart(product, 1);
    }
  };

  return (
    <article className="product-card" id={`product-${product._id}`}>
      {/* Product Image Container */}
      <div className="product-img-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Floating Badges */}
        <div className="product-card-badges-row">
          <span className="badge-discount">{discountPercent}% OFF</span>
          {product.featured && <span className="badge badge-accent">Featured</span>}
        </div>
      </div>

      {/* Product Details */}
      <div className="product-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span className="product-category-name">{product.category}</span>
          <div className="rating-stars">
            <Star size={13} fill="#f59e0b" color="#f59e0b" />
            <span>{ratingValue}</span>
            <span className="rating-count">({reviewCount})</span>
          </div>
        </div>

        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>
        <p className="product-description">{product.description}</p>

        {/* Pricing and Action */}
        <div className="product-card-footer">
          <div className="product-price-block">
            <div className="product-mrp-row">
              <span className="product-mrp-val">{formatPrice(originalMrp)}</span>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700' }}>
                Save {formatPrice(originalMrp - product.price)}
              </span>
            </div>
            <span className="product-price-val">{formatPrice(product.price)}</span>
            <span
              className={`product-stock-tag ${
                isOutOfStock ? 'stock-out' : isLowStock ? 'stock-low' : 'stock-in'
              }`}
            >
              <span className="stock-dot"></span>
              {isOutOfStock
                ? 'Out of Stock'
                : isLowStock
                ? `Only ${product.stock} left!`
                : 'In Stock'}
            </span>
          </div>

          <button
            className={`btn btn-sm ${cartQty > 0 ? 'btn-primary' : 'btn-outline'}`}
            onClick={handleAdd}
            disabled={isOutOfStock || isMaxInCart}
            title={
              isOutOfStock
                ? 'Product is out of stock'
                : isMaxInCart
                ? 'Reached maximum stock available'
                : 'Add to Cart'
            }
          >
            {cartQty > 0 ? (
              <>
                <Check size={15} /> Added ({cartQty})
              </>
            ) : (
              <>
                <ShoppingCart size={15} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
