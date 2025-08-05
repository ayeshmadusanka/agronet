import axios from 'axios';
const apiUrl = process.env.REACT_APP_API_URL;

export const getContracts = () =>
  axios.get(`${apiUrl}/contracts`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export const getContractDetails = (contractId) =>
  axios.get(`${apiUrl}/contracts/${contractId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export const placeBid = (contractId, amount) =>
  axios.post(`${apiUrl}/contracts/${contractId}/bid`, { amount }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });