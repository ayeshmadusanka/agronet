import axios from 'axios';

const apiUrl = 'http://127.0.0.1:8000/api';

export const login = (email, password, role) =>
  axios.post(`${apiUrl}/login`, { email, password, role });

export const register = (form) =>
  axios.post(`${apiUrl}/register`, form);

export const logout = () => {
  const token = localStorage.getItem('token');
  return axios.post(`${apiUrl}/logout`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const logoutCurrentDevice = () => {
  const token = localStorage.getItem('token');
  return axios.post(`${apiUrl}/logout-current`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};