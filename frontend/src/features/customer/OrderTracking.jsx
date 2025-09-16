import React, { useState, useEffect } from 'react';
import './OrderTracking.css';

const OrderTracking = ({ orderId, onClose }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrderTracking();
    }
  }, [orderId]);

  const fetchOrderTracking = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customer/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order tracking');
      }

      const data = await response.json();
      setOrderData(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const statusMap = {
      'pending': 1,
      'farmer_approved': 2,
      'ready_for_pickup': 3,
      'assigned_to_driver': 4,
      'picked_up': 5,
      'in_transit': 6,
      'delivered': 7,
      'completed': 8
    };
    return statusMap[status] || 0;
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': 'Order Placed',
      'farmer_approved': 'Approved by Farmer',
      'ready_for_pickup': 'Ready for Pickup',
      'assigned_to_driver': 'Driver Assigned',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'completed': 'Completed'
    };
    return statusLabels[status] || status;
  };

  const getStatusIcon = (status, current) => {
    const currentStep = getStatusStep(orderData?.status);
    const thisStep = getStatusStep(status);

    if (thisStep <= currentStep) {
      return '✅';
    } else {
      return '⭕';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="order-tracking-modal">
        <div className="modal-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading order tracking...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-tracking-modal">
        <div className="modal-content">
          <div className="error-state">
            <h3>Error Loading Order</h3>
            <p>{error}</p>
            <button onClick={onClose} className="close-btn">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  const trackingSteps = [
    { status: 'pending', label: 'Order Placed', time: orderData.created_at },
    { status: 'farmer_approved', label: 'Approved by Farmer', time: orderData.farmer_approval_status ? Object.values(orderData.farmer_approval_status).find(f => f.status === 'approved')?.approved_at : null },
    { status: 'ready_for_pickup', label: 'Ready for Pickup', time: orderData.ready_for_pickup_at },
    { status: 'assigned_to_driver', label: 'Driver Assigned', time: orderData.driver_assigned_at },
    { status: 'picked_up', label: 'Picked Up', time: orderData.picked_up_at },
    { status: 'in_transit', label: 'In Transit', time: orderData.in_transit_at },
    { status: 'delivered', label: 'Delivered', time: orderData.delivered_at },
    { status: 'completed', label: 'Completed', time: orderData.completed_at }
  ];

  const currentStep = getStatusStep(orderData.status);

  return (
    <div className="order-tracking-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Order Tracking #{orderData.order_number}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="order-summary">
          <div className="order-info">
            <div className="info-item">
              <span className="label">Total Amount:</span>
              <span className="value">${orderData.total_amount}</span>
            </div>
            <div className="info-item">
              <span className="label">Current Status:</span>
              <span className="value status">{getStatusLabel(orderData.status)}</span>
            </div>
          </div>
        </div>

        <div className="tracking-timeline">
          <h3>Order Progress</h3>

          <div className="timeline">
            {trackingSteps.map((step, index) => {
              const isCompleted = getStatusStep(step.status) <= currentStep;
              const isCurrent = getStatusStep(step.status) === currentStep;
              const isRejected = orderData.status === 'farmer_rejected' && step.status === 'farmer_approved';

              return (
                <div key={step.status} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isRejected ? 'rejected' : ''}`}>
                  <div className="step-connector">
                    {index < trackingSteps.length - 1 && (
                      <div className={`connector-line ${isCompleted ? 'completed' : ''}`}></div>
                    )}
                  </div>

                  <div className="step-marker">
                    <div className="marker-circle">
                      {isRejected ? '❌' : (isCompleted ? '✅' : (isCurrent ? '🔄' : '⭕'))}
                    </div>
                  </div>

                  <div className="step-content">
                    <div className="step-title">{step.label}</div>
                    <div className="step-time">
                      {isRejected ? 'Rejected' : formatTime(step.time)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-section">
          <h3>Order Items</h3>
          <div className="items-list">
            {orderData.order_items?.map((item, index) => (
              <div key={index} className="order-item">
                <span className="item-name">{item.product?.name || 'Product'}</span>
                <span className="item-quantity">{item.quantity} {item.product?.unit || 'kg'}</span>
                <span className="item-price">${item.total_price || '0.00'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Information */}
        {orderData.driver && (
          <div className="driver-section">
            <h3>Driver Information</h3>
            <div className="driver-info">
              <div className="driver-details">
                <div><strong>Name:</strong> {orderData.driver.name}</div>
                <div><strong>Phone:</strong> {orderData.driver.phone}</div>
                <div><strong>Vehicle:</strong> {orderData.driver.vehicle_type} - {orderData.driver.vehicle_number}</div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {(orderData.farmer_notes || orderData.driver_notes) && (
          <div className="notes-section">
            <h3>Notes</h3>
            {orderData.farmer_notes && (
              <div className="note">
                <strong>Farmer Notes:</strong> {orderData.farmer_notes}
              </div>
            )}
            {orderData.driver_notes && (
              <div className="note">
                <strong>Driver Notes:</strong> {orderData.driver_notes}
              </div>
            )}
          </div>
        )}

        {/* Rejection Reason */}
        {orderData.status === 'farmer_rejected' && orderData.rejection_reason && (
          <div className="rejection-section">
            <h3>Order Rejected</h3>
            <div className="rejection-reason">
              <strong>Reason:</strong> {orderData.rejection_reason}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;