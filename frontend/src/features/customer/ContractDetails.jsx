import React, { useEffect, useState } from 'react';
import { getContractDetails, placeBid } from './customerAPI';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerDashboard.css';
import './ContractDetails.css';

const ContractDetails = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);

  useEffect(() => {
    getContractDetails(contractId).then(res => setContract(res.data.contract));
  }, [contractId]);

  const handleBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    const currentBid = contract.highest_bid || 0;
    const amount = Number(bidAmount);

    if (isNaN(amount) || amount <= currentBid) {
      setError(`Bid must be greater than $${currentBid.toLocaleString()}`);
      setLoading(false);
      return;
    }

    try {
      await placeBid(contractId, amount);
      setSuccess('🎉 Bid placed successfully! You will be notified if you win.');
      setBidAmount('');
      setShowBidForm(false);
      // Refresh contract details
      getContractDetails(contractId).then(res => setContract(res.data.contract));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'closed': return 'error';
      default: return 'neutral';
    }
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!contract) {
    return (
      <div className="contract-loading">
        <div className="loading-spinner"></div>
        <p>Loading contract details...</p>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(contract.deadline);
  const statusColor = getStatusColor(contract.status);

  return (
    <div className="contract-details-container">
      {/* Header with Back Button */}
      <div className="contract-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <span className="back-icon">←</span>
          Back to Marketplace
        </button>
        <div className="contract-status-badge">
          <span className={`status-indicator ${statusColor}`}></span>
          {contract.status || 'Active'}
        </div>
      </div>

      {/* Main Content */}
      <div className="contract-content">
        {/* Left Column - Contract Details */}
        <div className="contract-main">
          <div className="contract-title-section">
            <h1 className="contract-title">{contract.name}</h1>
          </div>

          <div className="contract-description">
            <h3>Contract Description</h3>
            <p>{contract.description}</p>
          </div>

          <div className="contract-specifications">
            <h3>Contract Specifications</h3>
            <div className="specs-grid">
              <div className="spec-item">
                <span className="spec-icon">📅</span>
                <div className="spec-content">
                  <span className="spec-label">Deadline</span>
                  <span className="spec-value">{new Date(contract.deadline).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="spec-item">
                <span className="spec-icon">📍</span>
                <div className="spec-content">
                  <span className="spec-label">Location</span>
                  <span className="spec-value">{contract.location || 'Not specified'}</span>
                </div>
              </div>
              <div className="spec-item">
                <span className="spec-icon">📏</span>
                <div className="spec-content">
                  <span className="spec-label">Quantity</span>
                  <span className="spec-value">{contract.quantity || 'As specified'}</span>
                </div>
              </div>
              <div className="spec-item">
                <span className="spec-icon">🌾</span>
                <div className="spec-content">
                  <span className="spec-label">Crop Type</span>
                  <span className="spec-value">{contract.crop_type || 'Mixed'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="contract-timeline">
            <h3>Timeline</h3>
            <div className="timeline-container">
              <div className="timeline-item completed">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-title">Contract Posted</span>
                  <span className="timeline-date">3 days ago</span>
                </div>
              </div>
              <div className="timeline-item active">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-title">Bidding Period</span>
                  <span className="timeline-date">{daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-title">Contract Award</span>
                  <span className="timeline-date">After deadline</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Bidding Section */}
        <div className="contract-sidebar">
          <div className="bidding-card">
            <div className="current-bid-section">
              <h3>Current Highest Bid</h3>
              <div className="current-bid-amount">
                ${(contract.highest_bid || 0).toLocaleString()}
              </div>
              <div className="bid-info">
                <span className="bid-count">{contract.bid_count || 0} bids placed</span>
                <span className="time-remaining">
                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Bidding closed'}
                </span>
              </div>
            </div>

            {daysRemaining > 0 && (
              <div className="bid-action-section">
                {!showBidForm ? (
                  <button 
                    className="place-bid-btn"
                    onClick={() => setShowBidForm(true)}
                  >
                    <span className="btn-icon">💰</span>
                    Place Your Bid
                  </button>
                ) : (
                  <form onSubmit={handleBid} className="bid-form">
                    <div className="form-group">
                      <label htmlFor="bidAmount">Your Bid Amount</label>
                      <div className="input-wrapper">
                        <input
                          type="number"
                          id="bidAmount"
                          value={bidAmount}
                          onChange={e => setBidAmount(e.target.value)}
                          placeholder={(contract.highest_bid || 0) + 1}
                          min={(contract.highest_bid || 0) + 1}
                          required
                          className="bid-input"
                        />
                      </div>
                      <div className="bid-hint">
                        Minimum bid: ${((contract.highest_bid || 0) + 1).toLocaleString()}
                      </div>
                    </div>
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setShowBidForm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="submit-bid-btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="loading-spinner-small"></span>
                            Placing Bid...
                          </>
                        ) : (
                          <>
                            <span className="btn-icon">🚀</span>
                            Submit Bid
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {daysRemaining <= 0 && (
              <div className="bidding-closed">
                <span className="closed-icon">🔒</span>
                <p>Bidding has closed for this contract</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}
    </div>
  );
};

export default ContractDetails;
