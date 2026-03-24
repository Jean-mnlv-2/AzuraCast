import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, helperText, icon, rightElement, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-2">{label}</label>
      )}
      <div className={`position-relative ${error ? 'is-invalid' : ''}`}>
        {icon && (
          <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted opacity-50 d-flex align-items-center">
            {icon}
          </div>
        )}
        <input 
          className={`form-control ${error ? 'is-invalid' : ''} ${icon ? 'ps-5' : ''} ${rightElement ? 'pe-5' : ''} ${className}`} 
          {...props} 
        />
        {rightElement && (
          <div className="position-absolute top-50 end-0 translate-middle-y pe-3 d-flex align-items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <div className="invalid-feedback d-block mt-2 small fw-600">{error}</div>}
      {helperText && <div className="form-text mt-2 small text-muted-soft">{helperText}</div>}
    </div>
  );
};

export default Input;
