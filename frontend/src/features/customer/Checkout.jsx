import React, { useState } from 'react';
import { placeOrder } from '../../services/instantBuyAPI';
import { formatCurrency } from '../../utils/currencyUtils';
import './Checkout.css';

const Checkout = ({ cartData, onOrderSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await placeOrder(formData);
      onOrderSuccess(response.data.order);
    } catch (error) {
      console.error('Error placing order:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.response?.data?.error || 'Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <button className="back-btn" onClick={onBack}>
          <span className="back-icon">←</span>
          Back to Cart
        </button>
        <div>
          <h2 className="checkout-title">Checkout</h2>
          <p className="checkout-subtitle">Complete your order</p>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-section">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📋</span>
                Delivery Information
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`form-input ${errors.first_name ? 'error' : ''}`}
                    placeholder="Enter your first name"
                  />
                  {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">👤</span>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`form-input ${errors.last_name ? 'error' : ''}`}
                    placeholder="Enter your last name"
                  />
                  {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📍</span>
                    Delivery Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`form-textarea ${errors.address ? 'error' : ''}`}
                    placeholder="Enter your complete delivery address"
                    rows={3}
                  />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📞</span>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className={`form-input ${errors.phone_number ? 'error' : ''}`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">💳</span>
                Payment Method
              </h3>

              <div className="payment-method">
                <div className="payment-option selected">
                  <span className="payment-icon">💵</span>
                  <div className="payment-details">
                    <span className="payment-name">Cash on Delivery</span>
                    <span className="payment-description">Pay when your order arrives</span>
                  </div>
                  <span className="payment-check">✅</span>
                </div>
              </div>
            </div>

            <div className="checkout-actions">
              <button type="button" className="cancel-btn" onClick={onBack}>
                <span className="btn-icon">❌</span>
                Cancel
              </button>
              <button type="submit" className="place-order-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🛍️</span>
                    Place Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="order-summary-section">
          <div className="order-summary-card">
            <h3 className="summary-title">Order Summary</h3>

            <div className="order-items">
              {cartData.cart_items.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <span className="item-name">{item.product.title}</span>
                    <span className="item-quantity">× {item.quantity}</span>
                  </div>
                  <span className="item-total">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-totals">
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
                <span className="summary-value">{formatCurrency(cartData.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;