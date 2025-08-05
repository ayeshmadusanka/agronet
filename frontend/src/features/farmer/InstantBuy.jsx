import React, { useState } from 'react';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import SellingHistory from './SellingHistory';
import './InstantBuy.css';

const InstantBuy = () => {
  const [currentView, setCurrentView] = useState('products');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    setRefreshList(prev => prev + 1); // Trigger refresh
  };

  const renderTabNavigation = () => (
    <div className="farmer-instant-buy-tabs">
      <button 
        className={`tab-btn ${currentView === 'products' ? 'active' : ''}`}
        onClick={() => setCurrentView('products')}
      >
        <span className="tab-icon">🌾</span>
        My Products
      </button>
      <button 
        className={`tab-btn ${currentView === 'sales' ? 'active' : ''}`}
        onClick={() => setCurrentView('sales')}
      >
        <span className="tab-icon">📊</span>
        Sales History
      </button>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'products':
        return (
          <ProductList
            key={refreshList}
            onCreateProduct={handleCreateProduct}
            onEditProduct={handleEditProduct}
          />
        );
      
      case 'sales':
        return <SellingHistory />;
      
      default:
        return (
          <ProductList
            key={refreshList}
            onCreateProduct={handleCreateProduct}
            onEditProduct={handleEditProduct}
          />
        );
    }
  };

  return (
    <div className="farmer-instant-buy">
      {!showForm && renderTabNavigation()}
      {renderContent()}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default InstantBuy;