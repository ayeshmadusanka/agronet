import React from 'react';

const Button = ({ text, ...props }) => (
  <button {...props} className="main-btn">
    {text}
  </button>
);

export default Button;