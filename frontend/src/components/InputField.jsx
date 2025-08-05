import React from 'react';

const InputField = ({ label, ...props }) => (
  <div className="input-group">
    <label>{label}</label>
    <input {...props} />
  </div>
);

export default InputField;