import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose}></div>
      <div className={`modal fade show d-block`} tabIndex={-1} role="dialog">
        <div className={`modal-dialog modal-dialog-centered modal-${size}`} role="document">
          <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
            <div className="modal-header border-bottom-0 d-flex justify-content-between align-items-center p-4">
              <h5 className="modal-title fw-bold">{title}</h5>
              <button 
                type="button" 
                className="btn-close shadow-none" 
                aria-label="Close" 
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body p-4">
              {children}
            </div>
            {footer && (
              <div className="modal-footer border-top-0 p-4">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
