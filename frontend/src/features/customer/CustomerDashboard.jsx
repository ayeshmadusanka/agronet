import React, { useEffect, useState } from 'react';
import { getContracts } from './customerAPI';
import './CustomerDashboard.css';
import { useNavigate } from 'react-router-dom';
import { handleLogout } from '../../utils/authUtils';
import DashboardLayout from '../../components/DashboardLayout';
import InstantBuy from './InstantBuy';

const CustomerDashboard = () => {
  const [contracts, setContracts] = useState([]);
  const [view, setView] = useState('instant-buy');
  const [selectedContract, setSelectedContract] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getContracts().then(res => setContracts(res.data.contracts));
  }, []);

  const menuItems = [
    { icon: '📋', label: 'Contract Marketplace', path: '/customer/marketplace', action: () => setView('marketplace') },
    { icon: '🛒', label: 'Product Marketplace', path: '/customer/instant-buy', action: () => setView('instant-buy') },
    { icon: '🚪', label: 'Logout', action: handleLogout }
  ];

  const handleContractClick = (contract) => {
    setSelectedContract(contract);
    navigate(`/dashboard/contract/${contract.id}`);
  };

  const renderContent = () => {
    switch(view) {
      case 'instant-buy':
        return <InstantBuy />;
      
      case 'marketplace':
        return (
          <div className="customer-marketplace">
            <div className="page-header">
              <h1 className="page-title">Contract Marketplace</h1>
              <p className="page-subtitle">Browse and bid on agricultural contracts</p>
              <div className="info-notice" style={{
                background: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '8px', 
                padding: '12px', 
                marginTop: '16px'
              }}>
                <p style={{margin: 0, color: '#92400e'}}>
                  🛒 <strong>Looking for farmer products to buy?</strong> Click on "Product Marketplace" in the sidebar to see fresh products from farmers.
                </p>
              </div>
            </div>

            <div className="marketplace-stats">
              <div className="stat-badge primary">
                <span className="stat-number">{contracts.length}</span>
                <span className="stat-text">Available Contracts</span>
              </div>
            </div>

            <div className="contracts-grid">
              {contracts.map(contract => (
                <div
                  key={contract.id}
                  className="contract-card"
                  onClick={() => handleContractClick(contract)}
                >
                  <div className="contract-header">
                    <h3 className="contract-title">{contract.name}</h3>
                    <span className="contract-badge">New</span>
                  </div>
                  <p className="contract-description">{contract.description}</p>
                  <div className="contract-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span className="meta-text">Deadline: {new Date(contract.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">💰</span>
                      <span className="meta-text">Est. Value: $25,000</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span className="meta-text">8 Bids</span>
                    </div>
                  </div>
                  <div className="contract-actions">
                    <button className="action-btn primary">Place Bid</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="customer-marketplace">
            <div className="page-header">
              <h1 className="page-title">Contract Marketplace</h1>
              <p className="page-subtitle">Browse and bid on agricultural contracts</p>
            </div>

            <div className="marketplace-stats">
              <div className="stat-badge primary">
                <span className="stat-number">{contracts.length}</span>
                <span className="stat-text">Available Contracts</span>
              </div>
            </div>

            <div className="contracts-grid">
              {contracts.map(contract => (
                <div
                  key={contract.id}
                  className="contract-card"
                  onClick={() => handleContractClick(contract)}
                >
                  <div className="contract-header">
                    <h3 className="contract-title">{contract.name}</h3>
                    <span className="contract-badge">New</span>
                  </div>
                  <p className="contract-description">{contract.description}</p>
                  <div className="contract-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span className="meta-text">Deadline: {new Date(contract.deadline).toLocaleDateString()}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">💰</span>
                      <span className="meta-text">Budget: ${contract.budget}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span className="meta-text">Location: {contract.location}</span>
                    </div>
                  </div>
                  <div className="contract-actions">
                    <button className="action-btn primary">Place Bid</button>
                  </div>
                </div>
              ))}
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