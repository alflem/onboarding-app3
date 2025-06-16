import React from 'react';

interface FlagProps {
  className?: string;
}

export function SwedishFlag({ className = "w-6 h-4" }: FlagProps) {
  return (
    <svg viewBox="0 0 16 10" className={className}>
      <rect width="16" height="10" fill="#006AA7" />
      <rect x="0" y="4" width="16" height="2" fill="#FECC00" />
      <rect x="5" y="0" width="2" height="10" fill="#FECC00" />
    </svg>
  );
}

export function NorwegianFlag({ className = "w-6 h-4" }: FlagProps) {
  return (
    <svg viewBox="0 0 22 16" className={className}>
      <rect width="22" height="16" fill="#EF2B2D" />
      <rect x="0" y="6" width="22" height="4" fill="#FFFFFF" />
      <rect x="6" y="0" width="4" height="16" fill="#FFFFFF" />
      <rect x="0" y="7" width="22" height="2" fill="#002868" />
      <rect x="7" y="0" width="2" height="16" fill="#002868" />
    </svg>
  );
}

export function AmericanFlag({ className = "w-6 h-4" }: FlagProps) {
  return (
    <svg viewBox="0 0 19 10" className={className}>
      <rect width="19" height="10" fill="#B22234" />
      <rect x="0" y="0" width="19" height="0.77" fill="#FFFFFF" />
      <rect x="0" y="1.54" width="19" height="0.77" fill="#FFFFFF" />
      <rect x="0" y="3.08" width="19" height="0.77" fill="#FFFFFF" />
      <rect x="0" y="4.62" width="19" height="0.77" fill="#FFFFFF" />
      <rect x="0" y="6.15" width="19" height="0.77" fill="#FFFFFF" />
      <rect x="0" y="7.69" width="19" height="0.77" fill="#FFFFFF" />
      <rect x="0" y="9.23" width="19" height="0.77" fill="#FFFFFF" />
      <rect x="0" y="0" width="7.6" height="5.38" fill="#3C3B6E" />
    </svg>
  );
}