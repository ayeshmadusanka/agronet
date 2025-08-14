import React, { useEffect, useState } from 'react';
import '../farmer/FarmerDashboard.css';
import axios from 'axios';
import { handleLogout } from '../../utils/authUtils';
import DashboardLayout from '../../components/DashboardLayout';
import InstantBuy from './InstantBuy';
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
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

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
          fetchContracts(res.data._id);
          fetchSubscriptionDetails(token);
          fetchFarmerStats(token);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchContracts = (farmerId) => {
    const token = localStorage.getItem('token');
    axios.get(`${apiUrl}/contracts?farmer_id=${farmerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setContracts(res.data.contracts || []));
  };

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
    { icon: '📋', label: 'My Contracts', path: '/farmer/contracts', action: () => setView('contracts'), badge: contracts.length },
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
        return (
          <div className="farmer-contracts">
            <div className="page-header">
              <h1 className="page-title">My Contracts</h1>
              <p className="page-subtitle">Manage your farming agreements</p>
            </div>
            
            {contracts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <h2>No Active Contracts</h2>
                <p>You don't have any contracts yet. Contact support to get started!</p>
              </div>
            ) : (
              <div className="contracts-list">
                {contracts.map(contract => (
                  <div key={contract.id} className="contract-item">
                    <div className="contract-header">
                      <h3>{contract.name}</h3>
                      <span className="contract-status active">Active</span>
                    </div>
                    <p className="contract-description">{contract.description}</p>
                    <div className="contract-details">
                      <div className="detail-row">
                        <span className="detail-label">Deadline:</span>
                        <span className="detail-value">{new Date(contract.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Progress:</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{width: '60%'}}></div>
                        </div>
                      </div>
                    </div>
                    <div className="contract-actions">
                      <button className="action-btn primary">View Details</button>
                      <button className="action-btn secondary">Update Progress</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'instant-buy':
        return <InstantBuy />;

      default:
        return (
          <div className="farmer-contracts">
            <div className="page-header">
              <h1 className="page-title">My Contracts</h1>
              <p className="page-subtitle">Manage your farming agreements</p>
            </div>
            
            {contracts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <h2>No Active Contracts</h2>
                <p>You don't have any contracts yet. Contact support to get started!</p>
              </div>
            ) : (
              <div className="contracts-list">
                {contracts.map(contract => (
                  <div key={contract.id} className="contract-item">
                    <div className="contract-header">
                      <h3>{contract.name}</h3>
                      <span className="contract-status active">Active</span>
                    </div>
                    <p className="contract-description">{contract.description}</p>
                    <div className="contract-details">
                      <div className="detail-row">
                        <span className="detail-label">Deadline:</span>
                        <span className="detail-value">{new Date(contract.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Progress:</span>
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{width: '60%'}}></div>
                        </div>
                      </div>
                    </div>
                    <div className="contract-actions">
                      <button className="action-btn primary">View Details</button>
                      <button className="action-btn secondary">Update Progress</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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