import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const Logo: React.FC<IconProps> = (props) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="logo-main-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00A9FF" />
        <stop offset="100%" stopColor="#008FDB" />
      </linearGradient>
      <linearGradient id="logo-accent-gradient" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#CDF5FD" />
        <stop offset="100%" stopColor="#A0E9FF" />
      </linearGradient>
    </defs>
    
    {/* Main Shape - stylized gear/brain */}
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M32 8C19.8497 8 10 17.8497 10 30V34C10 46.1503 19.8497 56 32 56C44.1503 56 54 46.1503 54 34V30C54 17.8497 44.1503 8 32 8ZM42 34C42 39.5228 37.5228 44 32 44C26.4772 44 22 39.5228 22 34V30H42V34Z" 
      fill="url(#logo-main-gradient)"
    />
    
    {/* Upward Arrow / Strategic Element */}
    <path 
      d="M28 26L32 18L36 26L34 26V36H30V26H28Z" 
      fill="url(#logo-accent-gradient)"
    />
  </svg>
);