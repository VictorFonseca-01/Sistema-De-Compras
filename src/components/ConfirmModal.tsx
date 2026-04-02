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
      iconBg: 'bg-gp-error/10',
      iconText: 'text-gp-error',
      button: 'btn-premium-danger',
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-gp-warning/10',
      iconText: 'text-gp-warning',
      button: 'btn-premium-primary bg-gp-warning hover:bg-amber-600 shadow-gp-warning/20',
    },
    info: {
      icon: Info,
      iconBg: 'bg-gp-blue-muted',
      iconText: 'text-gp-blue',
      button: 'btn-premium-primary',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-gp-success/10',
      iconText: 'text-gp-success',
      button: 'btn-premium-primary bg-gp-success hover:bg-emerald-600 shadow-gp-success/20',
    }
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="gp-modal-overlay">
      {/* Backdrop — handled by overlay class usually, but adding click here */}
      <div 
        className="absolute inset-0 z-[-1]"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="gp-modal max-w-md animate-fade-up">
        <div className="p-8 sm:p-10 relative">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 text-gp-text3 hover:text-gp-text transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon Badge */}
            <div className={clsx("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner", style.iconBg, style.iconText)}>
              <Icon size={32} strokeWidth={2.5} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gp-text tracking-tight">
                {title}
              </h3>
              <p className="text-[14px] text-gp-text3 font-medium leading-relaxed">
                {message}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="btn-premium-secondary flex-1 py-3.5 rounded-xl text-[12px] order-2 sm:order-1"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={clsx(
                  "flex-1 py-3.5 rounded-xl text-[12px] order-1 sm:order-2",
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
    </div>
  );
}
