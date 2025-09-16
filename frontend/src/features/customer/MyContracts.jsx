import React, { useState, useEffect } from 'react';
import './CustomerDashboard.css';
import './ContractStyles.css';

const MyContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingBid, setAcceptingBid] = useState(null);

  useEffect(() => {
    fetchMyContracts();
  }, []);

  const fetchMyContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/my-contracts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }

      const data = await response.json();
      setContracts(data.contracts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptBid = async (bidId) => {
    setAcceptingBid(bidId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bids/${bidId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept bid');
      }

      // Refresh contracts to show updated status
      await fetchMyContracts();
      alert('✅ Bid accepted successfully! The contract has been awarded to the farmer.');
    } catch (err) {
      alert(`❌ Error accepting bid: ${err.message}`);
    } finally {
      setAcceptingBid(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#FF9800';
      case 'awarded': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'expired': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return '📝';
      case 'awarded': return '🏆';
      case 'in_progress': return '⚡';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      case 'expired': return '⏰';
      default: return '📋';
    }
  };

  if (loading) {
    return <div className="loading">Loading your contracts...</div>;
  }

  if (error) {
    return <div className="error-message">❌ {error}</div>;
  }

  return (
    <div className="my-contracts">
      <div className="dashboard-header">
        <h2>My Contracts</h2>
        <p>🆕 NEW: Contracts are now automatically awarded to the lowest qualifying bidder!</p>
      </div>

      {contracts.length === 0 ? (
        <div className="empty-state">
          <h3>No contracts yet</h3>
          <p>Create your first contract to start receiving bids from farmers</p>
        </div>
      ) : (
        <div className="contracts-grid">
          {contracts.map((contract) => (
            <div key={contract.id} className="contract-card-modern">
              {/* Header Section */}
              <div className="contract-header-modern">
                <div className="contract-title-section">
                  <h3 className="contract-title-modern">{contract.title}</h3>
                  <span
                    className="status-badge-modern"
                    style={{ backgroundColor: getStatusColor(contract.status) }}
                  >
                    {getStatusIcon(contract.status)} {contract.status_text || contract.status.toUpperCase()}
                  </span>
                </div>
                <div className="contract-meta-tags">
                  <span className="meta-tag crop-tag">🌾 {contract.crop_type}</span>
                  <span className="meta-tag quantity-tag">📦 {contract.quantity_needed} kg</span>
                  <span className="meta-tag price-tag">💰 ${contract.preferred_price_per_kilo}/kg</span>
                </div>
              </div>

              {/* Quick Info Section */}
              <div className="contract-quick-info">
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <span className="info-text">{contract.location}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📅</span>
                  <span className="info-text">{new Date(contract.deadline).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🏷️</span>
                  <span className="info-text">{contract.bid_count} Bids</span>
                </div>
              </div>

              {/* Bid Summary Section */}
              {contract.bid_count > 0 && (
                <div className="bid-summary-modern">
                  <div className="summary-header">
                    <h4>📊 Bid Summary</h4>
                    <span className="bid-count-badge">{contract.bid_count} Bids</span>
                  </div>

                  {contract.status === 'open' && contract.bids.length > 0 && (
                    <div className="best-bid-highlight">
                      <div className="best-bid-label">🏆 Best Offer</div>
                      <div className="best-bid-details">
                        {(() => {
                          const sortedBids = [...contract.bids].sort((a, b) => a.price_per_kilo - b.price_per_kilo);
                          const bestBid = sortedBids[0];
                          return (
                            <>
                              <span className="best-bid-price">${bestBid.price_per_kilo}/kg</span>
                              <span className="best-bid-farmer">by {bestBid.farmer_name}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Winning Bid Section */}
              {contract.winning_bid && (
                <div className="winning-bid-modern">
                  <div className="winning-header">
                    <span className="winning-icon">🎉</span>
                    <h4>Contract Awarded!</h4>
                  </div>
                  <div className="winning-farmer-card">
                    <div className="farmer-avatar">👨‍🌾</div>
                    <div className="farmer-details">
                      <div className="farmer-name">{contract.winning_bid.farmer_name}</div>
                      <div className="farmer-contact">📞 {contract.winning_bid.farmer_phone}</div>
                    </div>
                    <div className="winning-amount">
                      <div className="amount-label">Total Contract</div>
                      <div className="amount-value">${contract.winning_bid.total_amount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bids Section */}
              {contract.bids.length > 0 && contract.status === 'open' && (
                <div className="bids-section-modern">
                  <div className="bids-header">
                    <h4>💼 Farmer Bids</h4>
                    <span className="bids-count">{contract.bids.length} bids received</span>
                  </div>

                  <div className="bids-list-modern">
                    {contract.bids
                      .sort((a, b) => a.price_per_kilo - b.price_per_kilo)
                      .map((bid, index) => (
                        <div key={bid.id} className={`bid-card-modern ${index === 0 ? 'best-bid' : ''}`}>
                          <div className="bid-header-row">
                            <div className="farmer-info-modern">
                              <span className="farmer-avatar-small">👨‍🌾</span>
                              <div className="farmer-name-modern">{bid.farmer_name}</div>
                              {index === 0 && <span className="best-badge">🏆 Best</span>}
                            </div>
                            <div className="bid-price-modern">
                              <span className="price-amount">${bid.price_per_kilo}/kg</span>
                              <span className="total-amount">Total: ${bid.total_amount}</span>
                            </div>
                          </div>

                          <div className="bid-details-row">
                            <div className="quantity-offered">
                              📦 {bid.quantity_offered} kg offered
                            </div>
                            <div className="bid-status-modern">
                              <span
                                className={`status-chip ${bid.status}`}
                                style={{ backgroundColor: bid.status_color }}
                              >
                                {bid.status_text || bid.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {bid.message && (
                            <div className="bid-message-modern">
                              <span className="message-icon">💬</span>
                              <span className="message-text">{bid.message}</span>
                            </div>
                          )}

                          {bid.status === 'pending' && contract.status === 'open' && (
                            <div className="bid-actions-modern">
                              <button
                                className="accept-bid-btn"
                                onClick={() => acceptBid(bid.id)}
                                disabled={acceptingBid === bid.id}
                              >
                                {acceptingBid === bid.id ? (
                                  <>⏳ Accepting...</>
                                ) : (
                                  <>✅ Accept Bid</>
                                )}
                              </button>
                            </div>
                          )}

                          {!bid.meets_requirements && (
                            <div className="insufficient-warning-modern">
                              ⚠️ Quantity below requirements
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* No Bids State */}
              {contract.bids.length === 0 && contract.status === 'open' && (
                <div className="no-bids-modern">
                  <div className="no-bids-icon">📭</div>
                  <div className="no-bids-text">
                    <h4>Waiting for Bids</h4>
                    <p>Your contract is live! Farmers will see it and can place bids.</p>
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

export default MyContracts;