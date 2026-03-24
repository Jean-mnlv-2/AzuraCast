import React from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  variant?: 'section' | 'flat' | 'default';
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  icon, 
  children, 
  footer, 
  className = '', 
  headerActions,
  variant = 'default',
  noPadding = false
}) => {
  const variantClass = variant === 'section' ? 'bw-section' : variant === 'flat' ? 'bw-card-flat p-4' : 'card shadow-sm mb-4';
  
  return (
    <div className={`${variantClass} ${className}`}>
      {(title || headerActions || icon) && (
        <div className={`d-flex justify-content-between align-items-center mb-4 ${variant === 'default' ? 'card-header' : ''}`}>
          <div className="d-flex align-items-center gap-3">
            {icon && <div className="text-primary d-flex align-items-center">{icon}</div>}
            {title && <h5 className="mb-0 fw-700 text-main">{title}</h5>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className={variant === 'default' ? 'card-body' : noPadding ? '' : 'mt-2'}>
        {children}
      </div>
      {footer && (
        <div className={`mt-4 ${variant === 'default' ? 'card-footer text-end' : 'text-end pt-3 border-top'}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
