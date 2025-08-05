import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FarmerDashboard from '../features/farmer/FarmerDashboard';
import CustomerDashboard from '../features/customer/CustomerDashboard';
import ContractDetails from '../features/customer/ContractDetails';
import AdminDashboard from '../features/admin/AdminDashboard';
import CreateContractForm from '../features/admin/CreateContractForm'; // Add this import
import EditContractForm from '../features/admin/EditContractForm';     // Add this import

const DashboardPage = () => {
  const role = localStorage.getItem('role');
  if (role === 'farmer') return <FarmerDashboard />;
  if (role === 'admin') {
    return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="create-contract" element={<CreateContractForm />} />
      <Route path="edit-contract/:contractId" element={<EditContractForm />} />
    </Routes>
    );
  }
  if (role === 'customer') {
    return (
      <Routes>
        <Route path="/" element={<CustomerDashboard />} />
        <Route path="/contract/:contractId" element={<ContractDetails />} />
      </Routes>
    );
  }
  return <div>Unknown role. Please log in again.</div>;
};

export default DashboardPage;