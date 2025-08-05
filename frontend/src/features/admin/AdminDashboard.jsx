import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import './AdminDashboard.css';
import FarmerList from './FarmerList';
import CustomerList from './CustomerList';
import ContractList from './ContractList';
import CreateContractForm from './CreateContractForm';
import { getCounts } from './adminAPI';
import { handleLogout } from '../../utils/authUtils';

const AdminDashboard = () => {
  const [view, setView] = useState('dashboard');
  const [counts, setCounts] = useState({ farmers: 0, customers: 0, contracts: 0 });
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    getCounts().then(res => setCounts(res.data));
  }, []);

  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/admin/dashboard', action: () => setView('dashboard') },
    { icon: '🌾', label: 'Farmers', path: '/admin/farmers', action: () => setView('farmers'), badge: counts.farmers },
    { icon: '🛒', label: 'Customers', path: '/admin/customers', action: () => setView('customers'), badge: counts.customers },
    { icon: '📋', label: 'Contracts', path: '/admin/contracts', action: () => setView('contracts'), badge: counts.contracts },
    { icon: '🚪', label: 'Logout', action: handleLogout }
  ];

  const renderContent = () => {
    switch(view) {
      case 'dashboard':
        return (
          <div className="admin-dashboard-home">
            <div className="page-header">
              <h1 className="page-title">Dashboard Overview</h1>
              <p className="page-subtitle">Welcome back, Administrator</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card primary">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon">🌾</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{counts.farmers}</h3>
                  <p className="stat-label">Active Farmers</p>
                  <div className="stat-trend positive">
                    <span>↑ 12%</span> from last month
                  </div>
                </div>
              </div>

              <div className="stat-card secondary">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon">🛒</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{counts.customers}</h3>
                  <p className="stat-label">Total Customers</p>
                  <div className="stat-trend positive">
                    <span>↑ 8%</span> from last month
                  </div>
                </div>
              </div>

              <div className="stat-card tertiary">
                <div className="stat-icon-wrapper">
                  <span className="stat-icon">📋</span>
                </div>
                <div className="stat-content">
                  <h3 className="stat-value">{counts.contracts}</h3>
                  <p className="stat-label">Active Contracts</p>
                  <div className="stat-trend neutral">
                    <span>→ 0%</span> from last month
                  </div>
                </div>
              </div>

            </div>

            <div className="quick-actions">
              <h2 className="section-title">Quick Actions</h2>
              <div className="action-grid">
                <button className="action-card" onClick={() => { setView('contracts'); setShowCreateForm(true); }}>
                  <span className="action-icon">➕</span>
                  <h3>Create Contract</h3>
                  <p>Add new farming contract</p>
                </button>
                <button className="action-card" onClick={() => setView('farmers')}>
                  <span className="action-icon">👥</span>
                  <h3>Manage Farmers</h3>
                  <p>View and approve farmers</p>
                </button>
                <button className="action-card" onClick={() => setView('customers')}>
                  <span className="action-icon">📊</span>
                  <h3>Customer Overview</h3>
                  <p>Monitor customer activity</p>
                </button>
                <button className="action-card" onClick={() => setView('analytics')}>
                  <span className="action-icon">📈</span>
                  <h3>View Analytics</h3>
                  <p>Performance insights</p>
                </button>
              </div>
            </div>
          </div>
        );

      case 'farmers':
        return (
          <div className="admin-content-view">
            <FarmerList />
          </div>
        );

      case 'customers':
        return (
          <div className="admin-content-view">
            <CustomerList />
          </div>
        );

      case 'contracts':
        return (
          <div className="admin-content-view">
            {showCreateForm ? (
              <CreateContractForm onClose={() => setShowCreateForm(false)} />
            ) : (
              <ContractList />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      userType="admin"
      menuItems={menuItems}
      userName="Admin User"
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;