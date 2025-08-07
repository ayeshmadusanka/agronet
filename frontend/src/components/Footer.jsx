import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <h3 className="brand-text">AgroNet</h3>
              <p className="brand-description">
                Connecting farmers and consumers for a sustainable agricultural future.
              </p>
            </div>
            <div className="footer-social">
              <a href="https://facebook.com/agronet" className="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <span className="social-icon">📘</span>
              </a>
              <a href="https://twitter.com/agronet" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <span className="social-icon">🐦</span>
              </a>
              <a href="https://instagram.com/agronet" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <span className="social-icon">📷</span>
              </a>
              <a href="https://linkedin.com/company/agronet" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <span className="social-icon">💼</span>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home" className="footer-link">Home</a></li>
              <li><a href="#about" className="footer-link">About Us</a></li>
              <li><a href="#services" className="footer-link">Services</a></li>
              <li><a href="#contact" className="footer-link">Contact</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">For Farmers</h4>
            <ul className="footer-links">
              <li><Link to="/auth" className="footer-link">Join as Farmer</Link></li>
              <li><Link to="#" className="footer-link">Sell Products</Link></li>
              <li><Link to="#" className="footer-link">Contract Farming</Link></li>
              <li><Link to="#" className="footer-link">Resources</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">For Customers</h4>
            <ul className="footer-links">
              <li><Link to="/auth" className="footer-link">Sign Up</Link></li>
              <li><Link to="#" className="footer-link">Browse Products</Link></li>
              <li><Link to="#" className="footer-link">Fresh Delivery</Link></li>
              <li><Link to="#" className="footer-link">Support</Link></li>
            </ul>
          </div>
          
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} AgroNet. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link to="#" className="footer-bottom-link">Privacy Policy</Link>
              <Link to="#" className="footer-bottom-link">Terms of Service</Link>
              <Link to="#" className="footer-bottom-link">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;