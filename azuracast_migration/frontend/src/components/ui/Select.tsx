import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  icon?: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ 
  label, 
  options, 
  error, 
  icon, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-100">
      {label && (
        <label className="form-label small fw-bold text-main text-uppercase ls-1 mb-2">
          {label}
        </label>
      )}
      <div className="position-relative">
        {icon && (
          <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
            {icon}
          </div>
        )}
        <select 
          className={`form-select bg-light-soft border-0 rounded-3 py-2 ${icon ? 'ps-5' : 'ps-3'} ${error ? 'is-invalid' : ''} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <div className="invalid-feedback small mt-1">{error}</div>}
      </div>
    </div>
  );
};

export default Select;
