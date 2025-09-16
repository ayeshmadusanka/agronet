import React, { useEffect, useState } from 'react';
import '../farmer/FarmerDashboard.css';
import axios from 'axios';
import { handleLogout } from '../../utils/authUtils';
import DashboardLayout from '../../components/DashboardLayout';
import InstantBuy from './InstantBuy';
import AvailableContracts from './AvailableContracts';
import { 
  getSubscriptionDetails, 
  upgradeToProSubscription, 
  downgradeToBasicSubscription,
  getFarmerStats 
} from './farmerAPI';
import { formatCurrency } from '../../utils/currencyUtils';

const apiUrl = process.env.REACT_APP_API_URL;

const FarmerDashboard = () => {
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Fetch farmer info
    axios.get(`${apiUrl}/user`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setFarmer(res.data);
        setLoading(false);
        if (res.data.status === 'approved') {
          fetchSubscriptionDetails(token);
          fetchFarmerStats(token);
        }
      })
      .catch(() => setLoading(false));
  }, []);


  const fetchSubscriptionDetails = async (token) => {
    try {
      const response = await getSubscriptionDetails(token);
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Failed to fetch subscription details:', error);
    }
  };

  const fetchFarmerStats = async (token) => {
    try {
      const response = await getFarmerStats(token);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch farmer stats:', error);
    }
  };

  const fetchPendingOrders = async () => {
    setOrdersLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/farmer/pending-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch pending orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchApprovedOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/farmer/approved-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovedOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch approved orders:', error);
    }
  };

  const handleOrderResponse = async (orderId, response, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/farmer/orders/${orderId}/respond`, {
        response,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh pending orders
      fetchPendingOrders();
      if (response === 'approved') {
        fetchApprovedOrders();
      }

      alert(`Order ${response} successfully!`);
    } catch (error) {
      alert('Failed to update order: ' + (error.response?.data?.message || error.message));
    }
  };

  const markOrderReadyForPickup = async (orderId, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/farmer/orders/${orderId}/ready-for-pickup`, {
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchApprovedOrders();
      alert('Order marked as ready for pickup! Driver will be assigned shortly.');
    } catch (error) {
      alert('Failed to mark order ready: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubscriptionUpgrade = async () => {
    setSubscriptionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await upgradeToProSubscription(token);
      setSubscription(response.data.subscription);
      alert('Successfully upgraded to Pro subscription!');
    } catch (error) {
      alert('Failed to upgrade subscription: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSubscriptionDowngrade = async () => {
    setSubscriptionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await downgradeToBasicSubscription(token);
      setSubscription(response.data.subscription);
      alert('Successfully downgraded to Basic subscription!');
    } catch (error) {
      alert('Failed to downgrade subscription: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!farmer) return <div className="error-screen">Could not load farmer info.</div>;

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/farmer/dashboard', action: () => setView('dashboard') },
    { icon: '📋', label: 'Available Contracts', path: '/farmer/contracts', action: () => setView('contracts') },
    { icon: '📦', label: 'Order Management', path: '/farmer/orders', action: () => setView('orders') },
    { icon: '🛒', label: 'Instant Buy', path: '/farmer/instant-buy', action: () => setView('instant-buy') },
    { icon: '⭐', label: 'Subscription', path: '/farmer/subscription', action: () => setView('subscription') },
    { icon: '🚪', label: 'Logout', action: handleLogout }
  ];

  const renderContent = () => {
    switch(view) {
      case 'dashboard':
        return (
          <div className="farmer-dashboard">
            <div className="page-header">
              <h1 className="page-title">
                Welcome back, {farmer.name}
                {subscription?.is_verified && <span className="verified-badge">✓ Verified</span>}
              </h1>
              <p className="page-subtitle">
                Subscription: {subscription?.tier || 'Basic'} 
                {subscription?.tier === 'pro' && subscription?.expires_at && 
                  ` (Expires: ${new Date(subscription.expires_at).toLocaleDateString()})`}
              </p>
            </div>
            
            <div className="dashboard-cards">
              <div className="stats-card contracts-card">
                <div className="card-header">
                  <span className="card-icon">📋</span>
                  <h3>Contracts</h3>
                </div>
                <div className="card-content">
                  <div className="stat-number">{stats?.contracts?.total || 0}</div>
                  <p className="stat-label">{stats?.contracts?.label || 'Contract Applications'}</p>
                </div>
                <button 
                  className="card-action-btn"
                  onClick={() => setView('contracts')}
                >
                  View Details
                </button>
              </div>

              <div className="stats-card sales-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <h3>Sales</h3>
                </div>
                <div className="card-content">
                  <div className="stat-number">{formatCurrency(stats?.sales?.total_amount || 0)}</div>
                  <p className="stat-label">Total Sales Revenue</p>
                  <div className="sales-breakdown">
                    <small>Orders: {stats?.sales?.total_orders || 0}</small>
                    <small>Your Earnings: {formatCurrency(stats?.sales?.farmer_earnings || 0)}</small>
                    <small>Platform Fee: {formatCurrency(stats?.sales?.platform_commission || 0)}</small>
                  </div>
                </div>
                <button 
                  className="card-action-btn"
                  onClick={() => setView('instant-buy')}
                >
                  Manage Products
                </button>
              </div>

              <div className="stats-card subscription-card">
                <div className="card-header">
                  <span className="card-icon">⭐</span>
                  <h3>Subscription</h3>
                </div>
                <div className="card-content">
                  <div className="subscription-tier">{subscription?.tier || 'Basic'}</div>
                  <p className="stat-label">
                    Commission Rate: {subscription?.commission_rate || 10}%
                  </p>
                  {subscription?.is_verified && (
                    <div className="verified-status">✓ Verified Farmer</div>
                  )}
                </div>
                <button 
                  className="card-action-btn"
                  onClick={() => setView('subscription')}
                >
                  Manage Plan
                </button>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="farmer-subscription">
            <div className="page-header">
              <h1 className="page-title">Subscription Management</h1>
              <p className="page-subtitle">Manage your farmer subscription plan</p>
            </div>
            
            <div className="subscription-plans">
              <div className={`plan-card ${subscription?.tier === 'basic' ? 'current-plan' : ''}`}>
                <div className="plan-header">
                  <h3>Basic Plan</h3>
                  <div className="plan-price">Free</div>
                </div>
                <div className="plan-features">
                  <ul>
                    <li>10% platform commission</li>
                    <li>Standard product listing</li>
                    <li>Basic support</li>
                  </ul>
                </div>
                {subscription?.tier === 'basic' && (
                  <div className="current-plan-badge">Current Plan</div>
                )}
              </div>

              <div className={`plan-card pro-plan ${subscription?.tier === 'pro' ? 'current-plan' : ''}`}>
                <div className="plan-header">
                  <h3>Pro Plan</h3>
                  <div className="plan-price">Rs. 8,500/month</div>
                </div>
                <div className="plan-features">
                  <ul>
                    <li>0% platform commission</li>
                    <li>✓ Verified farmer badge</li>
                    <li>Priority marketplace ranking</li>
                    <li>Premium support</li>
                    <li>Advanced analytics</li>
                  </ul>
                </div>
                {subscription?.tier === 'pro' ? (
                  <div className="current-plan-badge">
                    Current Plan 
                    {subscription?.expires_at && (
                      <small>(Expires: {new Date(subscription.expires_at).toLocaleDateString()})</small>
                    )}
                  </div>
                ) : (
                  <button 
                    className="plan-action-btn upgrade-btn"
                    onClick={handleSubscriptionUpgrade}
                    disabled={subscriptionLoading}
                  >
                    {subscriptionLoading ? 'Upgrading...' : 'Upgrade to Pro'}
                  </button>
                )}
              </div>
            </div>

            {subscription?.tier === 'pro' && (
              <div className="subscription-actions">
                <button 
                  className="downgrade-btn"
                  onClick={handleSubscriptionDowngrade}
                  disabled={subscriptionLoading}
                >
                  {subscriptionLoading ? 'Processing...' : 'Downgrade to Basic'}
                </button>
              </div>
            )}
          </div>
        );

      case 'contracts':
        return <AvailableContracts />;

      case 'orders':
        return (
          <div className="farmer-orders">
            <div className="page-header">
              <h1 className="page-title">Order Management</h1>
              <p className="page-subtitle">Approve orders and manage pickups</p>
            </div>

            <div className="orders-tabs">
              <button
                className={`tab-btn ${view === 'orders' ? 'active' : ''}`}
                onClick={() => {
                  setView('orders');
                  fetchPendingOrders();
                }}
              >
                Pending Approval ({pendingOrders.length})
              </button>
              <button
                className="tab-btn"
                onClick={() => {
                  setView('approved-orders');
                  fetchApprovedOrders();
                }}
              >
                Approved Orders ({approvedOrders.length})
              </button>
            </div>

            {ordersLoading ? (
              <div className="loading-state">Loading orders...</div>
            ) : (
              <div className="orders-content">
                {pendingOrders.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📦</span>
                    <h3>No Pending Orders</h3>
                    <p>No orders awaiting your approval at the moment.</p>
                  </div>
                ) : (
                  <div className="orders-list">
                    {pendingOrders.map(order => (
                      <div key={order._id} className="order-card pending">
                        <div className="order-header">
                          <div className="order-info">
                            <h3>Order #{order.order_number}</h3>
                            <span className="order-status pending">Pending Approval</span>
                          </div>
                          <div className="order-total">
                            <span className="total-label">Total:</span>
                            <span className="total-amount">{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>

                        <div className="order-details">
                          <div className="customer-info">
                            <p><strong>Customer:</strong> {order.customer?.name || 'Unknown'}</p>
                            <p><strong>Phone:</strong> {order.customer?.phone || 'N/A'}</p>
                            <p><strong>Address:</strong> {order.shipping_address?.address || 'N/A'}</p>
                          </div>

                          <div className="order-items">
                            <h4>Items Ordered:</h4>
                            {order.order_items?.map((item, index) => (
                              <div key={index} className="order-item">
                                <span>{item.product?.name || 'Product'}</span>
                                <span>{item.quantity} {item.product?.unit || 'kg'}</span>
                                <span>{formatCurrency(item.total_price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="order-actions">
                          <button
                            className="action-btn approve"
                            onClick={() => handleOrderResponse(order._id, 'approved')}
                          >
                            ✓ Approve Order
                          </button>
                          <button
                            className="action-btn reject"
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) {
                                handleOrderResponse(order._id, 'rejected', reason);
                              }
                            }}
                          >
                            ✗ Reject Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'approved-orders':
        return (
          <div className="farmer-orders">
            <div className="page-header">
              <h1 className="page-title">Approved Orders</h1>
              <p className="page-subtitle">Mark orders ready for pickup</p>
            </div>

            <div className="orders-tabs">
              <button
                className="tab-btn"
                onClick={() => {
                  setView('orders');
                  fetchPendingOrders();
                }}
              >
                Pending Approval ({pendingOrders.length})
              </button>
              <button
                className={`tab-btn active`}
                onClick={() => {
                  setView('approved-orders');
                  fetchApprovedOrders();
                }}
              >
                Approved Orders ({approvedOrders.length})
              </button>
            </div>

            <div className="orders-content">
              {approvedOrders.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">✅</span>
                  <h3>No Approved Orders</h3>
                  <p>No approved orders to prepare for pickup.</p>
                </div>
              ) : (
                <div className="orders-list">
                  {approvedOrders.map(order => (
                    <div key={order._id} className={`order-card ${order.status}`}>
                      <div className="order-header">
                        <div className="order-info">
                          <h3>Order #{order.order_number}</h3>
                          <span className={`order-status ${order.status}`}>
                            {order.status === 'farmer_approved' ? 'Approved - Prepare Items' :
                             order.status === 'ready_for_pickup' ? 'Ready for Pickup' :
                             order.status === 'assigned_to_driver' ? 'Driver Assigned' :
                             order.status === 'picked_up' ? 'Picked Up' :
                             order.status === 'in_transit' ? 'In Transit' :
                             order.status === 'delivered' ? 'Delivered' :
                             order.status === 'completed' ? 'Completed' : order.status}
                          </span>
                        </div>
                        <div className="order-total">
                          <span className="total-amount">{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>

                      <div className="order-details">
                        <div className="customer-info">
                          <p><strong>Customer:</strong> {order.customer?.name || 'Unknown'}</p>
                          <p><strong>Address:</strong> {order.shipping_address?.address || 'N/A'}</p>
                        </div>

                        <div className="order-items">
                          <h4>Items to Prepare:</h4>
                          {order.order_items?.map((item, index) => (
                            <div key={index} className="order-item">
                              <span>{item.product?.name || 'Product'}</span>
                              <span>{item.quantity} {item.product?.unit || 'kg'}</span>
                              <span>{formatCurrency(item.total_price)}</span>
                            </div>
                          ))}
                        </div>

                        {order.driver && (
                          <div className="driver-info">
                            <h4>Assigned Driver:</h4>
                            <p><strong>Name:</strong> {order.driver.name}</p>
                            <p><strong>Phone:</strong> {order.driver.phone}</p>
                            <p><strong>Vehicle:</strong> {order.driver.vehicle_type}</p>
                          </div>
                        )}
                      </div>

                      <div className="order-actions">
                        {order.status === 'farmer_approved' && (
                          <button
                            className="action-btn ready"
                            onClick={() => {
                              const notes = prompt('Add any notes for the driver (optional):');
                              markOrderReadyForPickup(order._id, notes || '');
                            }}
                          >
                            📦 Mark Ready for Pickup
                          </button>
                        )}
                        {order.status !== 'farmer_approved' && (
                          <div className="status-info">
                            <p>Status: {order.status === 'ready_for_pickup' ? 'Waiting for driver assignment' :
                                      order.status === 'assigned_to_driver' ? 'Driver assigned, waiting for pickup' :
                                      order.status === 'picked_up' ? 'Driver has picked up the order' :
                                      order.status === 'in_transit' ? 'Order is being delivered' :
                                      order.status === 'delivered' ? 'Order has been delivered' :
                                      order.status === 'completed' ? 'Order completed successfully' : order.status}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'instant-buy':
        return <InstantBuy />;

      default:
        return (
          <div className="farmer-dashboard">
            <div className="page-header">
              <h1 className="page-title">
                Welcome back, {farmer.name}
                {subscription?.is_verified && <span className="verified-badge">✓ Verified</span>}
              </h1>
              <p className="page-subtitle">
                Subscription: {subscription?.tier || 'Basic'}
                {subscription?.tier === 'pro' && subscription?.expires_at &&
                  ` (Expires: ${new Date(subscription.expires_at).toLocaleDateString()})`}
              </p>
            </div>

            <div className="dashboard-cards">
              <div className="stats-card contracts-card">
                <div className="card-header">
                  <span className="card-icon">📋</span>
                  <h3>Contracts</h3>
                </div>
                <div className="card-content">
                  <div className="stat-number">{stats?.contracts?.total || 0}</div>
                  <p className="stat-label">{stats?.contracts?.label || 'Contract Applications'}</p>
                </div>
                <button
                  className="card-action-btn"
                  onClick={() => setView('contracts')}
                >
                  View Available Contracts
                </button>
              </div>

              <div className="stats-card sales-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <h3>Sales</h3>
                </div>
                <div className="card-content">
                  <div className="stat-number">{formatCurrency(stats?.sales?.total_amount || 0)}</div>
                  <p className="stat-label">Total Sales Revenue</p>
                  <div className="sales-breakdown">
                    <small>Orders: {stats?.sales?.total_orders || 0}</small>
                    <small>Your Earnings: {formatCurrency(stats?.sales?.farmer_earnings || 0)}</small>
                    <small>Platform Fee: {formatCurrency(stats?.sales?.platform_commission || 0)}</small>
                  </div>
                </div>
                <button
                  className="card-action-btn"
                  onClick={() => setView('instant-buy')}
                >
                  Manage Products
                </button>
              </div>

              <div className="stats-card subscription-card">
                <div className="card-header">
                  <span className="card-icon">⭐</span>
                  <h3>Subscription</h3>
                </div>
                <div className="card-content">
                  <div className="subscription-tier">{subscription?.tier || 'Basic'}</div>
                  <p className="stat-label">
                    Commission Rate: {subscription?.commission_rate || 10}%
                  </p>
                  {subscription?.is_verified && (
                    <div className="verified-status">✓ Verified Farmer</div>
                  )}
                </div>
                <button
                  className="card-action-btn"
                  onClick={() => setView('subscription')}
                >
                  Manage Plan
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      userType="farmer"
      menuItems={menuItems}
      userName={farmer.name}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default FarmerDashboard;