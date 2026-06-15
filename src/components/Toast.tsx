import { useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, type]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#D97706]',
      title: 'Success',
      titleColor: 'text-[#D97706]'
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-[#BE123C] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#BE123C]',
      title: 'Error',
      titleColor: 'text-[#BE123C]'
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#D97706]',
      title: 'Warning',
      titleColor: 'text-[#D97706]'
    },
    info: {
      icon: <Info className="w-4 h-4 text-[#D97706] shrink-0" />,
      borderLeft: 'border-l-4 border-l-[#D97706]',
      title: 'Info',
      titleColor: 'text-[#D97706]'
    }
  }[type];

  return (
    <div 
      className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 glass-modal ${config.borderLeft} p-4 shadow-2xl max-w-85 animate-in slide-in-from-bottom-4 fade-in duration-300 select-none rounded-2xl`}
      role="alert"
    >
      {config.icon}
      
      <div className="flex-1 space-y-1 min-w-0">
        <div className={`text-[11px] font-semibold ${config.titleColor} tracking-[-0.01em]`}>
          {config.title}
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed font-normal wrap-break-word">
          {message}
        </p>
      </div>

      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
