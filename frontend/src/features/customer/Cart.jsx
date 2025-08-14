import React, { useState, useEffect } from 'react';
import { getCart, updateCartItem, removeFromCart } from '../../services/instantBuyAPI';
import { formatCurrency } from '../../utils/currencyUtils';
import './Cart.css';

const Cart = ({ onCheckout }) => {
  const [cartData, setCartData] = useState({
    cart_items: [],
    subtotal: 0,
    platform_fee: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      setCartData(response.data);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Find the cart item to check stock
    const cartItem = cartData.cart_items.find(item => item.id === cartItemId);
    if (cartItem && newQuantity > cartItem.product.stock_quantity) {
      alert(`Only ${cartItem.product.stock_quantity} items available in stock`);
      return;
    }
    
    try {
      setUpdatingItem(cartItemId);
      await updateCartItem(cartItemId, newQuantity);
      await loadCart(); // Refresh cart
    } catch (error) {
      console.error('Error updating cart:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to update cart item');
      }
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (!window.confirm('Remove this item from your cart?')) {
      return;
    }

    try {
      setUpdatingItem(cartItemId);
      await removeFromCart(cartItemId);
      await loadCart(); // Refresh cart
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item from cart');
    } finally {
      setUpdatingItem(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2 className="cart-title">Shopping Cart</h2>
        <p className="cart-subtitle">Review your items before checkout</p>
      </div>

      {cartData.cart_items.length === 0 ? (
        <div className="empty-cart">
          <span className="empty-icon">🛒</span>
          <h3>Your cart is empty</h3>
          <p>Browse our marketplace to add some fresh products</p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartData.cart_items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.title} />
                  ) : (
                    <div className="placeholder-image">
                      <span>🌱</span>
                    </div>
                  )}
                </div>

                <div className="item-details">
                  <h3 className="item-title">{item.product.title}</h3>
                  <p className="item-farmer">by {item.product.farmer?.name || 'Farmer'}</p>
                  <div className="item-price">
                    <span className="unit-price">{formatCurrency(item.product.price)} each</span>
                  </div>
                </div>

                <div className="item-controls">
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={updatingItem === item.id || item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={updatingItem === item.id || item.quantity >= item.product.stock_quantity}
                    >
                      +
                    </button>
                  </div>
                  
                  {item.product.stock_quantity < 10 && (
                    <div className="stock-warning">
                      <span className="warning-icon">⚠️</span>
                      <span className="warning-text">Only {item.product.stock_quantity} left</span>
                    </div>
                  )}

                  <div className="item-total">
                    <span className="total-label">Total:</span>
                    <span className="total-price">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>

                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={updatingItem === item.id}
                  >
                    {updatingItem === item.id ? (
                      <span className="btn-spinner"></span>
                    ) : (
                      <span className="remove-icon">🗑️</span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-section">
              <h3 className="summary-title">Order Summary</h3>
              
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">{formatCurrency(cartData.subtotal)}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Platform Fee (10%):</span>
                <span className="summary-value">{formatCurrency(cartData.platform_fee)}</span>
              </div>

              <div className="summary-row total-row">
                <span className="summary-label">Total:</span>
                <span className="summary-value total-value">{formatCurrency(cartData.total)}</span>
              </div>

              <div className="checkout-section">
                <div className="payment-info">
                  <span className="payment-icon">💵</span>
                  <span className="payment-text">Cash on Delivery</span>
                </div>

                <button 
                  className="checkout-btn"
                  onClick={() => onCheckout(cartData)}
                >
                  <span className="btn-icon">✅</span>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;