import React, { useState } from 'react';
import Marketplace from './Marketplace';
import Cart from './Cart';
import Checkout from './Checkout';
import OrderHistory from './OrderHistory';
import './InstantBuy.css';

const InstantBuy = () => {
  const [currentView, setCurrentView] = useState('marketplace');
  const [cartData, setCartData] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(null);

  const handleCheckout = (cartDataFromCart) => {
    setCartData(cartDataFromCart);
    setCurrentView('checkout');
  };

  const handleOrderSuccess = (order) => {
    setOrderPlaced(order);
    setCurrentView('order-success');
  };

  const handleBackToCart = () => {
    setCurrentView('cart');
  };

  const handleBackToMarketplace = () => {
    setCurrentView('marketplace');
  };

  const renderTabNavigation = () => (
    <div className="instant-buy-tabs">
      <button 
        className={`tab-btn ${currentView === 'marketplace' ? 'active' : ''}`}
        onClick={() => setCurrentView('marketplace')}
      >
        <span className="tab-icon">🛍️</span>
        Marketplace
      </button>
      <button 
        className={`tab-btn ${currentView === 'cart' ? 'active' : ''}`}
        onClick={() => setCurrentView('cart')}
      >
        <span className="tab-icon">🛒</span>
        Cart
      </button>
      <button 
        className={`tab-btn ${currentView === 'orders' ? 'active' : ''}`}
        onClick={() => setCurrentView('orders')}
      >
        <span className="tab-icon">📦</span>
        My Orders
      </button>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'marketplace':
        return <Marketplace />;
      
      case 'cart':
        return <Cart onCheckout={handleCheckout} />;
      
      case 'orders':
        return <OrderHistory />;
      
      case 'checkout':
        return (
          <Checkout 
            cartData={cartData}
            onOrderSuccess={handleOrderSuccess}
            onBack={handleBackToCart}
          />
        );
      
      case 'order-success':
        return (
          <div className="order-success">
            <div className="success-content">
              <span className="success-icon">🎉</span>
              <h2 className="success-title">Order Placed Successfully!</h2>
              <p className="success-message">
                Your order #{orderPlaced?.order_number} has been placed successfully.
              </p>
              <div className="success-details">
                <div className="detail-item">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value">${orderPlaced?.total_amount}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">Cash on Delivery</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value status-pending">Pending</span>
                </div>
              </div>
              <button 
                className="continue-shopping-btn"
                onClick={handleBackToMarketplace}
              >
                <span className="btn-icon">🛍️</span>
                Continue Shopping
              </button>
            </div>
          </div>
        );
      
      default:
        return <Marketplace />;
    }
  };

  return (
    <div className="customer-instant-buy">
      {currentView !== 'checkout' && currentView !== 'order-success' && renderTabNavigation()}
      {renderContent()}
    </div>
  );
};

export default InstantBuy;