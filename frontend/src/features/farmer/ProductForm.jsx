import React, { useState } from 'react';
import { createProduct, updateProduct } from '../../services/instantBuyAPI';
import './ProductForm.css';

const ProductForm = ({ product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || '',
    stock_quantity: product?.stock_quantity || '',
    image_url: product?.image_url || '',
    status: product?.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Product title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.stock_quantity || formData.stock_quantity < 1) {
      newErrors.stock_quantity = 'Stock quantity must be at least 1';
    }

    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (product) {
        await updateProduct(product.id, formData);
      } else {
        await createProduct(formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Failed to save product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form-container">
        <div className="product-form-header">
          <h2 className="product-form-title">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <span>×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📝</span>
              Product Information
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🏷️</span>
                  Product Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter product title"
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📄</span>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={`form-textarea ${errors.description ? 'error' : ''}`}
                  placeholder="Describe your product in detail"
                  rows={4}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📷</span>
                  Product Image URL
                  <span className="label-optional">(Optional)</span>
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className={`form-input ${errors.image_url ? 'error' : ''}`}
                  placeholder="https://example.com/product-image.jpg"
                />
                {errors.image_url && <span className="error-message">{errors.image_url}</span>}
                <small className="form-help">
                  Provide a direct link to your product image for better visibility
                </small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">💰</span>
              Pricing & Inventory
            </h3>

            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">
                  <span className="label-icon">💵</span>
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`form-input ${errors.price ? 'error' : ''}`}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group half-width">
                <label className="form-label">
                  <span className="label-icon">📦</span>
                  Stock Quantity
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  className={`form-input ${errors.stock_quantity ? 'error' : ''}`}
                  placeholder="0"
                  min="1"
                />
                {errors.stock_quantity && <span className="error-message">{errors.stock_quantity}</span>}
              </div>
            </div>

            {product && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📊</span>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              <span className="btn-icon">❌</span>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  {product ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <span className="btn-icon">✅</span>
                  {product ? 'Update Product' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;