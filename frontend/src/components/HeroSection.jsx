import React from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero" id="home">
      <div className="hero-background">
        <div className="hero-pattern"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Connecting Farmers & Consumers
              <span className="hero-highlight"> Directly</span>
            </h1>
            
            <p className="hero-description">
              AgroNet revolutionizes agriculture by creating direct connections between farmers and consumers, 
              ensuring fair prices, fresh produce, and sustainable farming practices.
            </p>
            
            <div className="hero-actions">
              <Link to="/auth" className="btn btn-primary btn-large">
                Get Started
              </Link>
              <a href="#about" className="btn btn-secondary btn-large">
                Learn More
              </a>
            </div>
          </div>
          
          <div className="hero-visual">
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;