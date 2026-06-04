export function NavButton({ icon: Icon, active, children, onClick, collapsed = false }) {
  return (
    <button className={`nav-button ${active ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`} onClick={onClick} title={typeof children === 'string' ? children : undefined}>
      <Icon size={18} />
      <span className="nav-label">{children}</span>
    </button>
  );
}
