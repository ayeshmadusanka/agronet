import React, { useEffect, useState } from 'react';
import { getCustomers, getCustomerDetails } from './adminAPI';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomers();
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (customerId) => {
    if (selectedId === customerId) {
      setSelectedId(null);
      setDetails(null);
    } else {
      try {
        setDetailsLoading(customerId);
        setSelectedId(customerId);
        const res = await getCustomerDetails(customerId);
        setDetails(res.data);
      } catch (error) {
        console.error('Error loading customer details:', error);
      } finally {
        setDetailsLoading(null);
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="customers-management">
      <div className="customers-header">
        <div className="customers-title-section">
          <h2 className="customers-title">Customers Management</h2>
          <p className="customers-subtitle">View and manage customer accounts and activities</p>
        </div>
        
        <div className="customers-actions">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="customers-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{customers.length}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">{customers.filter(c => details?.bids?.length > 0).length}</div>
            <div className="stat-label">Active Bidders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{filteredCustomers.length}</div>
            <div className="stat-label">Filtered Results</div>
          </div>
        </div>
      </div>

      <div className="customers-grid">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>No customers found</h3>
            <p>No customers match your current search criteria.</p>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const customerId = customer._id || customer.id;
            const isSelected = selectedId === customerId;
            const isLoadingDetails = detailsLoading === customerId;

            return (
              <div key={customerId} className={`customer-card ${isSelected ? 'expanded' : ''}`}>
                <div className="customer-header" onClick={() => handleViewDetails(customerId)}>
                  <div className="customer-info">
                    <h3 className="customer-name">{customer.name}</h3>
                    <p className="customer-email">{customer.email}</p>
                  </div>
                  <div className="customer-header-actions">
                    <span className="customer-status active">Active</span>
                    <button className="details-toggle">
                      {isSelected ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <div className="customer-details">
                    {isLoadingDetails ? (
                      <div className="details-loading">
                        <div className="loading-spinner-small"></div>
                        <span>Loading customer details...</span>
                      </div>
                    ) : details ? (
                      <>
                        <div className="details-section">
                          <h4>Contact Information</h4>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="detail-icon">📧</span>
                              <div className="detail-content">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{details.email}</span>
                              </div>
                            </div>
                            <div className="detail-item">
                              <span className="detail-icon">📍</span>
                              <div className="detail-content">
                                <span className="detail-label">Address</span>
                                <span className="detail-value">{details.address || 'Not provided'}</span>
                              </div>
                            </div>
                            <div className="detail-item">
                              <span className="detail-icon">📅</span>
                              <div className="detail-content">
                                <span className="detail-label">Member Since</span>
                                <span className="detail-value">
                                  {details.created_at ? new Date(details.created_at).toLocaleDateString() : 'Recently'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="details-section">
                          <h4>Bidding Activity</h4>
                          {details.bids && details.bids.length > 0 ? (
                            <div className="bids-list">
                              {details.bids.map((bid, index) => (
                                <div key={bid._id || bid.id || index} className="bid-item">
                                  <div className="bid-info">
                                    <div className="bid-contract">{bid.contractName || 'Unknown Contract'}</div>
                                    <div className="bid-amount">${(bid.amount || 0).toLocaleString()}</div>
                                  </div>
                                  <div className="bid-status">
                                    <span className={`bid-status-badge ${bid.status || 'pending'}`}>
                                      {(bid.status || 'Pending').charAt(0).toUpperCase() + (bid.status || 'Pending').slice(1)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-bids">
                              <span className="no-bids-icon">🎯</span>
                              <p>No bids placed yet</p>
                            </div>
                          )}
                        </div>

                        <div className="customer-actions">
                          <button className="action-btn view-btn">
                            <span className="btn-icon">👁️</span>
                            View Full Profile
                          </button>
                          <button className="action-btn message-btn">
                            <span className="btn-icon">💬</span>
                            Send Message
                          </button>
                          <button className="action-btn export-btn">
                            <span className="btn-icon">📊</span>
                            Export Data
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="details-error">
                        <span className="error-icon">⚠️</span>
                        <p>Failed to load customer details</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CustomerList;
