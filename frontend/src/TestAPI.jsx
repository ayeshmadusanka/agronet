import React, { useState, useEffect } from 'react';
import { getMarketplaceProducts } from './services/instantBuyAPI';

const TestAPI = () => {
  const [result, setResult] = useState('Loading...');

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API...');
        console.log('Token:', localStorage.getItem('token'));
        
        const response = await getMarketplaceProducts();
        console.log('Full response:', response);
        
        setResult(JSON.stringify({
          status: response.status,
          data: response.data,
          products: response.data.products?.length || 0
        }, null, 2));
      } catch (error) {
        console.error('API Test Error:', error);
        setResult(`Error: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`);
      }
    };

    testAPI();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Test Results</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        {result}
      </pre>
    </div>
  );
};

export default TestAPI;