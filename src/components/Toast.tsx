import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-[#32D74B] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#32D74B]',
      title: 'Success',
      titleColor: 'text-[#32D74B]'
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-[#FF453A] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#FF453A]',
      title: 'Error',
      titleColor: 'text-[#FF453A]'
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-[#FF9F0A] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#FF9F0A]',
      title: 'Warning',
      titleColor: 'text-[#FF9F0A]'
    },
    info: {
      icon: <Info className="w-4 h-4 text-[#0A84FF] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#0A84FF]',
      title: 'Info',
      titleColor: 'text-[#0A84FF]'
    }
  }[type];

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 glass-modal ${config.borderLeft} p-4 shadow-2xl max-w-85 animate-in slide-in-from-bottom-4 fade-in duration-300 select-none rounded-2xl`}
      role="alert"
    >
      {config.icon}
      
      <div className="flex-1 space-y-1 min-w-0">
        <div className={`text-[11px] font-semibold ${config.titleColor}`}>
          {config.title}
        </div>
        <p className="text-[11px] text-white/75 leading-relaxed font-normal wrap-break-word">
          {message}
        </p>
      </div>

      <button 
        onClick={onClose}
        className="text-white/30 hover:text-white transition-colors cursor-pointer shrink-0"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
