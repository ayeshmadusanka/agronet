import axios from 'axios';

const apiUrl = 'http://127.0.0.1:8000/api';

// Configure axios to disable caching
axios.defaults.headers.common['Cache-Control'] = 'no-cache';
axios.defaults.headers.common['Pragma'] = 'no-cache';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

// PRODUCT MANAGEMENT API (FARMER)
export const getFarmerProducts = () =>
  axios.get(`${apiUrl}/farmer/products`, { headers: getAuthHeaders() });

export const createProduct = (productData) =>
  axios.post(`${apiUrl}/farmer/products`, productData, { headers: getAuthHeaders() });

export const updateProduct = (productId, productData) =>
  axios.put(`${apiUrl}/farmer/products/${productId}`, productData, { headers: getAuthHeaders() });

export const deleteProduct = (productId) =>
  axios.delete(`${apiUrl}/farmer/products/${productId}`, { headers: getAuthHeaders() });

// MARKETPLACE API (CUSTOMER)
export const getMarketplaceProducts = () =>
  axios.get(`${apiUrl}/marketplace/products`, { 
    headers: {
      ...getAuthHeaders(),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    // Add timestamp to prevent caching
    params: {
      _t: Date.now()
    }
  });

// CART MANAGEMENT API (CUSTOMER)
export const getCart = () =>
  axios.get(`${apiUrl}/cart`, { headers: getAuthHeaders() });

export const addToCart = (productId, quantity) =>
  axios.post(`${apiUrl}/cart/add`, { product_id: productId, quantity }, { headers: getAuthHeaders() });

export const updateCartItem = (cartItemId, quantity) =>
  axios.put(`${apiUrl}/cart/${cartItemId}`, { quantity }, { headers: getAuthHeaders() });

export const removeFromCart = (cartItemId) =>
  axios.delete(`${apiUrl}/cart/${cartItemId}`, { headers: getAuthHeaders() });

// ORDER MANAGEMENT API (CUSTOMER)
export const placeOrder = (orderData) =>
  axios.post(`${apiUrl}/orders`, orderData, { headers: getAuthHeaders() });

export const getCustomerOrders = () =>
  axios.get(`${apiUrl}/orders`, { headers: getAuthHeaders() });

export const getFarmerOrders = () =>
  axios.get(`${apiUrl}/farmer/orders`, { headers: getAuthHeaders() });

export const updateOrderStatus = (orderId, status) =>
  axios.put(`${apiUrl}/farmer/orders/${orderId}/status`, { status }, { headers: getAuthHeaders() });