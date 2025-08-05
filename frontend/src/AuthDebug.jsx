import React, { useState, useEffect } from 'react';
import { getMarketplaceProducts } from './services/instantBuyAPI';

const AuthDebug = () => {
  const [authState, setAuthState] = useState({
    token: null,
    role: null,
    isLoggedIn: false
  });
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    // Check authentication state
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    setAuthState({
      token: token,
      role: role,
      isLoggedIn: !!token
    });
  }, []);

  const testLogin = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'customer@test.com',
          password: 'password123'
        })
      });

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Fetch user info
        const userRes = await fetch('http://127.0.0.1:8000/api/user', {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        const userData = await userRes.json();
        localStorage.setItem('role', userData.role);
        
        setAuthState({
          token: data.token,
          role: userData.role,
          isLoggedIn: true
        });
        
        setTestResults(prev => ({
          ...prev,
          login: { success: true, message: 'Login successful!' }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          login: { success: false, message: 'Login failed: ' + data.message }
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        login: { success: false, message: 'Login error: ' + error.message }
      }));
    }
  };

  const testMarketplace = async () => {
    try {
      const response = await getMarketplaceProducts();
      setTestResults(prev => ({
        ...prev,
        marketplace: { 
          success: true, 
          message: `Found ${response.data.products?.length || 0} products`,
          data: response.data.products
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        marketplace: { 
          success: false, 
          message: 'Marketplace error: ' + error.message,
          details: error.response?.data
        }
      }));
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setAuthState({
      token: null,
      role: null,
      isLoggedIn: false
    });
    setTestResults({});
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px' }}>
      <h1>🔍 Authentication Debug Panel</h1>
      
      {/* Current Auth State */}
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Current Authentication State</h2>
        <p><strong>Logged In:</strong> {authState.isLoggedIn ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Role:</strong> {authState.role || 'Not set'}</p>
        <p><strong>Token:</strong> {authState.token ? `${authState.token.substring(0, 30)}...` : 'Not set'}</p>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testLogin} style={{ marginRight: '10px', padding: '10px 15px' }}>
          🔑 Test Customer Login
        </button>
        <button onClick={testMarketplace} style={{ marginRight: '10px', padding: '10px 15px' }}>
          🛍️ Test Marketplace API
        </button>
        <button onClick={clearAuth} style={{ padding: '10px 15px', background: '#ff6b6b', color: 'white' }}>
          🗑️ Clear Auth
        </button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
          <h2>Test Results</h2>
          {Object.entries(testResults).map(([test, result]) => (
            <div key={test} style={{ marginBottom: '15px' }}>
              <h3>{test.charAt(0).toUpperCase() + test.slice(1)} Test</h3>
              <p style={{ color: result.success ? 'green' : 'red' }}>
                {result.success ? '✅' : '❌'} {result.message}
              </p>
              {result.details && (
                <pre style={{ background: '#eee', padding: '10px', fontSize: '12px' }}>
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
              {result.data && (
                <div>
                  <strong>Products:</strong>
                  <ul>
                    {result.data.map((product, index) => (
                      <li key={index}>
                        {product.title} - ${product.price} by {product.farmer?.name || 'Unknown'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Instructions</h2>
        <ol>
          <li>Click "Test Customer Login" to authenticate as a customer</li>
          <li>After successful login, click "Test Marketplace API" to fetch products</li>
          <li>If both tests pass, the issue is with the main React components</li>
          <li>Check browser console for any additional errors</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthDebug;