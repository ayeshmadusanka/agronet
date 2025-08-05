import axios from 'axios';

const apiUrl = 'http://127.0.0.1:8000/api';

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