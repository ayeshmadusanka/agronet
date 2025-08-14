import React, { useState, useEffect } from 'react';
import { getFarmerProducts, deleteProduct } from '../../services/instantBuyAPI';
import { formatCurrency } from '../../utils/currencyUtils';
import './ProductList.css';

const ProductList = ({ onCreateProduct, onEditProduct }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await getFarmerProducts();
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setDeleteLoading(productId);
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (product) => {
    if (product.stock_quantity === 0) {
      return <span className="status-badge out-of-stock">Out of Stock</span>;
    }
    switch (product.status) {
      case 'active':
        return <span className="status-badge active">Active</span>;
      case 'inactive':
        return <span className="status-badge inactive">Inactive</span>;
      default:
        return <span className="status-badge">{product.status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your products...</p>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <div>
          <h2 className="product-list-title">My Products</h2>
          <p className="product-list-subtitle">Manage your instant buy products</p>
        </div>
        <button className="create-product-btn" onClick={onCreateProduct}>
          <span className="btn-icon">➕</span>
          Add New Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>No products yet</h3>
          <p>Start selling by adding your first product to the marketplace</p>
          <button className="create-first-product-btn" onClick={onCreateProduct}>
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} />
                ) : (
                  <div className="placeholder-image">
                    <span>📷</span>
                    <p>No Image</p>
                  </div>
                )}
              </div>
              
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">{product.description}</p>
                
                <div className="product-details">
                  <div className="product-price">
                    <span className="price-label">Price:</span>
                    <span className="price-value">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="product-stock">
                    <span className="stock-label">Stock:</span>
                    <span className="stock-value">{product.stock_quantity} units</span>
                  </div>
                </div>

                <div className="product-status">
                  {getStatusBadge(product)}
                </div>
              </div>

              <div className="product-actions">
                <button 
                  className="action-btn edit-btn"
                  onClick={() => onEditProduct(product)}
                >
                  <span className="btn-icon">✏️</span>
                  Edit
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(product.id)}
                  disabled={deleteLoading === product.id}
                >
                  {deleteLoading === product.id ? (
                    <>
                      <span className="btn-spinner"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🗑️</span>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;