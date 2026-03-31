import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, error, helperText, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="form-label fw-700 text-main small text-uppercase ls-1 mb-2">{label}</label>
      )}
      <div className={`position-relative ${error ? 'is-invalid' : ''}`}>
        <textarea 
          className={`form-control ${error ? 'is-invalid' : ''} ${className}`} 
          rows={4}
          {...props} 
        />
      </div>
      {error && <div className="invalid-feedback d-block mt-2 small fw-600">{error}</div>}
      {helperText && <div className="form-text mt-2 small text-muted-soft">{helperText}</div>}
    </div>
  );
};

export default Textarea;
