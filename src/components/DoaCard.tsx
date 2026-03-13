import React from 'react';
import { Heart, ChevronRight } from 'lucide-react';
import { Doa } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DoaCardProps {
  doa: Doa;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
  darkMode: boolean;
}

const DoaCard: React.FC<DoaCardProps> = ({ doa, isFavorite, onToggleFavorite, onClick, darkMode }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-5 rounded-3xl border flex items-center justify-between transition-all group relative overflow-hidden",
        darkMode ? "bg-[#2d3748] border-gray-700 hover:border-emerald-500/50" : "bg-white border-emerald-50 hover:border-emerald-200 shadow-sm hover:shadow-md"
      )}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-colors",
          darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"
        )}>
          {doa.title.charAt(0)}
        </div>
        <div className="text-left">
          <h3 className={cn(
            "font-bold text-base mb-1",
            darkMode ? "text-gray-100" : "text-emerald-900"
          )}>{doa.title}</h3>
          <p className={cn(
            "text-xs font-medium",
            darkMode ? "text-emerald-400/60" : "text-emerald-600/60"
          )}>{doa.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <div 
          onClick={onToggleFavorite}
          className={cn(
            "p-2 rounded-xl transition-colors",
            isFavorite 
              ? "text-rose-500 bg-rose-500/10" 
              : (darkMode ? "text-gray-600 hover:text-rose-400" : "text-gray-200 hover:text-rose-400")
          )}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
        </div>
        <ChevronRight size={20} className={cn(
          "transition-transform group-hover:translate-x-1",
          darkMode ? "text-gray-700" : "text-emerald-100"
        )} />
      </div>
      
      {/* Decorative background element */}
      <div className={cn(
        "absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity",
        darkMode ? "bg-emerald-500/10" : "bg-emerald-500/5"
      )} />
    </button>
  );
};

export default DoaCard;
