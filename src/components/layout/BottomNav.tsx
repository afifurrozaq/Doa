import React from 'react';
import { Home, Clock, BookOpen, Heart, Settings } from 'lucide-react';
import { AppTab } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  darkMode: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, darkMode }) => {
  const tabs: { id: AppTab; icon: any; label: string }[] = [
    { id: 'Home', icon: Home, label: 'Beranda' },
    { id: 'Prayer', icon: Clock, label: 'Solat' },
    { id: 'Quran', icon: BookOpen, label: 'Quran' },
    { id: 'Favorites', icon: Heart, label: 'Favorit' },
    { id: 'Settings', icon: Settings, label: 'Setelan' },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-6 pb-8 pt-4 border-t backdrop-blur-xl",
      darkMode ? "bg-[#1a202c]/90 border-gray-800" : "bg-white/90 border-emerald-50"
    )}>
      <div className="flex justify-between items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 group relative"
            >
              <div className={cn(
                "w-12 h-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                isActive 
                  ? (darkMode ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20")
                  : (darkMode ? "text-gray-500 hover:text-emerald-400" : "text-gray-400 hover:text-emerald-600")
              )}>
                <Icon size={20} />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-colors",
                isActive 
                  ? (darkMode ? "text-emerald-400" : "text-emerald-700")
                  : (darkMode ? "text-gray-600" : "text-gray-400")
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className={cn(
                  "absolute -top-1 w-1 h-1 rounded-full",
                  darkMode ? "bg-emerald-400" : "bg-emerald-600"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
