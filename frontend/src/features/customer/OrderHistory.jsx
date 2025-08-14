import React, { useState, useEffect } from 'react';
import { getCustomerOrders } from '../../services/instantBuyAPI';
import { formatCurrency } from '../../utils/currencyUtils';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getCustomerOrders();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: '⏳', class: 'status-pending', text: 'Pending' },
      confirmed: { icon: '✅', class: 'status-confirmed', text: 'Confirmed' },
      preparing: { icon: '👨‍🍳', class: 'status-preparing', text: 'Preparing' },
      shipped: { icon: '🚚', class: 'status-shipped', text: 'Shipped' },
      delivered: { icon: '📦', class: 'status-delivered', text: 'Delivered' },
      cancelled: { icon: '❌', class: 'status-cancelled', text: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h2 className="order-history-title">Order History</h2>
        <p className="order-history-subtitle">Track your instant buy orders</p>
        
        {orders.length > 0 && (
          <div className="order-stats">
            <div className="stat-item">
              <span className="stat-icon">📦</span>
              <span className="stat-text">{orders.length} Orders</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-text">
                {formatCurrency(orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0))} Total
              </span>
            </div>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>No orders yet</h3>
          <p>Your order history will appear here after you make your first purchase</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header" onClick={() => toggleOrderDetails(order.id)}>
                <div className="order-main-info">
                  <div className="order-number">
                    <span className="order-label">Order</span>
                    <span className="order-id">#{order.order_number}</span>
                  </div>
                  <div className="order-date">
                    <span className="date-icon">📅</span>
                    {formatDate(order.created_at)}
                  </div>
                </div>

                <div className="order-summary">
                  <div className="order-status">
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="order-total">
                    <span className="total-label">Total:</span>
                    <span className="total-amount">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="order-items-count">
                    <span className="items-icon">🛍️</span>
                    <span className="items-text">
                      {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="expand-icon">
                  <span className={`expand-arrow ${expandedOrder === order.id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="order-details">
                  <div className="order-items-section">
                    <h4 className="section-title">
                      <span className="section-icon">🛍️</span>
                      Order Items
                    </h4>
                    <div className="order-items">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="order-item">
                          <div className="item-info">
                            <div className="item-name">{item.product?.title || 'Product'}</div>
                            <div className="item-farmer">
                              <span className="farmer-icon">👨‍🌾</span>
                              by {item.farmer?.name || 'Farmer'}
                            </div>
                          </div>
                          <div className="item-quantity">
                            <span className="quantity-label">Qty:</span>
                            <span className="quantity-value">{item.quantity}</span>
                          </div>
                          <div className="item-price">
                            <span className="unit-price">{formatCurrency(item.unit_price)} each</span>
                            <span className="total-price">{formatCurrency(item.total_price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-summary-section">
                    <h4 className="section-title">
                      <span className="section-icon">📊</span>
                      Order Summary
                    </h4>
                    <div className="summary-details">
                      <div className="summary-row">
                        <span className="summary-label">Subtotal:</span>
                        <span className="summary-value">{formatCurrency(order.subtotal)}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Platform Fee:</span>
                        <span className="summary-value">{formatCurrency(order.platform_fee)}</span>
                      </div>
                      <div className="summary-row total-row">
                        <span className="summary-label">Total:</span>
                        <span className="summary-value">{formatCurrency(order.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="delivery-section">
                    <h4 className="section-title">
                      <span className="section-icon">🚚</span>
                      Delivery Information
                    </h4>
                    <div className="delivery-details">
                      <div className="delivery-address">
                        <span className="address-icon">📍</span>
                        <div className="address-text">
                          <div className="recipient-name">
                            {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                          </div>
                          <div className="recipient-address">{order.shipping_address?.address}</div>
                          <div className="recipient-phone">📞 {order.shipping_address?.phone_number}</div>
                        </div>
                      </div>
                      <div className="payment-method">
                        <span className="payment-icon">💵</span>
                        <span className="payment-text">{order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : order.payment_method}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;