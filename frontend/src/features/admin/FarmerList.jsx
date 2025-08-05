import React, { useEffect, useState } from 'react';
import { getFarmers, approveFarmer, rejectFarmer } from './adminAPI';

const FarmerList = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    try {
      setLoading(true);
      const res = await getFarmers();
      setFarmers(res.data.farmers || []);
    } catch (error) {
      console.error('Error loading farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (farmerId) => {
    try {
      setActionLoading(farmerId);
      await approveFarmer(farmerId);
      await loadFarmers();
    } catch (error) {
      console.error('Error approving farmer:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (farmerId) => {
    try {
      setActionLoading(farmerId);
      await rejectFarmer(farmerId);
      await loadFarmers();
    } catch (error) {
      console.error('Error rejecting farmer:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', class: 'status-pending' },
      approved: { label: 'Approved', class: 'status-approved' },
      rejected: { label: 'Rejected', class: 'status-rejected' }
    };
    return statusMap[status] || { label: status, class: 'status-default' };
  };

  const filteredFarmers = farmers.filter(farmer => {
    const matchesFilter = filter === 'all' || farmer.status === filter;
    const matchesSearch = farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFilterCounts = () => {
    return {
      all: farmers.length,
      pending: farmers.filter(f => f.status === 'pending').length,
      approved: farmers.filter(f => f.status === 'approved').length,
      rejected: farmers.filter(f => f.status === 'rejected').length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading farmers...</p>
      </div>
    );
  }

  return (
    <div className="farmers-management">
      <div className="farmers-header">
        <div className="farmers-title-section">
          <h2 className="farmers-title">Farmers Management</h2>
          <p className="farmers-subtitle">Manage farmer registrations and approvals</p>
        </div>
        
        <div className="farmers-actions">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search farmers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="farmers-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Farmers ({counts.all})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({counts.pending})
        </button>
        <button
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({counts.approved})
        </button>
        <button
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({counts.rejected})
        </button>
      </div>

      <div className="farmers-grid">
        {filteredFarmers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🌾</span>
            <h3>No farmers found</h3>
            <p>No farmers match your current filter criteria.</p>
          </div>
        ) : (
          filteredFarmers.map(farmer => {
            const farmerId = farmer._id || farmer.id;
            const status = getStatusBadge(farmer.status);
            const isLoading = actionLoading === farmerId;

            return (
              <div key={farmerId} className="farmer-card">
                <div className="farmer-header">
                  <div className="farmer-info">
                    <h3 className="farmer-name">{farmer.name}</h3>
                    <p className="farmer-email">{farmer.email}</p>
                  </div>
                  <span className={`status-badge ${status.class}`}>
                    {status.label}
                  </span>
                </div>

                <div className="farmer-details">
                  <div className="detail-item">
                    <span className="detail-icon">📞</span>
                    <span className="detail-text">{farmer.phone || 'No phone provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text">{farmer.location || 'Location not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      Joined {farmer.created_at ? new Date(farmer.created_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>

                <div className="farmer-actions">
                  {farmer.status === 'pending' && (
                    <>
                      <button
                        className="action-btn approve-btn"
                        onClick={() => handleApprove(farmerId)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="btn-spinner"></span>
                            Approving...
                          </>
                        ) : (
                          <>
                            <span className="btn-icon">✅</span>
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        className="action-btn reject-btn"
                        onClick={() => handleReject(farmerId)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="btn-spinner"></span>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <span className="btn-icon">❌</span>
                            Reject
                          </>
                        )}
                      </button>
                    </>
                  )}
                  
                  {farmer.status === 'approved' && (
                    <button
                      className="action-btn remove-btn"
                      onClick={() => handleReject(farmerId)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="btn-spinner"></span>
                          Removing...
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">🚫</span>
                          Remove Access
                        </>
                      )}
                    </button>
                  )}

                  {farmer.status === 'rejected' && (
                    <button
                      className="action-btn approve-btn"
                      onClick={() => handleApprove(farmerId)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="btn-spinner"></span>
                          Reinstating...
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">↩️</span>
                          Reinstate
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FarmerList;
