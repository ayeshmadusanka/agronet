import React from 'react';
import './AboutSection.css';

const AboutSection = () => {
  return (
    <section className="about" id="about">
      <div className="container">
        <div className="about-content">
          <div className="about-header">
            <h2 className="about-title">About AgroNet</h2>
            <p className="about-subtitle">
              Revolutionizing agriculture through technology and direct connections
            </p>
          </div>
          
          <div className="about-grid">
            <div className="about-text">
              <div className="about-description">
                <p>
                  AgroNet is more than just a platform – it's a movement towards sustainable, 
                  fair, and efficient agriculture. We bridge the gap between farmers and consumers, 
                  eliminating middlemen and ensuring everyone gets the best value.
                </p>
                
                <p>
                  Our technology-driven approach helps farmers reach consumers directly, 
                  manage contracts efficiently, and build lasting relationships that benefit 
                  entire communities.
                </p>
              </div>
              
              <div className="about-stats">
                <div className="stat-item">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">Active Farmers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">5000+</div>
                  <div className="stat-label">Happy Customers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50+</div>
                  <div className="stat-label">Crop Varieties</div>
                </div>
              </div>
            </div>
            
            <div className="about-features">
              <div className="feature-card">
                <div className="feature-icon">🌾</div>
                <h3>Direct from Farm</h3>
                <p>Fresh produce delivered straight from the farmer to your table, ensuring maximum quality and freshness.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h3>Fair Pricing</h3>
                <p>Eliminate middlemen to ensure farmers get fair prices and consumers pay reasonable rates.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h3>Smart Contracts</h3>
                <p>Technology-enabled contract management for secure, transparent, and efficient transactions.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">♻️</div>
                <h3>Sustainable Practices</h3>
                <p>Promoting eco-friendly farming methods that protect our environment for future generations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;