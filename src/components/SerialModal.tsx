import { Cpu, Usb, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { translations } from '@/lib/constants';
import type { Language } from '@/types';

interface SerialModalProps {
  isOpen: boolean;
  onClose: () => void;
  serialConnected: boolean;
  onConnectSerial: () => void;
  onDisconnectSerial: () => void;
  lang: Language;
}

export function SerialModal({
  isOpen,
  onClose,
  serialConnected,
  onConnectSerial,
  onDisconnectSerial,
  lang,
}: SerialModalProps) {
  if (!isOpen) return null;

  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div 
        className="bg-[#0d0d0d] border border-[#3c3c3c] w-full max-w-[500px] flex flex-col justify-between shadow-2xl relative select-none font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3c3c3c] px-4 py-3 bg-black">
          <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-[#1c69d4] flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" />
            {t.serialTitle}
          </span>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer font-mono text-xs uppercase tracking-wider font-bold"
          >
            [ {lang === 'id' ? 'Tutup' : 'Close'} ]
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Status Display Area */}
          <div className="bg-black border border-[#222222] p-4 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
            {serialConnected ? (
              <>
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-[#2ccb5d]/10 rounded-full animate-ping" />
                  <div className="w-10 h-10 bg-[#2ccb5d]/20 border border-[#2ccb5d] rounded-full flex items-center justify-center text-[#2ccb5d]">
                    <Check className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-white text-[12px] font-bold uppercase tracking-wider">
                    {lang === 'id' ? 'Koneksi Aktif' : 'Connection Active'}
                  </h4>
                  <p className="text-[10px] text-[#2ccb5d] mt-1">
                    {t.serialConnected}
                  </p>
                </div>
                <div className="text-[9px] text-white/40 space-y-0.5 border-t border-white/5 pt-2 w-full">
                  <div>Baud Rate: 9600 bps</div>
                  <div>Mode: Live Real-time Stream</div>
                </div>
              </>
            ) : (
              <>
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/5 border border-[#3c3c3c] rounded-full flex items-center justify-center text-white/40">
                    <Usb className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-white text-[12px] font-bold uppercase tracking-wider">
                    {lang === 'id' ? 'Koneksi Terputus' : 'Connection Inactive'}
                  </h4>
                  <p className="text-[10px] text-white/30 mt-1">
                    {lang === 'id' 
                      ? 'Belum ada port serial yang terhubung.' 
                      : 'No serial port connected yet.'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Guide Steps */}
          <div className="space-y-2">
            <span className="text-[9.5px] font-bold tracking-wider uppercase text-[#1c69d4]">
              {lang === 'id' ? 'PANDUAN KONEKSI' : 'CONNECTION GUIDE'}
            </span>
            <div className="bg-black border border-[#222222] p-3 text-[10px] leading-relaxed text-white/60 space-y-2">
              <div className="flex gap-2.5 items-start">
                <span className="text-[#1c69d4] font-bold">[1]</span>
                <p>{lang === 'id' ? 'Hubungkan Arduino Anda ke komputer menggunakan kabel USB.' : 'Connect your Arduino to the computer via USB cable.'}</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-[#1c69d4] font-bold">[2]</span>
                <p>{lang === 'id' ? 'Pastikan sudah mengunggah sketch live receiver ke Arduino.' : 'Ensure you have uploaded the live receiver sketch to your Arduino.'}</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-[#1c69d4] font-bold">[3]</span>
                <p>{lang === 'id' ? 'Baud rate default untuk komunikasi ini adalah 9600 bps.' : 'The default baud rate for communication is 9600 bps.'}</p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="text-[#1c69d4] font-bold">[4]</span>
                <p>{lang === 'id' ? 'Klik tombol di bawah ini lalu pilih port COM Arduino yang muncul pada dialog browser.' : 'Click the button below and select the Arduino COM port in the browser dialog.'}</p>
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
                className="w-full bg-red-950/40 text-red-500 border border-red-900/50 hover:bg-red-900/40 hover:text-red-400 font-bold uppercase tracking-wider rounded-none text-[10px] h-9 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin-slow" />
                {lang === 'id' ? 'PUTUSKAN KONEKSI' : 'DISCONNECT SERIAL'}
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  onConnectSerial();
                  onClose();
                }}
                className="w-full bg-white text-black border border-white hover:bg-transparent hover:text-white font-bold uppercase tracking-wider rounded-none text-[10px] h-9 cursor-pointer"
              >
                <Usb className="w-3.5 h-3.5 mr-2" />
                {lang === 'id' ? 'MULAI PEMILIHAN PORT' : 'START PORT SELECTION'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
