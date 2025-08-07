import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <div className="navbar-brand">
            <Link to="/" className="brand-link">
              <span className="brand-text">AgroNet</span>
            </Link>
          </div>
          
          <div className="navbar-menu">
            <a href="#home" className="nav-link">Home</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#services" className="nav-link">Services</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>

          <div className="navbar-actions">
            <Link to="/auth" className="btn btn-primary">Login</Link>
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
        
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <a href="#home" className="mobile-nav-link" onClick={closeMobileMenu}>Home</a>
            <a href="#about" className="mobile-nav-link" onClick={closeMobileMenu}>About</a>
            <a href="#services" className="mobile-nav-link" onClick={closeMobileMenu}>Services</a>
            <a href="#contact" className="mobile-nav-link" onClick={closeMobileMenu}>Contact</a>
            <Link to="/auth" className="btn btn-primary mobile-login-btn" onClick={closeMobileMenu}>
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;