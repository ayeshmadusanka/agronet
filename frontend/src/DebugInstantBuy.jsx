import React, { useState, useEffect } from 'react';
import { getMarketplaceProducts } from './services/instantBuyAPI';

const DebugInstantBuy = () => {
  const [status, setStatus] = useState('Initializing...');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const debugFlow = async () => {
      try {
        setStatus('Checking token...');
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('No token found in localStorage');
          setStatus('Failed: No authentication token');
          return;
        }

        setStatus(`Token found: ${token.substring(0, 20)}...`);

        setStatus('Calling marketplace API...');
        const response = await getMarketplaceProducts();
        
        setStatus('API response received');
        setProducts(response.data.products || []);
        setStatus(`Success: ${response.data.products?.length || 0} products loaded`);

      } catch (error) {
        console.error('Debug error:', error);
        setError({
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        setStatus('Failed: ' + error.message);
      }
    };

    debugFlow();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 Instant Buy Debug Panel</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Status: {status}</h3>
      </div>

      {error && (
        <div style={{ background: '#ffe6e6', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3>❌ Error Details:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {products.length > 0 && (
        <div style={{ background: '#e6ffe6', padding: '10px', borderRadius: '5px' }}>
          <h3>✅ Products Loaded ({products.length}):</h3>
          {products.map((product, index) => (
            <div key={product.id} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
              <h4>{index + 1}. {product.title} - ${product.price}</h4>
              <p><strong>Farmer:</strong> {product.farmer?.name || 'Unknown'}</p>
              <p><strong>Stock:</strong> {product.stock_quantity}</p>
              <p><strong>Description:</strong> {product.description}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        <h3>Debug Info:</h3>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>Token in localStorage:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
        <p><strong>Role in localStorage:</strong> {localStorage.getItem('role') || 'Not set'}</p>
      </div>
    </div>
  );
};

export default DebugInstantBuy;