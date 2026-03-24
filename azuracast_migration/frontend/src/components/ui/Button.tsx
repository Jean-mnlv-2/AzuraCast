import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary' | 'outline-danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  as?: any;
  to?: string;
  href?: string;
  target?: string;
  pill?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon, 
  className = '', 
  disabled,
  as: Component = 'button',
  to,
  href,
  pill = false,
  ...props 
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = variant === 'link' ? 'btn-link text-decoration-none' : `btn-${variant}`;
  const pillClass = pill ? 'btn-pill' : '';
  
  return (
    <Component 
      className={`btn ${variantClass} ${sizeClass} ${pillClass} d-inline-flex align-items-center justify-content-center gap-2 transition-all ${className}`}
      disabled={disabled || loading}
      to={to}
      href={href}
      {...props}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      ) : icon ? (
        <span className="d-flex">{icon}</span>
      ) : null}
      {children}
    </Component>
  );
};

export default Button;
