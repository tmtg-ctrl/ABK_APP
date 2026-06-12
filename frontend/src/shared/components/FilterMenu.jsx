import { Check, Filter, RotateCcw, X } from 'lucide-react';

export function FilterMenu({
  open,
  title = 'Bo loc',
  activeCount = 0,
  onOpen,
  onClose,
  onApply,
  onReset,
  children
}) {
  return (
    <div className="filter-menu">
      <button type="button" className={`filter-trigger ${activeCount ? 'active' : ''}`} onClick={onOpen}>
        <Filter size={15} />
        Bo loc
        {!!activeCount && <b>{activeCount}</b>}
      </button>

      {open && (
        <>
          <button className="filter-menu-scrim" type="button" aria-label="Dong bo loc" onClick={onClose} />
          <section className="filter-menu-panel" aria-label={title}>
            <header>
              <div>
                <span className="eyebrow">Loc danh sach</span>
                <h4>{title}</h4>
              </div>
              <button type="button" className="icon-button" onClick={onClose} title="Dong">
                <X size={17} />
              </button>
            </header>
            <div className="filter-menu-content">{children}</div>
            <footer>
              <button type="button" className="text-action filter-reset" onClick={onReset}>
                <RotateCcw size={14} />
                Xoa loc
              </button>
              <button type="button" className="primary-action small" onClick={onApply}>
                <Check size={15} />
                Ap dung
              </button>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}
