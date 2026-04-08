import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { clsx } from 'clsx';

export interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  className,
  disabled,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
      case 'Tab':
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          e.preventDefault();
          onChange(filteredOptions[focusedIndex].value);
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  return (
    <div className={clsx('relative w-full', className)} ref={wrapperRef} onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="select-dropdown"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (disabled) return;
          const newOpen = !isOpen;
          setIsOpen(newOpen);
          if (newOpen) {
            setSearchTerm('');
            setFocusedIndex(-1);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={clsx(
          'w-full px-4 py-2.5 rounded-[10px] flex justify-between items-center transition-all outline-none text-[14px]',
          'bg-gp-surface2 border-[1.5px] border-gp-border',
          isOpen ? 'border-gp-blue ring-4 ring-gp-focus-ring bg-gp-surface shadow-lg' : 'hover:border-gp-border2',
          value ? 'text-gp-text font-medium' : 'text-gp-text3',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99] transform'
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.5}
          className={clsx('flex-shrink-0 ml-2 transition-transform duration-300 text-gp-text3', isOpen && 'rotate-180 text-gp-blue')}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="select-dropdown"
          role="listbox"
          className={clsx(
            'absolute z-[1000] w-full mt-2 rounded-xl overflow-hidden animate-fade-up',
            'bg-gp-surface border-[1.5px] border-gp-border shadow-3xl'
          )}
        >
          {/* Search */}
          <div className="p-2 border-b border-gp-border bg-gp-surface2">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gp-text3 group-focus-within:text-gp-blue transition-colors" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setFocusedIndex(0); }}
                placeholder="Pesquisar..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none transition-all border border-gp-border text-gp-text focus:border-gp-blue focus:bg-gp-surface"
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-52 p-1 no-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isFocused = focusedIndex === idx;
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    onClick={(e) => { 
                      e.stopPropagation();
                      onChange(option.value); 
                      setIsOpen(false); 
                      setSearchTerm(''); 
                    }}
                    className={clsx(
                      'px-3 py-2.5 rounded-lg cursor-pointer text-[13px] transition-all flex items-center justify-between',
                      isSelected ? 'bg-gp-blue/10 text-gp-blue font-bold shadow-inner' : 
                      isFocused ? 'bg-gp-hover text-gp-text' : 'text-gp-text2 hover:bg-gp-hover'
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-gp-blue shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-[12px] text-gp-text3 italic opacity-60">
                Nenhuma opção encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
