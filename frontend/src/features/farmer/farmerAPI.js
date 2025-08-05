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