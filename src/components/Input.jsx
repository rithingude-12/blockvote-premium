import React from 'react';
import './Input.css';

const Input = ({ label, className = '', ...props }) => {
  return (
    <div className={`apple-input-wrapper ${className}`}>
      {label && <label className="apple-label">{label}</label>}
      <input className="apple-input" {...props} />
    </div>
  );
};

export default Input;
