import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;

export const getFarmerInfo = (token) =>
  axios.get(`${apiUrl}/user`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getFarmerContracts = (farmerId) =>
  axios.get(`${apiUrl}/contracts?farmer_id=${farmerId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export const applyForContract = (contractId, info, token) =>
  axios.post(
    `${apiUrl}/contracts/${contractId}/apply`,
    { info },
    { headers: { Authorization: `Bearer ${token}` } }
  );

// Subscription API calls
export const getSubscriptionDetails = (token) =>
  axios.get(`${apiUrl}/farmer/subscription`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const upgradeToProSubscription = (token) =>
  axios.post(`${apiUrl}/farmer/subscription/upgrade`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const downgradeToBasicSubscription = (token) =>
  axios.post(`${apiUrl}/farmer/subscription/downgrade`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Stats API calls
export const getFarmerStats = (token) =>
  axios.get(`${apiUrl}/farmer/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });