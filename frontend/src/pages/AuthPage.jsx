import React, { useState } from 'react';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';

const AuthPage = () => {
  const [showRegister, setShowRegister] = useState(false);

  return showRegister ? (
    <Register switchToLogin={() => setShowRegister(false)} />
  ) : (
    <Login switchToRegister={() => setShowRegister(true)} />
  );
};

export default AuthPage;