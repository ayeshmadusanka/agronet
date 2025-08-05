import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ userType, menuItems, userName, className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getIcon = (type) => {
    const icons = {
      admin: '👤',
      farmer: '🌾',
      customer: '🛒'
    };
    return icons[type] || '👤';
  };

  const getUserTypeLabel = (type) => {
    const labels = {
      admin: 'Administrator',
      farmer: 'Farmer',
      customer: 'Customer'
    };
    return labels[type] || type;
  };

  return (
    <div className={`sidebar ${className || ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🌱</span>
          <span className="logo-text">AgroNet</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {getIcon(userType)}
        </div>
        <div className="user-info">
          <h4 className="user-name">{userName}</h4>
          <p className="user-role">{getUserTypeLabel(userType)}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => item.action ? item.action() : navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="copyright">© 2025 AgroNet</p>
      </div>
    </div>
  );
};

export default Sidebar;