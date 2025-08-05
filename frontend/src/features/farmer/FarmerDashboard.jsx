import React, { useEffect, useState } from 'react';
import '../farmer/FarmerDashboard.css';
import axios from 'axios';
import { handleLogout } from '../../utils/authUtils';
import DashboardLayout from '../../components/DashboardLayout';
import InstantBuy from './InstantBuy';

const apiUrl = process.env.REACT_APP_API_URL;

const FarmerDashboard = () => {
  const [farmer, setFarmer] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('contracts');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${apiUrl}/user`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setFarmer(res.data);
        setLoading(false);
        if (res.data.status === 'approved') {
          fetchContracts(res.data._id);
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

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!farmer) return <div className="error-screen">Could not load farmer info.</div>;

  const menuItems = [
    { icon: '📋', label: 'My Contracts', path: '/farmer/contracts', action: () => setView('contracts'), badge: contracts.length },
    { icon: '🛒', label: 'Instant Buy', path: '/farmer/instant-buy', action: () => setView('instant-buy') },
    { icon: '🚪', label: 'Logout', action: handleLogout }
  ];

  const renderContent = () => {
    switch(view) {
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