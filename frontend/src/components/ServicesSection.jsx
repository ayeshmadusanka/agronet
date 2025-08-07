import React from 'react';
import { Link } from 'react-router-dom';
import './ServicesSection.css';

const ServicesSection = () => {
  return (
    <section className="services" id="services">
      <div className="container">
        <div className="services-content">
          <div className="services-header">
            <h2 className="services-title">Our Services</h2>
            <p className="services-subtitle">
              Comprehensive solutions for modern agriculture
            </p>
          </div>
          
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📋</div>
              <h3>Crop Contract Bidding</h3>
              <p>
                Connect with farmers for contract farming opportunities. 
                Place bids for specific crops, quantities, and delivery schedules 
                with transparent pricing and secure agreements.
              </p>
              <ul className="service-features">
                <li>Transparent bidding process</li>
                <li>Secure contract management</li>
                <li>Quality assurance guarantees</li>
                <li>Flexible delivery schedules</li>
              </ul>
              <Link to="/auth" className="service-cta">
                Start Bidding
              </Link>
            </div>
            
            <div className="service-card">
              <div className="service-icon">🛒</div>
              <h3>Instant Marketplace</h3>
              <p>
                Buy fresh produce directly from farmers with instant availability. 
                Browse through a wide variety of crops, compare prices, and 
                get fresh products delivered to your doorstep.
              </p>
              <ul className="service-features">
                <li>Real-time inventory</li>
                <li>Direct farmer pricing</li>
                <li>Fresh product guarantee</li>
                <li>Fast delivery options</li>
              </ul>
              <Link to="/auth" className="service-cta">
                Browse Products
              </Link>
            </div>
          </div>
          
          <div className="services-stats">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Contracts</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10k+</div>
              <div className="stat-label">Products Sold</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Platform Availability</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;