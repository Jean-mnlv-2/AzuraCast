import React from 'react';

interface CountryFlagProps {
  iso: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CountryFlag: React.FC<CountryFlagProps> = ({ iso, name, size = 'md', className = '' }) => {
  if (!iso) return null;

  const dimensions = {
    sm: { width: 16, height: 12 },
    md: { width: 24, height: 18 },
    lg: { width: 32, height: 24 },
  };

  const { width, height } = dimensions[size];
  const isoLower = iso.toLowerCase();

  return (
    <img
      src={`https://flagcdn.com/w40/${isoLower}.png`}
      srcSet={`https://flagcdn.com/w80/${isoLower}.png 2x`}
      width={width}
      height={height}
      alt={name || iso}
      className={`rounded-1 shadow-sm ${className}`}
      style={{ objectFit: 'cover' }}
      onError={(e) => {
        // Fallback if image fails to load
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

export default CountryFlag;
