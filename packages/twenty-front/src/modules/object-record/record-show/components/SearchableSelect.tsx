import { useEffect, useRef, useState } from 'react';

export interface SelectOption {
  id: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = '— seleccionar —',
  disabled = false,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      ref={containerRef}
      className={`mgc-ss-container${disabled ? ' mgc-ss-disabled' : ''}`}
      onClick={stop}
    >
      <button
        className="mgc-ss-trigger"
        disabled={disabled}
        onClick={(e) => { stop(e); setOpen((o) => !o); }}
        type="button"
      >
        <span className={selected ? 'mgc-ss-value' : 'mgc-ss-placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="mgc-ss-arrow">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mgc-ss-dropdown">
          <input
            ref={inputRef}
            className="mgc-ss-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={stop}
            onKeyDown={(e) => {
              stop(e);
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0].id);
            }}
            placeholder="Buscar..."
          />
          <div className="mgc-ss-list">
            {value && (
              <div
                className="mgc-ss-option mgc-ss-clear"
                onMouseDown={(e) => { stop(e); handleSelect(''); }}
              >
                — limpiar selección —
              </div>
            )}
            {filtered.length === 0 && (
              <div className="mgc-ss-empty">Sin resultados</div>
            )}
            {filtered.map((o) => (
              <div
                key={o.id}
                className={`mgc-ss-option${o.id === value ? ' mgc-ss-option-selected' : ''}`}
                onMouseDown={(e) => { stop(e); handleSelect(o.id); }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
