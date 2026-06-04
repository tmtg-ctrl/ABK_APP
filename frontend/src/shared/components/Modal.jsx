export function Modal({ title, children, onClose, className = '' }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className={`modal-panel ${className}`}>
        <div className="section-heading">
          <h3>{title}</h3>
          <button className="text-action" onClick={onClose}>Close</button>
        </div>
        {children}
      </section>
    </div>
  );
}
