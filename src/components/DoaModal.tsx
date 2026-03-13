import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Share2, Copy, ImageIcon, Volume2, Play, Pause, Download } from 'lucide-react';
import { Doa } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DoaModalProps {
  doa: Doa | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onCopy: () => void;
  onShareImage: () => void;
  isGeneratingImage: boolean;
  darkMode: boolean;
  storyRef: React.RefObject<HTMLDivElement>;
}

const DoaModal: React.FC<DoaModalProps> = ({
  doa, onClose, isFavorite, onToggleFavorite, onShare, onCopy, onShareImage,
  isGeneratingImage, darkMode, storyRef
}) => {
  if (!doa) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          className={cn(
            "relative w-full max-w-md rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]",
            darkMode ? "bg-[#1a202c]" : "bg-[#FDFCF9]"
          )}
        >
          {/* Modal Header */}
          <div className="p-6 flex justify-between items-center border-b border-emerald-50/10">
            <div className="flex items-center gap-3">
              <button 
                onClick={onToggleFavorite}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  isFavorite ? "text-rose-500 bg-rose-500/10" : "text-gray-400 hover:bg-gray-100"
                )}
              >
                <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={onShare}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Share2 size={24} />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
            <div className="text-center space-y-8">
              <div>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 inline-block",
                  darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                )}>{doa.category}</span>
                <h2 className={cn(
                  "text-2xl font-bold tracking-tight leading-tight",
                  darkMode ? "text-white" : "text-emerald-900"
                )}>{doa.title}</h2>
              </div>

              {/* Arabic Text */}
              <div className="relative py-4">
                <p className={cn(
                  "text-4xl font-arabic leading-[1.8] text-right dir-rtl",
                  darkMode ? "text-gray-100" : "text-emerald-950"
                )}>{doa.arabic}</p>
              </div>

              {/* Latin & Translation */}
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Latin</p>
                  <p className={cn(
                    "text-sm font-medium italic leading-relaxed",
                    darkMode ? "text-emerald-400/80" : "text-emerald-700/80"
                  )}>{doa.latin}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Artinya</p>
                  <p className={cn(
                    "text-base leading-relaxed font-medium",
                    darkMode ? "text-gray-300" : "text-gray-700"
                  )}>{doa.translation}</p>
                </div>

                {doa.notes && (
                  <div className="space-y-2 pt-4 border-t border-emerald-50/10">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Keterangan</p>
                    <p className={cn(
                      "text-sm leading-relaxed font-medium",
                      darkMode ? "text-gray-400" : "text-gray-600"
                    )}>{doa.notes}</p>
                  </div>
                )}

                {doa.source && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Sumber</p>
                    <p className={cn(
                      "text-xs font-bold",
                      darkMode ? "text-emerald-500/60" : "text-emerald-700/60"
                    )}>{doa.source}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className={cn(
            "p-6 border-t grid grid-cols-3 gap-3",
            darkMode ? "bg-gray-900/50 border-gray-800" : "bg-emerald-50/50 border-emerald-100"
          )}>
            <button 
              onClick={onCopy}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-emerald-700 hover:bg-emerald-100 shadow-sm"
              )}
            >
              <Copy size={20} />
              <span className="text-[10px] font-bold uppercase">Salin</span>
            </button>
            <button 
              onClick={onShareImage}
              disabled={isGeneratingImage}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-emerald-700 hover:bg-emerald-100 shadow-sm"
              )}
            >
              {isGeneratingImage ? (
                <div className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <ImageIcon size={20} />
              )}
              <span className="text-[10px] font-bold uppercase">Gambar</span>
            </button>
            <button 
              onClick={onShareImage}
              disabled={isGeneratingImage}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-emerald-700 hover:bg-emerald-100 shadow-sm"
              )}
            >
              {isGeneratingImage ? (
                <div className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <Download size={20} />
              )}
              <span className="text-[10px] font-bold uppercase">Simpan</span>
            </button>
          </div>
        </motion.div>

        {/* Hidden Story Generator */}
        <div className="fixed left-[-9999px] top-0">
          <div 
            ref={storyRef}
            className="w-[1080px] h-[1920px] bg-[#f0fdf4] p-20 flex flex-col justify-between relative overflow-hidden"
          >
            {/* Decorative elements for image generation */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100 rounded-full -mr-300 -mt-300 blur-[100px] opacity-50" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-100 rounded-full -ml-300 -mb-300 blur-[100px] opacity-50" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold">
                  {doa.title.charAt(0)}
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600 uppercase tracking-[0.3em] mb-2">{doa.category}</p>
                  <h1 className="text-6xl font-black text-emerald-950 tracking-tight">{doa.title}</h1>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-md rounded-[80px] p-20 border-4 border-white shadow-2xl mb-20">
                <p className="text-8xl font-arabic leading-[1.8] text-right text-emerald-950 mb-12 dir-rtl">
                  {doa.arabic}
                </p>
                <div className="h-2 w-40 bg-emerald-200 rounded-full mb-12" />
                <p className="text-4xl font-bold italic text-emerald-800/80 leading-relaxed mb-8">
                  {doa.latin}
                </p>
                <p className="text-5xl font-medium text-emerald-900 leading-relaxed">
                  {doa.translation}
                </p>
                
                {(doa.source || doa.notes) && (
                  <div className="mt-12 pt-12 border-t-4 border-emerald-100/50">
                    {doa.notes && (
                      <div className="mb-6">
                        <p className="text-2xl font-bold text-emerald-600 uppercase tracking-widest mb-2">Keterangan</p>
                        <p className="text-3xl font-medium text-emerald-800/70 leading-relaxed">{doa.notes}</p>
                      </div>
                    )}
                    {doa.source && (
                      <div>
                        <p className="text-2xl font-bold text-emerald-600 uppercase tracking-widest mb-2">Sumber</p>
                        <p className="text-3xl font-bold text-emerald-900/40">{doa.source}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-emerald-600 uppercase tracking-widest mb-2">Doa Harian Modern</p>
                <p className="text-2xl font-medium text-emerald-900/60 tracking-tight">Kumpulan doa & dzikir harian digital</p>
              </div>
              <div className="w-32 h-32 bg-emerald-600 rounded-[40px] flex items-center justify-center text-white">
                <Volume2 size={64} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DoaModal;
