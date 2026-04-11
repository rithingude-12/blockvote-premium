import React from 'react';
import './Card.css';

const Card = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div className={`apple-card ${noPadding ? 'no-padding' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
