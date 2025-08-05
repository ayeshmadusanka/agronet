import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerDashboard from '../features/customer/CustomerDashboard';
import ContractDetails from '../features/customer/ContractDetails';

const CustomerHomePage = () => (
  <Routes>
    <Route path="/" element={<CustomerDashboard />} />
    <Route path="/contract/:contractId" element={<ContractDetails />} />
  </Routes>
);

export default CustomerHomePage;