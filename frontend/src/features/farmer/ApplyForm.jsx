import React, { useState, useEffect } from 'react';
import { applyForContract } from './farmerAPI';
import './ApplyForm.css';

const ApplyForm = ({ farmerId, contractId, onClose, contractData }) => {
  const [formData, setFormData] = useState({
    experience: '',
    farmSize: '',
    equipment: '',
    certifications: '',
    previousWork: '',
    proposedTimeline: '',
    additionalInfo: '',
    contactPreference: 'email'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.experience.trim() && formData.farmSize.trim();
      case 2:
        return formData.equipment.trim() && formData.proposedTimeline.trim();
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError('');
    } else {
      setError('Please fill in all required fields for this step.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const applicationData = {
        ...formData,
        farmerId,
        contractId
      };
      
      await applyForContract(contractId, applicationData, token);
      setSuccess('Application submitted successfully! You will be notified of the decision within 5-7 business days.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>📋 Basic Information</h3>
              <p>Tell us about your farming background and capabilities</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="experience">
                  Farming Experience <span className="required">*</span>
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Describe your farming experience, including years of experience, types of crops grown, and any specializations..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="farmSize">
                  Farm Size (acres) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="farmSize"
                  name="farmSize"
                  value={formData.farmSize}
                  onChange={handleInputChange}
                  placeholder="Enter total farm size in acres"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="certifications">
                  Certifications & Licenses
                </label>
                <textarea
                  id="certifications"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleInputChange}
                  placeholder="List any relevant certifications (Organic, GAP, etc.), licenses, or professional memberships..."
                  rows="3"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>🚜 Equipment & Timeline</h3>
              <p>Details about your farming equipment and proposed timeline</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="equipment">
                  Available Equipment <span className="required">*</span>
                </label>
                <textarea
                  id="equipment"
                  name="equipment"
                  value={formData.equipment}
                  onChange={handleInputChange}
                  placeholder="List your available farming equipment (tractors, harvesters, irrigation systems, etc.)..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="proposedTimeline">
                  Proposed Timeline <span className="required">*</span>
                </label>
                <textarea
                  id="proposedTimeline"
                  name="proposedTimeline"
                  value={formData.proposedTimeline}
                  onChange={handleInputChange}
                  placeholder="Provide a detailed timeline for project completion, including planting, cultivation, and harvest schedules..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="previousWork">
                  Previous Similar Projects
                </label>
                <textarea
                  id="previousWork"
                  name="previousWork"
                  value={formData.previousWork}
                  onChange={handleInputChange}
                  placeholder="Describe any similar contracts or projects you've completed, including outcomes and references..."
                  rows="3"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>✉️ Additional Information</h3>
              <p>Any additional details and communication preferences</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="additionalInfo">
                  Additional Information
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Any additional information you'd like to share about your application..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactPreference">
                  Preferred Contact Method
                </label>
                <select
                  id="contactPreference"
                  name="contactPreference"
                  value={formData.contactPreference}
                  onChange={handleInputChange}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both Email and Phone</option>
                </select>
              </div>

              <div className="application-summary">
                <h4>Application Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Farm Size:</span>
                    <span className="summary-value">{formData.farmSize} acres</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Contact Preference:</span>
                    <span className="summary-value">{formData.contactPreference}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Experience:</span>
                    <span className="summary-value">{formData.experience.length > 50 ? formData.experience.substring(0, 50) + '...' : formData.experience}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="apply-form-container">
        <div className="success-state">
          <div className="success-icon">✅</div>
          <h2>Application Submitted Successfully!</h2>
          <p>{success}</p>
          <div className="success-actions">
            <button className="primary-btn" onClick={onClose}>
              Return to Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-form-container">
      <div className="apply-form-header">
        <button className="close-btn" onClick={onClose} aria-label="Close form">
          ✕
        </button>
        <div className="form-title-section">
          <h2>Apply for Contract</h2>
          {contractData && (
            <div className="contract-info">
              <h3>{contractData.name}</h3>
              <p>{contractData.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="progress-indicator">
        <div className="step-indicators">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`step-indicator ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            >
              <div className="step-number">
                {currentStep > step ? '✓' : step}
              </div>
              <div className="step-label">
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Equipment & Timeline'}
                {step === 3 && 'Additional Details'}
              </div>
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <form className="apply-form" onSubmit={handleSubmit}>
        {renderStepContent()}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="form-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="secondary-btn"
              onClick={prevStep}
              disabled={loading}
            >
              Previous
            </button>
          )}
          
          <div className="action-buttons">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                className="primary-btn"
                onClick={nextStep}
                disabled={loading}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="primary-btn submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ApplyForm;