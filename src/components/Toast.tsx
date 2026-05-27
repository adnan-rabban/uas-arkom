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
      icon: <CheckCircle2 className="w-4 h-4 text-[#2ccb5d] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#2ccb5d]',
      title: 'Success',
      titleColor: 'text-[#2ccb5d]'
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
      borderLeft: 'border-l-4 border-l-red-500',
      title: 'Error',
      titleColor: 'text-red-500'
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
      borderLeft: 'border-l-4 border-l-amber-500',
      title: 'Warning',
      titleColor: 'text-amber-500'
    },
    info: {
      icon: <Info className="w-4 h-4 text-[#1c69d4] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#1c69d4]',
      title: 'Info',
      titleColor: 'text-[#1c69d4]'
    }
  }[type];

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 bg-black/90 border border-[#3c3c3c] ${config.borderLeft} p-3.5 shadow-2xl max-w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-300 font-mono select-none backdrop-blur-md`}
      role="alert"
    >
      {config.icon}
      
      <div className="flex-1 space-y-0.5 min-w-0">
        <div className={`text-[10px] font-bold uppercase tracking-wider ${config.titleColor}`}>
          {config.title}
        </div>
        <p className="text-[10.5px] text-white/80 leading-normal font-light wrap-break-word">
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
