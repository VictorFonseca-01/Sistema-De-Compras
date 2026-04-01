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

export function SearchableSelect({ options, value, onChange, placeholder = "Selecione...", className, disabled }: SearchableSelectProps) {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <div 
      className={clsx("relative w-full", className)} 
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
    >
      <div 
        tabIndex={disabled ? -1 : 0}
        className={clsx(
          "w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl flex justify-between items-center transition-all focus:outline-none focus:ring-2 focus:ring-primary-500",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
        onClick={() => { 
          if (disabled) return;
          setIsOpen(!isOpen); 
          if (!isOpen) {
            setSearchTerm('');
            setFocusedIndex(-1);
            setTimeout(() => inputRef.current?.focus(), 10);
          }
        }}
      >
        <span className={clsx("truncate", value ? "text-slate-900 dark:text-slate-100 font-medium" : "text-slate-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className="text-slate-500 shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 text-sm rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFocusedIndex(0);
                }}
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1 py-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <div
                  key={option.value}
                  className={clsx(
                    "px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors",
                    (focusedIndex === idx || option.value === value) 
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-center text-slate-500">Nenhuma opção encontrada</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
