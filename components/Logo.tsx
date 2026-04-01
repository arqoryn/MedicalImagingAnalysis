
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", size = 100 }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="#0F172A" />
      
      {/* Outer White Ring */}
      <circle cx="50" cy="50" r="44" stroke="white" strokeWidth="4" />
      
      {/* "C" Shape */}
      <path 
        d="M45 30C33.9543 30 25 38.9543 25 50C25 61.0457 33.9543 70 45 70" 
        stroke="white" 
        strokeWidth="10" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* "+" Shape (Cross) */}
      <path 
        d="M60 35V65M45 50H75" 
        stroke="white" 
        strokeWidth="10" 
        strokeLinecap="round" 
      />
      
      {/* Eye in the center of the cross */}
      <circle cx="60" cy="50" r="5" fill="#0F172A" />
      
      {/* Pupil/Reflection */}
      <circle cx="61" cy="49" r="1.5" fill="white" opacity="0.8" />
    </svg>
  );
};

export default Logo;
