import React, { useEffect, useState } from 'react';
import { getContracts, deleteContract } from './adminAPI';
import { useNavigate } from 'react-router-dom';

const ContractList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const res = await getContracts();
      setContracts(res.data.contracts || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contractId) => {
    navigate(`/admin/edit-contract/${contractId}`);
  };

  const handleDelete = async (contractId) => {
    try {
      setActionLoading(contractId);
      await deleteContract(contractId);
      await loadContracts();
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting contract:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Active', class: 'status-active' },
      pending: { label: 'Pending', class: 'status-pending' },
      completed: { label: 'Completed', class: 'status-completed' },
      closed: { label: 'Closed', class: 'status-closed' }
    };
    return statusMap[status] || { label: status || 'Unknown', class: 'status-default' };
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesFilter = filter === 'all' || contract.status === filter;
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contract.description && contract.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getFilterCounts = () => {
    return {
      all: contracts.length,
      active: contracts.filter(c => c.status === 'active').length,
      pending: contracts.filter(c => c.status === 'pending').length,
      completed: contracts.filter(c => c.status === 'completed').length,
      closed: contracts.filter(c => c.status === 'closed').length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading contracts...</p>
      </div>
    );
  }

  return (
    <div className="contracts-management">
      <div className="contracts-header">
        <div className="contracts-title-section">
          <h2 className="contracts-title">Contracts Management</h2>
          <p className="contracts-subtitle">Manage and monitor all farming contracts</p>
        </div>
        
        <div className="contracts-actions">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="create-contract-btn"
            onClick={() => navigate('/admin/create-contract')}
          >
            <span className="btn-icon">➕</span>
            Create Contract
          </button>
        </div>
      </div>

      <div className="contracts-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Contracts ({counts.all})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({counts.active})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({counts.pending})
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({counts.completed})
        </button>
        <button
          className={`filter-btn ${filter === 'closed' ? 'active' : ''}`}
          onClick={() => setFilter('closed')}
        >
          Closed ({counts.closed})
        </button>
      </div>

      <div className="contracts-grid">
        {filteredContracts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>No contracts found</h3>
            <p>No contracts match your current filter criteria.</p>
          </div>
        ) : (
          filteredContracts.map(contract => {
            const contractId = contract._id || contract.id;
            const status = getStatusBadge(contract.status);
            const isLoading = actionLoading === contractId;

            return (
              <div key={contractId} className="contract-card">
                <div className="contract-header">
                  <div className="contract-info">
                    <h3 className="contract-name">{contract.name}</h3>
                    <p className="contract-description">
                      {contract.description || 'No description provided'}
                    </p>
                  </div>
                  <span className={`status-badge ${status.class}`}>
                    {status.label}
                  </span>
                </div>

                <div className="contract-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <div className="detail-content">
                      <span className="detail-label">Deadline</span>
                      <span className="detail-value">
                        {contract.deadline ? new Date(contract.deadline).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="contract-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(contractId)}
                  >
                    <span className="btn-icon">✏️</span>
                    Edit
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => setShowDeleteModal(contractId)}
                    disabled={isLoading}
                  >
                    <span className="btn-icon">🗑️</span>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <span className="modal-icon">⚠️</span>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to delete this contract? This action cannot be undone.</p>
              <div className="contract-preview">
                <strong>{contracts.find(c => (c._id || c.id) === showDeleteModal)?.name}</strong>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(null)}
                disabled={actionLoading === showDeleteModal}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={() => handleDelete(showDeleteModal)}
                disabled={actionLoading === showDeleteModal}
              >
                {actionLoading === showDeleteModal ? (
                  <>
                    <span className="btn-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🗑️</span>
                    Delete Contract
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractList;