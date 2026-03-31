import React from 'react';
import { countries } from '../../utils/countries';
import CountryFlag from './CountryFlag';

interface CountrySelectProps {
  label?: string;
  value: string;
  onChange: (countryName: string) => void;
  error?: string;
  className?: string;
  required?: boolean;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ 
  label, 
  value, 
  onChange, 
  error, 
  className = '',
  required = false
}) => {
  const selectedCountry = countries.find(c => c.name === value);

  return (
    <div className={`w-100 ${className}`}>
      {label && (
        <label className="form-label small fw-700 text-main text-uppercase ls-1 mb-2">
          {label}
        </label>
      )}
      <div className="position-relative">
        <div className="position-absolute top-50 start-0 translate-middle-y ps-3 d-flex align-items-center z-index-1">
          {selectedCountry && (
            <CountryFlag iso={selectedCountry.iso} name={selectedCountry.name} size="sm" />
          )}
        </div>
        <select 
          className={`form-select bg-surface border-0 rounded-3 py-2 ps-5 text-main ${error ? 'is-invalid' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          {countries.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {error && <div className="invalid-feedback small mt-1">{error}</div>}
      </div>
    </div>
  );
};

export default CountrySelect;
