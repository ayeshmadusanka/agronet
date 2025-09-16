import React, { useState, useEffect } from 'react';
import './FarmerDashboard.css';
import './ContractStyles.css';

const AvailableContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [biddingContract, setBiddingContract] = useState(null);
  const [bidForm, setBidForm] = useState({
    quantity_offered: '',
    price_per_kilo: '',
    message: ''
  });
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contracts', {
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

  const handleBidFormChange = (e) => {
    setBidForm({ ...bidForm, [e.target.name]: e.target.value });
  };

  const calculateTotal = () => {
    const quantity = parseFloat(bidForm.quantity_offered) || 0;
    const price = parseFloat(bidForm.price_per_kilo) || 0;
    return (quantity * price).toFixed(2);
  };

  const submitBid = async (e) => {
    e.preventDefault();
    setSubmittingBid(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contracts/${biddingContract}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bidForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place bid');
      }

      const data = await response.json();

      if (data.contract_awarded) {
        alert('🎉 Congratulations! Your bid won the contract automatically! You had the lowest qualifying price.');
      } else {
        alert('✅ Bid placed successfully! If you have the lowest qualifying price, the contract will be awarded to you automatically.');
      }

      setBiddingContract(null);
      setBidForm({
        quantity_offered: '',
        price_per_kilo: '',
        message: ''
      });
      fetchContracts(); // Refresh contracts
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSubmittingBid(false);
    }
  };

  const isDeadlineSoon = (deadline) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = (deadlineDate - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  if (loading) {
    return <div className="loading">Loading available contracts...</div>;
  }

  if (error) {
    return <div className="error-message">❌ {error}</div>;
  }

  return (
    <div className="available-contracts">
      <div className="dashboard-header">
        <h2>Available Contracts</h2>
        <p>🆕 NEW: Contracts are automatically awarded to the LOWEST QUALIFIED bidder!</p>
      </div>

      {contracts.length === 0 ? (
        <div className="empty-state">
          <h3>No active contracts</h3>
          <p>No buyers are currently looking for crops. Check back later!</p>
        </div>
      ) : (
        <div className="contracts-grid">
          {contracts.map((contract) => (
            <div key={contract.id} className="contract-card">
              <div className="contract-header">
                <h3>{contract.title}</h3>
                {isDeadlineSoon(contract.deadline) && (
                  <span className="urgent-badge">⏰ Urgent</span>
                )}
              </div>

              <div className="contract-details">
                <div className="detail-row">
                  <span className="label">Crop:</span>
                  <span className="value">{contract.crop_type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Quantity:</span>
                  <span className="value">{contract.quantity_needed} kg</span>
                </div>
                <div className="detail-row">
                  <span className="label">Preferred Price:</span>
                  <span className="value">${contract.preferred_price_per_kilo}/kg</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{contract.location}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Deadline:</span>
                  <span className="value">
                    {new Date(contract.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Buyer:</span>
                  <span className="value">{contract.buyer_name}</span>
                </div>
              </div>

              <div className="contract-description">
                <p>{contract.description}</p>
              </div>

              <div className="bid-info">
                <div className="bid-stats">
                  <span className="bid-count">{contract.bid_count} bids</span>
                  {contract.lowest_price_bid && (
                    <span className="lowest-bid">
                      Lowest: ${contract.lowest_price_bid}/kg
                    </span>
                  )}
                </div>
              </div>

              <button
                className="place-bid-btn"
                onClick={() => setBiddingContract(contract.id)}
                disabled={biddingContract === contract.id}
              >
                Place Bid
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bid Modal */}
      {biddingContract && (
        <div className="modal-overlay">
          <div className="bid-modal">
            <div className="modal-header">
              <h3>Place Your Bid</h3>
              <button
                className="close-btn"
                onClick={() => setBiddingContract(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={submitBid} className="bid-form">
              <div className="form-group">
                <label>Quantity You Can Provide (kg) *</label>
                <input
                  type="number"
                  name="quantity_offered"
                  value={bidForm.quantity_offered}
                  onChange={handleBidFormChange}
                  placeholder="Enter quantity in kg"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Your Price per Kilo ($) *</label>
                <input
                  type="number"
                  name="price_per_kilo"
                  value={bidForm.price_per_kilo}
                  onChange={handleBidFormChange}
                  placeholder="Enter your price per kg"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              {bidForm.quantity_offered && bidForm.price_per_kilo && (
                <div className="total-calculation">
                  <strong>Total Amount: ${calculateTotal()}</strong>
                </div>
              )}

              <div className="form-group">
                <label>Additional Message (Optional)</label>
                <textarea
                  name="message"
                  value={bidForm.message}
                  onChange={handleBidFormChange}
                  placeholder="Add any additional information about your produce quality, delivery terms, etc."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setBiddingContract(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-bid-btn"
                  disabled={submittingBid}
                >
                  {submittingBid ? 'Placing Bid...' : 'Place Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableContracts;