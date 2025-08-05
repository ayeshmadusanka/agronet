import React, { useState, useEffect } from 'react';
import { getMarketplaceProducts, addToCart } from '../../services/instantBuyAPI';
import './Marketplace.css';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    loadProducts();
  }, []);

  // Add effect to reload products when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProducts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', loadProducts);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadProducts);
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading products from marketplace API...');
      console.log('🔑 Auth token:', localStorage.getItem('token')?.substring(0, 20) + '...');
      
      const response = await getMarketplaceProducts();
      console.log('✅ API Response:', response.data);
      console.log('📦 Products found:', response.data.products?.length || 0);
      
      setProducts(response.data.products || []);
      
      // Initialize quantities for each product
      const initialQuantities = {};
      (response.data.products || []).forEach(product => {
        initialQuantities[product.id] = 1;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Show error message to user
      alert(`Failed to load products: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const product = products.find(p => p.id === productId);
    const maxQuantity = product ? product.stock_quantity : 1;
    const newQuantity = Math.max(1, Math.min(parseInt(value) || 1, maxQuantity));
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));
  };

  const handleAddToCart = async (productId) => {
    try {
      setAddingToCart(productId);
      const quantity = quantities[productId] || 1;
      await addToCart(productId, quantity);
      alert(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart successfully!`);
      // Reset quantity to 1 after adding to cart
      setQuantities(prev => ({
        ...prev,
        [productId]: 1
      }));
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h2 className="marketplace-title">Instant Buy Marketplace</h2>
        <p className="marketplace-subtitle">Fresh products directly from farmers</p>
        {products.length > 0 && (
          <div className="marketplace-stats">
            <div className="stat-item">
              <span className="stat-icon">🌾</span>
              <span className="stat-text">{products.length} Products</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">👨‍🌾</span>
              <span className="stat-text">{new Set(products.map(p => p.farmer?.id)).size} Farmers</span>
            </div>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🌾</span>
          <h3>No products available</h3>
          <p>Check back later for fresh products from our farmers</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="marketplace-product-card">
              <div className="product-image">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} />
                ) : (
                  <div className="placeholder-image">
                    <span>🌱</span>
                    <p>No Image</p>
                  </div>
                )}
              </div>
              
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">{product.description}</p>
                
                <div className="product-meta">
                  <div className="farmer-info">
                    <span className="farmer-icon">👨‍🌾</span>
                    <span className="farmer-name">by {product.farmer?.name || 'Farmer'}</span>
                  </div>
                  <div className="stock-info">
                    <span className="stock-icon">📦</span>
                    <span className="stock-text">{product.stock_quantity} available</span>
                  </div>
                </div>

                <div className="product-footer">
                  <div className="price-section">
                    <span className="price-label">Price</span>
                    <span className="price-value">${product.price}</span>
                  </div>
                  
                  <div className="quantity-section">
                    <label className="quantity-label">Qty:</label>
                    <input
                      type="number"
                      className="quantity-input"
                      value={quantities[product.id] || 1}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      min="1"
                      max={product.stock_quantity}
                      disabled={product.stock_quantity === 0}
                    />
                  </div>
                  
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(product.id)}
                    disabled={addingToCart === product.id || product.stock_quantity === 0}
                  >
                    {addingToCart === product.id ? (
                      <>
                        <span className="btn-spinner"></span>
                        Adding...
                      </>
                    ) : product.stock_quantity === 0 ? (
                      <>
                        <span className="btn-icon">❌</span>
                        Out of Stock
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">🛒</span>
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;