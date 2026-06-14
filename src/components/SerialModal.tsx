import { Cpu, Usb, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translations } from '@/lib/constants';
import type { Language } from '@/types';

interface SerialModalProps {
  isOpen: boolean;
  onClose: () => void;
  serialConnected: boolean;
  isVirtualSerial: boolean;
  onConnectSerial: (isVirtual?: boolean) => void;
  onDisconnectSerial: () => void;
  lang: Language;
}

export function SerialModal({
  isOpen,
  onClose,
  serialConnected,
  isVirtualSerial,
  onConnectSerial,
  onDisconnectSerial,
  lang,
}: SerialModalProps) {
  if (!isOpen) return null;

  const t = translations[lang];
  const isSerialSupported = typeof navigator !== 'undefined' && 'serial' in navigator;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-lg p-4 animate-in fade-in duration-200">
      <div 
        className="glass-modal w-full max-w-125 flex flex-col justify-between shadow-2xl relative select-none animate-in slide-in-from-bottom-4 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
          <span className="text-[15px] font-semibold text-slate-800 tracking-[-0.01em] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#D97706]" />
            {t.serialTitle}
          </span>
          <button 
            onClick={onClose}
            className="text-[#D97706] hover:text-[#B88020] transition-colors cursor-pointer font-semibold text-[14px]"
          >
            {lang === 'id' ? 'Tutup' : 'Done'}
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Status Display Area */}
          <div className="glass-card p-5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
            {serialConnected ? (
              <>
                <div className="relative flex items-center justify-center">
                  <div className={`absolute w-12 h-12 ${isVirtualSerial ? 'bg-[#D97706]/10' : 'bg-[#32D74B]/10'} rounded-full animate-ping`} />
                  <div className={`w-10 h-10 ${isVirtualSerial ? 'bg-[#D97706]/20 border border-[#D97706]/40 text-[#D97706]' : 'bg-[#32D74B]/20 border border-[#32D74B]/40 text-[#32D74B]'} rounded-full flex items-center justify-center`}>
                    <Check className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-slate-800 text-[13px] font-semibold">
                    {lang === 'id' ? 'Koneksi Aktif' : 'Connection Active'}
                  </h4>
                  <p className={`text-[11px] font-medium ${isVirtualSerial ? 'text-[#D97706]' : 'text-[#32D74B]'} mt-1`}>
                    {isVirtualSerial 
                      ? (lang === 'id' ? 'Terhubung ke Virtual COM Port (Emulator)' : 'Connected to Virtual COM Port (Emulator)')
                      : t.serialConnected}
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-black/6 pt-2 w-full">
                  <div>Mode: {isVirtualSerial ? 'Simulation Stream (Console)' : 'Physical USB Stream (Arduino)'}</div>
                  {!isVirtualSerial && <div>Baud Rate: 9600 bps</div>}
                </div>
              </>
            ) : (
              <>
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 bg-black/4 border border-black/8 rounded-full flex items-center justify-center text-slate-300">
                    <Usb className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-slate-800 text-[13px] font-semibold">
                    {lang === 'id' ? 'Koneksi Terputus' : 'Connection Inactive'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'id' 
                      ? 'Belum ada port serial yang terhubung.' 
                      : 'No serial port connected yet.'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Browser Support Warning */}
          {!serialConnected && !isSerialSupported && (
            <div className="w-full glass-card p-3.5 bg-[#FF453A]/5 border-[#FF453A]/10 text-[11px] text-left text-slate-500 space-y-1.5">
              <div className="font-semibold text-[#FF453A] flex items-center gap-1.5">
                ⚠️ BROWSER TIDAK MENDUKUNG WEB SERIAL API
              </div>
              <p className="leading-relaxed">
                {lang === 'id' 
                  ? 'Browser ini (Firefox/Safari) tidak mendukung komunikasi hardware serial secara langsung. Namun, Anda dapat menggunakan mode Emulator Serial (Virtual) di bawah ini untuk mensimulasikan aliran data koordinat ke konsol.'
                  : 'This browser (Firefox/Safari) does not support direct serial hardware connection. However, you can use the Virtual Serial Emulator below to simulate streaming coordinate data to the console.'}
              </p>
            </div>
          )}

          {/* Guide Steps */}
          <div className="space-y-2.5">
            <span className="ios-label">
              {lang === 'id' ? 'Panduan Koneksi' : 'Connection Guide'}
            </span>
            <div className="glass-card p-4 text-[11px] leading-relaxed text-slate-500 space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className="text-[#D97706] font-bold shrink-0">[1]</span>
                <p>{lang === 'id' ? 'Pilih jenis koneksi: Fisik (hanya Chrome/Edge) atau Virtual (Semua browser).' : 'Choose connection type: Physical (Chrome/Edge only) or Virtual (All browsers).'}</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-[#D97706] font-bold shrink-0">[2]</span>
                <p>{lang === 'id' ? 'Untuk koneksi Fisik, unggah sketch live receiver ke Arduino Anda sebelum menghubungkan.' : 'For Physical connection, upload the live receiver sketch to your Arduino before connecting.'}</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-[#D97706] font-bold shrink-0">[3]</span>
                <p>{lang === 'id' ? 'Gunakan tombol di bawah untuk memulai sesi komunikasi data rute robot.' : 'Use the actions below to start the robot route data communication session.'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            {serialConnected ? (
              <Button
                onClick={() => {
                  onDisconnectSerial();
                  onClose();
                }}
                className="w-full ios-btn ios-btn-danger rounded-full h-10 text-[12px] font-semibold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2 animate-spin-slow" />
                {lang === 'id' ? 'Putuskan Koneksi' : 'Disconnect Serial'}
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                {isSerialSupported && (
                  <Button
                    onClick={async () => {
                      onConnectSerial(false);
                      onClose();
                    }}
                    className="w-full ios-btn ios-btn-primary rounded-full h-10 text-[12px] font-semibold cursor-pointer"
                  >
                    <Usb className="w-4 h-4 mr-2" />
                    {lang === 'id' ? 'Hubungkan Serial (Arduino USB)' : 'Connect Physical Serial (USB)'}
                  </Button>
                )}
                <Button
                  onClick={async () => {
                    onConnectSerial(true);
                    onClose();
                  }}
                  className="w-full ios-btn ios-btn-secondary rounded-full h-10 text-[12px] font-semibold cursor-pointer"
                >
                  <Cpu className="w-4 h-4 mr-2" />
                  {lang === 'id' ? 'Aktifkan Emulator Serial (Virtual)' : 'Activate Virtual Emulator'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
