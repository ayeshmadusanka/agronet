import React, { useState, useEffect } from 'react';
import { getFarmerOrders, updateOrderStatus } from '../../services/instantBuyAPI';
import { formatCurrency } from '../../utils/currencyUtils';
import './SellingHistory.css';

const SellingHistory = () => {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    loadSellingHistory();
  }, []);

  const loadSellingHistory = async () => {
    try {
      setLoading(true);
      const response = await getFarmerOrders();
      setOrderItems(response.data.order_items || []);
    } catch (error) {
      console.error('Error loading selling history:', error);
      alert('Failed to load selling history');
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

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      await updateOrderStatus(orderId, newStatus);
      
      // Refresh the data
      await loadSellingHistory();
      
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update order status';
      alert(errorMessage);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': []
    };
    
    return statusFlow[currentStatus] || [];
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  };

  // Group order items by order
  const groupedOrders = orderItems.reduce((acc, item) => {
    const orderId = item.order?.id;
    if (!orderId) return acc;
    
    if (!acc[orderId]) {
      acc[orderId] = {
        order: item.order,
        items: []
      };
    }
    acc[orderId].items.push(item);
    return acc;
  }, {});

  const orders = Object.values(groupedOrders);

  // Calculate statistics
  const totalEarnings = orderItems.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
  const totalItemsSold = orderItems.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your selling history...</p>
      </div>
    );
  }

  return (
    <div className="selling-history-container">
      <div className="selling-history-header">
        <h2 className="selling-history-title">Selling History</h2>
        <p className="selling-history-subtitle">Track your product sales and earnings</p>
        
        {orders.length > 0 && (
          <div className="selling-stats">
            <div className="stat-item">
              <span className="stat-icon">📦</span>
              <span className="stat-text">{orders.length} Orders</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🛍️</span>
              <span className="stat-text">{totalItemsSold} Items Sold</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💰</span>
              <span className="stat-text">{formatCurrency(totalEarnings)} Earned</span>
            </div>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🌾</span>
          <h3>No sales yet</h3>
          <p>Your selling history will appear here when customers purchase your products</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(({ order, items }) => (
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
                  <div className="customer-info">
                    <span className="customer-icon">👤</span>
                    <span className="customer-name">{order.customer?.name || 'Customer'}</span>
                  </div>
                </div>

                <div className="order-summary">
                  <div className="order-status-section">
                    <div className="order-status">
                      {getStatusBadge(order.status)}
                    </div>
                    {getNextStatuses(order.status).length > 0 && (
                      <div className="status-actions">
                        {getNextStatuses(order.status).map(status => (
                          <button
                            key={status}
                            className={`status-update-btn ${status === 'cancelled' ? 'cancel' : 'confirm'}`}
                            onClick={() => handleStatusUpdate(order.id, status)}
                            disabled={updatingStatus === order.id}
                          >
                            {updatingStatus === order.id ? (
                              <span className="btn-spinner"></span>
                            ) : (
                              <>
                                <span className="btn-icon">
                                  {status === 'confirmed' && '✅'}
                                  {status === 'preparing' && '👨‍🍳'}
                                  {status === 'shipped' && '🚚'}
                                  {status === 'delivered' && '📦'}
                                  {status === 'cancelled' && '❌'}
                                </span>
                                {getStatusLabel(status)}
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="order-earnings">
                    <span className="earnings-label">Your Earnings:</span>
                    <span className="earnings-amount">
                      {formatCurrency(items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0))}
                    </span>
                  </div>
                  <div className="order-items-count">
                    <span className="items-icon">📦</span>
                    <span className="items-text">
                      {items.length} product{items.length !== 1 ? 's' : ''}
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
                      Your Products Sold
                    </h4>
                    <div className="order-items">
                      {items.map(item => (
                        <div key={item.id} className="order-item">
                          <div className="item-info">
                            <div className="item-name">{item.product?.title || 'Product'}</div>
                            <div className="item-description">
                              {item.product?.description && (
                                <span className="description-text">
                                  {item.product.description.length > 100 
                                    ? `${item.product.description.substring(0, 100)}...`
                                    : item.product.description
                                  }
                                </span>
                              )}
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

                  <div className="earnings-summary-section">
                    <h4 className="section-title">
                      <span className="section-icon">💰</span>
                      Earnings Summary
                    </h4>
                    <div className="earnings-details">
                      <div className="earnings-breakdown">
                        {items.map(item => (
                          <div key={item.id} className="earnings-row">
                            <span className="earnings-product">{item.product?.title}</span>
                            <span className="earnings-calculation">
                              {item.quantity} × {formatCurrency(item.unit_price)}
                            </span>
                            <span className="earnings-value">{formatCurrency(item.total_price)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="earnings-total">
                        <span className="total-label">Total Earnings:</span>
                        <span className="total-value">
                          {formatCurrency(items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="customer-section">
                    <h4 className="section-title">
                      <span className="section-icon">👤</span>
                      Customer Information
                    </h4>
                    <div className="customer-details">
                      <div className="customer-info-card">
                        <div className="customer-name-display">
                          <span className="name-icon">👤</span>
                          <span className="name-text">{order.customer?.name || 'Customer'}</span>
                        </div>
                        <div className="delivery-address">
                          <span className="address-icon">📍</span>
                          <div className="address-text">
                            <div className="delivery-name">
                              {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                            </div>
                            <div className="delivery-location">{order.shipping_address?.address}</div>
                            <div className="delivery-phone">📞 {order.shipping_address?.phone_number}</div>
                          </div>
                        </div>
                        <div className="payment-info">
                          <span className="payment-icon">💵</span>
                          <span className="payment-text">
                            {order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : order.payment_method}
                          </span>
                        </div>
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

export default SellingHistory;