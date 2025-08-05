import { logout } from '../features/auth/authAPI';

export const handleLogout = async (options = {}) => {
  const { showConfirmation = true, redirectTo = '/' } = options;
  
  try {
    // Show confirmation dialog if requested
    if (showConfirmation) {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (!confirmed) {
        return false;
      }
    }

    // Call logout API
    await logout();
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
    // Redirect to login page or specified route
    window.location.href = redirectTo;
    
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    
    // Even if API call fails, clear local storage and redirect
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = redirectTo;
    
    return false;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token && role;
};

export const getUserRole = () => {
  return localStorage.getItem('role');
};