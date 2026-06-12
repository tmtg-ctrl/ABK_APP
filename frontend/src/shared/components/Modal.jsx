import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  title,
  description,
  eyebrow,
  children,
  onClose,
  className = '',
  size = 'medium'
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={`modal-panel modal-${size} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <div>
            {(eyebrow || className.includes('create-modal')) && (
              <span className="eyebrow">{eyebrow || 'Them moi'}</span>
            )}
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} title="Dong">
            <X size={19} />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}
