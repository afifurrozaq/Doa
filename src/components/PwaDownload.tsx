import React from 'react';
import { Download, Smartphone, Monitor, Info, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PwaDownloadProps {
  darkMode: boolean;
  deferredPrompt: any;
  onInstall: () => void;
}

const PwaDownload: React.FC<PwaDownloadProps> = ({ darkMode, deferredPrompt, onInstall }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  if (isStandalone) {
    return (
      <div className={cn(
        "p-6 rounded-3xl border text-center",
        darkMode ? "bg-emerald-900/10 border-emerald-900/20" : "bg-emerald-50/50 border-emerald-100/50"
      )}>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
          darkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"
        )}>
          <Smartphone size={24} />
        </div>
        <h3 className={cn(
          "font-bold mb-1",
          darkMode ? "text-gray-100" : "text-emerald-900"
        )}>Aplikasi Terinstal</h3>
        <p className={cn(
          "text-xs",
          darkMode ? "text-emerald-700" : "text-emerald-500"
        )}>Anda sedang menggunakan versi aplikasi terinstal.</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 rounded-3xl border shadow-sm space-y-6",
      darkMode ? "bg-[#2d3748] border-gray-700" : "bg-white border-emerald-50"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
          darkMode ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"
        )}>
          <Download size={24} />
        </div>
        <div>
          <h3 className={cn(
            "font-bold",
            darkMode ? "text-gray-100" : "text-emerald-900"
          )}>Download App</h3>
          <p className={cn(
            "text-xs",
            darkMode ? "text-emerald-700" : "text-emerald-500"
          )}>Instal aplikasi untuk akses lebih cepat & offline</p>
        </div>
      </div>

      <div className="space-y-3">
        {deferredPrompt ? (
          <button 
            onClick={onInstall}
            className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Download size={20} />
            Instal Sekarang
          </button>
        ) : (
          <div className={cn(
            "p-4 rounded-2xl border border-dashed",
            darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-start gap-3">
              <Info size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className={cn(
                  "text-[11px] font-bold uppercase tracking-widest opacity-60",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>Cara Instal Manual</p>
                
                {isIOS ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">1. Klik ikon <span className="font-bold">Share</span> di browser</p>
                    <p className="text-xs font-medium">2. Pilih <span className="font-bold">Add to Home Screen</span></p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">1. Klik ikon <span className="font-bold">Tiga Titik</span> di browser</p>
                    <p className="text-xs font-medium">2. Pilih <span className="font-bold">Instal Aplikasi</span> atau <span className="font-bold">Tambahkan ke Layar Utama</span></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={cn(
          "p-3 rounded-2xl border flex flex-col items-center gap-2",
          darkMode ? "bg-gray-800/30 border-gray-700" : "bg-gray-50/50 border-gray-100"
        )}>
          <Smartphone size={16} className="text-emerald-500" />
          <span className="text-[10px] font-bold opacity-60">Mobile Ready</span>
        </div>
        <div className={cn(
          "p-3 rounded-2xl border flex flex-col items-center gap-2",
          darkMode ? "bg-gray-800/30 border-gray-700" : "bg-gray-50/50 border-gray-100"
        )}>
          <Monitor size={16} className="text-emerald-500" />
          <span className="text-[10px] font-bold opacity-60">Desktop App</span>
        </div>
      </div>
    </div>
  );
};

export default PwaDownload;
