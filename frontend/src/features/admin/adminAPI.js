import axios from 'axios';
const apiUrl = process.env.REACT_APP_API_URL;

export const getCounts = () =>
  axios.get(`${apiUrl}/admin/counts`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export const getFarmers = () =>
  axios.get(`${apiUrl}/farmers`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export const getCustomers = () =>
  axios.get(`${apiUrl}/customers`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export const getContracts = () =>
  axios.get(`${apiUrl}/contracts`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });


export const createContract = (data) =>
  axios.post(`${apiUrl}/create_contracts`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });


export const approveFarmer = (farmerId) =>
  axios.patch(`${apiUrl}/farmers/${farmerId}/approve`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });


export const rejectFarmer = (farmerId) =>
  axios.patch(`${apiUrl}/farmers/${farmerId}/reject`, {}, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });


export const getCustomerDetails = (customerId) =>
  axios.get(`${apiUrl}/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  

export const deleteContract = (contractId) =>
  axios.delete(`${apiUrl}/admin/contracts/${contractId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export const getContract = (contractId) =>
  axios.get(`${apiUrl}/admin/contracts/${contractId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

export const updateContract = (contractId, data) =>
  axios.put(`${apiUrl}/admin/contracts/${contractId}`, data, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });