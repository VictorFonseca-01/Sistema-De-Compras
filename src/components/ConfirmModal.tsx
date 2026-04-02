import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  AlertCircle 
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false
}: ConfirmModalProps) {
  
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      iconText: 'text-rose-600',
      button: 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20',
      accent: 'border-rose-100 dark:border-rose-900/30'
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconText: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20',
      accent: 'border-amber-100 dark:border-amber-900/30'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconText: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
      accent: 'border-blue-100 dark:border-blue-900/30'
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconText: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20',
      accent: 'border-emerald-100 dark:border-emerald-900/30'
    }
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-10 animate-in zoom-in slide-in-from-bottom-4 duration-300 scale-in-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-8 top-8 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon Badge */}
          <div className={clsx("w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-inner", style.iconBg, style.iconText)}>
            <Icon size={40} strokeWidth={2.5} />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 order-2 sm:order-1 px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={clsx(
                "flex-1 order-1 sm:order-2 px-8 py-4 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                style.button
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
