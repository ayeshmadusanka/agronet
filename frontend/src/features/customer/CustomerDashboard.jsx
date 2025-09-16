import React, { useEffect, useState } from 'react';
import './CustomerDashboard.css';
import { handleLogout } from '../../utils/authUtils';
import DashboardLayout from '../../components/DashboardLayout';
import InstantBuy from './InstantBuy';
import CreateContract from './CreateContract';
import MyContracts from './MyContracts';

const CustomerDashboard = () => {
  const [view, setView] = useState('instant-buy');
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    completedContracts: 0,
    totalBids: 0
  });

  useEffect(() => {
    fetchCustomerStats();
  }, []);

  const fetchCustomerStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/my-contracts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const contracts = data.contracts || [];

        setStats({
          totalContracts: contracts.length,
          activeContracts: contracts.filter(c => c.status === 'open').length,
          completedContracts: contracts.filter(c => c.status === 'completed').length,
          totalBids: contracts.reduce((total, contract) => total + (contract.bid_count || 0), 0)
        });
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  };

  const menuItems = [
    { icon: '🛒', label: 'Product Marketplace', path: '/customer/instant-buy', action: () => setView('instant-buy') },
    { icon: '📝', label: 'Create Contract', path: '/customer/create-contract', action: () => setView('create-contract') },
    { icon: '📋', label: 'My Contracts', path: '/customer/my-contracts', action: () => setView('my-contracts') },
    { icon: '🚪', label: 'Logout', action: handleLogout }
  ];

  const renderContent = () => {
    switch(view) {
      case 'instant-buy':
        return <InstantBuy />;

      case 'create-contract':
        return <CreateContract onContractCreated={fetchCustomerStats} />;

      case 'my-contracts':
        return <MyContracts />;

      default:
        return (
          <div className="customer-dashboard-overview">
            <div className="page-header">
              <h1 className="page-title">Customer Dashboard</h1>
              <p className="page-subtitle">Manage your agricultural contracts and purchases</p>
            </div>

            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalContracts}</div>
                  <div className="stat-label">Total Contracts</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.activeContracts}</div>
                  <div className="stat-label">Active Contracts</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.completedContracts}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏷️</div>
                <div className="stat-info">
                  <div className="stat-number">{stats.totalBids}</div>
                  <div className="stat-label">Total Bids Received</div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <div className="action-card" onClick={() => setView('create-contract')}>
                <div className="action-icon">📝</div>
                <h3>Create New Contract</h3>
                <p>Post your crop requirements and let farmers bid</p>
                <button className="action-btn primary">Create Contract</button>
              </div>

              <div className="action-card" onClick={() => setView('my-contracts')}>
                <div className="action-icon">📋</div>
                <h3>View My Contracts</h3>
                <p>Manage your contracts and review farmer bids</p>
                <button className="action-btn secondary">View Contracts</button>
              </div>

              <div className="action-card" onClick={() => setView('instant-buy')}>
                <div className="action-icon">🛒</div>
                <h3>Product Marketplace</h3>
                <p>Browse and buy fresh products directly from farmers</p>
                <button className="action-btn secondary">Shop Now</button>
              </div>
            </div>

            <div className="info-section">
              <h3>🆕 How the NEW Contract System Works:</h3>
              <div className="info-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Create Contract</h4>
                    <p>Post your crop requirements with quantity, price, and deadline</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Farmers Bid</h4>
                    <p>Farmers place competitive bids with their quantity and price offers</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Automatic Award</h4>
                    <p>Contract automatically goes to the lowest qualified bidder</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Completion</h4>
                    <p>Work directly with the winning farmer to complete the contract</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      userType="customer"
      menuItems={menuItems}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default CustomerDashboard;