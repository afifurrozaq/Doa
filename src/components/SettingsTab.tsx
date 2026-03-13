import React from 'react';
import { Settings, Moon, Bell, BellOff, History, Trash2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import PwaDownload from './PwaDownload';
import { Doa, QuranBookmark } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Bookmark } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsTabProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  history: string[];
  onClearHistory: () => void;
  doaData: Doa[];
  onSelectDoa: (doa: Doa) => void;
  deferredPrompt: any;
  onInstall: () => void;
  quranBookmarks: QuranBookmark[];
  onNavigateToAyat: (surahNomor: number, ayatNomor: number) => void;
  onRemoveQuranBookmark: (surahNomor: number, ayatNomor: number) => void;
  onTestAdhan: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  darkMode, setDarkMode, notificationsEnabled, onToggleNotifications,
  history, onClearHistory, doaData, onSelectDoa, deferredPrompt, onInstall,
  quranBookmarks, onNavigateToAyat, onRemoveQuranBookmark, onTestAdhan
}) => {
  return (
    <div className="flex-1 flex flex-col p-6 pt-12 overflow-y-auto pb-32 no-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={cn(
            "text-3xl font-bold tracking-tight",
            darkMode ? "text-emerald-400" : "text-emerald-900"
          )}>Pengaturan</h1>
          <p className={cn(
            "text-sm font-medium",
            darkMode ? "text-emerald-400/70" : "text-emerald-600/70"
          )}>Kustomisasi aplikasi Anda</p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border",
          darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/50" : "bg-emerald-100 text-emerald-700 border-emerald-200/50"
        )}>
          <Settings size={24} />
        </div>
      </div>

      <div className="space-y-4">
        <div className={cn(
          "p-5 rounded-3xl border shadow-sm space-y-4",
          darkMode ? "bg-[#2d3748] border-gray-700" : "bg-white border-emerald-50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl",
                darkMode ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"
              )}>
                <Moon size={20} />
              </div>
              <span className={cn(
                "font-bold",
                darkMode ? "text-gray-100" : "text-emerald-900"
              )}>Mode Gelap</span>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={cn(
                "w-12 h-6 rounded-full relative p-1 transition-colors duration-200",
                darkMode ? "bg-emerald-600" : "bg-emerald-100"
              )}
            >
              <motion.div 
                animate={{ x: darkMode ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </button>
          </div>
          <div className="h-px bg-emerald-50 opacity-10" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl",
                darkMode ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"
              )}>
                {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              </div>
              <span className={cn(
                "font-bold",
                darkMode ? "text-gray-100" : "text-emerald-900"
              )}>Notifikasi Solat</span>
            </div>
            <button 
              onClick={onToggleNotifications}
              className={cn(
                "w-12 h-6 rounded-full relative p-1 transition-colors duration-200",
                notificationsEnabled ? "bg-emerald-600" : "bg-emerald-100"
              )}
            >
              <motion.div 
                animate={{ x: notificationsEnabled ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </button>
          </div>
          {notificationsEnabled && (
            <div className="flex justify-end pt-2">
              <button 
                onClick={onTestAdhan}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all",
                  darkMode ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                )}
              >
                Tes Suara Adzan
              </button>
            </div>
          )}
        </div>

        {/* Quran Bookmarks Section */}
        <div className={cn(
          "p-5 rounded-3xl border shadow-sm",
          darkMode ? "bg-[#2d3748] border-gray-700" : "bg-white border-emerald-50"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "p-2 rounded-xl",
              darkMode ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"
            )}>
              <Bookmark size={20} />
            </div>
            <span className={cn(
              "font-bold",
              darkMode ? "text-gray-100" : "text-emerald-900"
            )}>Bookmark Quran</span>
          </div>
          
          <div className="space-y-2">
            {quranBookmarks.length > 0 ? (
              quranBookmarks.map((bookmark, idx) => (
                <div
                  key={`${bookmark.surahNomor}-${bookmark.ayatNomor}-${idx}`}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl transition-colors group",
                    darkMode ? "hover:bg-emerald-900/20" : "hover:bg-emerald-50"
                  )}
                >
                  <button
                    onClick={() => onNavigateToAyat(bookmark.surahNomor, bookmark.ayatNomor)}
                    className="flex-1 text-left"
                  >
                    <p className={cn(
                      "text-sm font-bold",
                      darkMode ? "text-emerald-300" : "text-emerald-800"
                    )}>
                      {bookmark.surahNama}
                    </p>
                    <p className={cn(
                      "text-[10px] font-medium",
                      darkMode ? "text-emerald-500/60" : "text-emerald-600/60"
                    )}>
                      Ayat {bookmark.ayatNomor} • {new Date(bookmark.timestamp).toLocaleDateString('id-ID')}
                    </p>
                  </button>
                  <button 
                    onClick={() => onRemoveQuranBookmark(bookmark.surahNomor, bookmark.ayatNomor)}
                    className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className={cn(
                  "text-xs font-medium italic",
                  darkMode ? "text-emerald-800" : "text-emerald-400"
                )}>Belum ada bookmark Quran</p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className={cn(
          "p-5 rounded-3xl border shadow-sm",
          darkMode ? "bg-[#2d3748] border-gray-700" : "bg-white border-emerald-50"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl",
                darkMode ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"
              )}>
                <History size={20} />
              </div>
              <span className={cn(
                "font-bold",
                darkMode ? "text-gray-100" : "text-emerald-900"
              )}>Riwayat Terakhir</span>
            </div>
            {history.length > 0 && (
              <button 
                onClick={onClearHistory}
                className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map(id => {
                const doa = doaData.find(d => d.id === id);
                if (!doa) return null;
                return (
                  <button
                    key={id}
                    onClick={() => onSelectDoa(doa)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl transition-colors group text-left",
                      darkMode ? "hover:bg-emerald-900/20" : "hover:bg-emerald-50"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium truncate pr-4",
                      darkMode ? "text-emerald-300 group-hover:text-emerald-200" : "text-emerald-800 group-hover:text-emerald-900"
                    )}>
                      {doa.title}
                    </span>
                    <ChevronRight size={16} className={cn(
                      "shrink-0",
                      darkMode ? "text-emerald-800 group-hover:text-emerald-600" : "text-emerald-200 group-hover:text-emerald-400"
                    )} />
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className={cn(
                  "text-xs font-medium italic",
                  darkMode ? "text-emerald-800" : "text-emerald-400"
                )}>Belum ada riwayat doa</p>
              </div>
            )}
          </div>
        </div>

        <PwaDownload 
          darkMode={darkMode} 
          deferredPrompt={deferredPrompt} 
          onInstall={onInstall} 
        />

        <div className={cn(
          "p-6 rounded-3xl border text-center",
          darkMode ? "bg-emerald-900/10 border-emerald-900/20" : "bg-emerald-50/50 border-emerald-100/50"
        )}>
          <p className={cn(
            "text-xs font-bold uppercase tracking-widest mb-1",
            darkMode ? "text-emerald-500" : "text-emerald-600"
          )}>Versi Aplikasi</p>
          <p className={cn(
            "font-bold",
            darkMode ? "text-emerald-200" : "text-emerald-900"
          )}>1.4.0 (Stable)</p>
          <p className={cn(
            "text-[10px] mt-2",
            darkMode ? "text-emerald-700" : "text-emerald-500"
          )}>Pembaruan otomatis diaktifkan</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
