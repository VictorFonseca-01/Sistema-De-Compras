import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface Option {
  value: string;
  label: string;
}

interface MultiSearchableSelectProps {
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSearchableSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Selecionar unidades...',
  className,
  disabled,
}: MultiSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const toggleAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const getLabel = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return options.find(o => o.value === value[0])?.label;
    if (value.length === options.length) return 'Todas as Empresas';
    return `${value.length} Unidades Selecionadas`;
  };

  return (
    <div className={clsx('relative w-full', className, isOpen && 'z-[1001]')} ref={wrapperRef}>
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (disabled) return;
          const newOpen = !isOpen;
          setIsOpen(newOpen);
          if (newOpen) {
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={clsx(
          'w-full px-4 py-2.5 rounded-[10px] flex justify-between items-center transition-all outline-none text-[14px]',
          'bg-gp-surface2 border-[1.5px] border-gp-border',
          isOpen ? 'border-gp-blue ring-4 ring-gp-focus-ring bg-gp-surface shadow-lg' : 'hover:border-gp-border2',
          value.length > 0 ? 'text-gp-text font-bold' : 'text-gp-text3',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <span className="truncate flex items-center gap-2">
            {value.length > 0 && <span className="flex items-center justify-center w-5 h-5 rounded-md bg-gp-blue text-white text-[10px]">{value.length}</span>}
            {getLabel()}
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
            'absolute z-[1001] w-full mt-2 rounded-xl overflow-hidden animate-fade-up',
            'bg-gp-navy2 border-[1.5px] border-gp-border shadow-3xl'
          )}
        >
          {/* Search & Actions */}
          <div className="p-2 border-b border-gp-border bg-gp-surface2 space-y-2">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gp-text3 group-focus-within:text-gp-blue transition-colors" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Pesquisar empresas..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none transition-all border border-gp-border text-gp-text focus:border-gp-blue focus:bg-gp-surface"
              />
            </div>
            
            <div className="flex items-center justify-between px-1">
               <button 
                type="button"
                onClick={toggleAll}
                className="text-[10px] font-black text-gp-blue hover:text-gp-blue-light uppercase tracking-widest transition-colors"
               >
                 {value.length === options.length ? 'Desmarcar Tudo' : 'Marcar Toda a Rede'}
               </button>
               {value.length > 0 && (
                 <button 
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[10px] font-black text-gp-error hover:text-red-400 uppercase tracking-widest transition-colors"
                 >
                   Limpar
                 </button>
               )}
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-52 p-1 no-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => { 
                      e.stopPropagation();
                      toggleOption(option.value); 
                    }}
                    className={clsx(
                      'px-3 py-2.5 rounded-lg cursor-pointer text-[13px] transition-all flex items-center gap-3',
                      isSelected ? 'bg-gp-blue/5 text-gp-blue font-bold' : 'text-gp-text2 hover:bg-gp-hover'
                    )}
                  >
                    <div className={clsx(
                        'w-4 h-4 rounded border transition-all flex items-center justify-center',
                        isSelected ? 'bg-gp-blue border-gp-blue shadow-sm' : 'border-gp-border2 bg-gp-surface'
                    )}>
                        {isSelected && <Check size={10} strokeWidth={4} className="text-white" />}
                    </div>
                    <span className="truncate">{option.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-[12px] text-gp-text3 italic opacity-60">
                Unidade não encontrada
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2 bg-gp-surface2 border-t border-gp-border">
             <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-gp-blue text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg shadow-gp-blue/20 hover:bg-gp-blue-light transition-colors"
             >
                Aplicar Seleção
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
