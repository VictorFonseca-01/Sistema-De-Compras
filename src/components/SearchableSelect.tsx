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
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
          if (!isOpen) {
            setSearchTerm('');
            setFocusedIndex(-1);
            setTimeout(() => inputRef.current?.focus(), 10);
          }
        }}
        className={clsx(
          'w-full px-4 py-2.5 rounded-[10px] flex justify-between items-center transition-all outline-none text-[14px]',
          'bg-gp-surface2 border-[1.5px] border-gp-border',
          isOpen ? 'border-gp-blue ring-3 ring-gp-focus-ring bg-gp-surface' : 'hover:border-gp-border2',
          value ? 'text-gp-text' : 'text-gp-text3',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={clsx('flex-shrink-0 ml-2 transition-transform duration-200 text-gp-text3', isOpen && 'rotate-180 text-gp-blue')}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 w-full mt-1.5 rounded-xl overflow-hidden animate-fade-up',
            'bg-gp-surface border-[1.5px] border-gp-border shadow-gp-shadow-lg'
          )}
        >
          {/* Search */}
          <div className="p-2 border-b border-gp-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gp-text3" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setFocusedIndex(0); }}
                placeholder="Pesquisar..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none transition-all bg-gp-surface2 border border-gp-border text-gp-text focus:border-gp-blue"
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-52 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isFocused = focusedIndex === idx;
                return (
                  <div
                    key={option.value}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    onClick={() => { onChange(option.value); setIsOpen(false); setSearchTerm(''); }}
                    className={clsx(
                      'px-3 py-2.5 rounded-lg cursor-pointer text-[13px] transition-all',
                      isSelected ? 'bg-gp-selected text-gp-blue-light font-bold' : 
                      isFocused ? 'bg-gp-hover text-gp-text' : 'text-gp-text2 hover:bg-gp-hover'
                    )}
                  >
                    {option.label}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-center text-[13px] text-gp-text3">
                Nenhuma opção encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
