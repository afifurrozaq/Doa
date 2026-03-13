import React, { useMemo, useState, useEffect } from 'react';
import { Search, BookOpen, MapPin, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Doa, PrayerTimes, Location } from '../types';
import { getNextPrayer, getTimeRemaining } from '../services/prayerService';
import { fetchInfoCarousel, InfoItem } from '../services/infoService';
import DoaCard from './DoaCard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HomeTabProps {
  activeTab: 'Home' | 'Favorites';
  doaData: Doa[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelectDoa: (doa: Doa) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  categories: string[];
  darkMode: boolean;
  prayerTimes: PrayerTimes | null;
  location: Location | null;
}

const HomeTab: React.FC<HomeTabProps> = ({
  activeTab, doaData, favorites, onToggleFavorite, onSelectDoa,
  searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
  categories, darkMode, prayerTimes, location
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [infoItems, setInfoItems] = useState<InfoItem[]>([]);
  const [currentInfoIndex, setCurrentInfoIndex] = useState(0);

  useEffect(() => {
    fetchInfoCarousel().then(setInfoItems);
  }, []);

  useEffect(() => {
    if (infoItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentInfoIndex(prev => (prev + 1) % infoItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [infoItems]);

  const nextPrayer = useMemo(() => {
    if (!prayerTimes) return null;
    return getNextPrayer(prayerTimes);
  }, [prayerTimes]);

  useEffect(() => {
    if (!nextPrayer) return;

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(nextPrayer.time));
    }, 1000);

    return () => clearInterval(interval);
  }, [nextPrayer]);
  const filteredDoa = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return doaData.filter(doa => {
      const matchesSearch = doa.title.toLowerCase().includes(query) ||
                            doa.translation.toLowerCase().includes(query) ||
                            doa.arabic.includes(searchQuery) ||
                            doa.latin.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'Semua' || doa.category === selectedCategory;
      const matchesFavorites = activeTab !== 'Favorites' || favorites.includes(doa.id);
      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [searchQuery, selectedCategory, activeTab, favorites, doaData]);

  const availableCategories = useMemo(() => {
    if (activeTab === 'Favorites') {
      const favCats = new Set(doaData.filter(d => favorites.includes(d.id)).map(d => d.category));
      return ['Semua', ...Array.from(favCats)];
    }
    return categories;
  }, [categories, doaData, favorites, activeTab]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-6 pt-12 pb-6 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={cn(
              "text-3xl font-bold tracking-tight",
              darkMode ? "text-emerald-400" : "text-emerald-900"
            )}>
              {activeTab === 'Favorites' ? 'Doa Favorit' : 'Doa Harian'}
            </h1>
            <p className={cn(
              "text-sm font-medium",
              darkMode ? "text-emerald-400/70" : "text-emerald-600/70"
            )}>
              {activeTab === 'Favorites' ? 'Kumpulan doa pilihan Anda' : 'Kumpulan doa & dzikir harian'}
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border",
            darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/50" : "bg-emerald-100 text-emerald-700 border-emerald-200/50"
          )}>
            <BookOpen size={24} />
          </div>
        </div>

        {/* Prayer Time & Hijri Card */}
        {activeTab === 'Home' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "mb-6 p-5 rounded-[2rem] border relative overflow-hidden group shadow-xl",
              darkMode ? "bg-emerald-900/20 border-emerald-800/30" : "bg-emerald-600 border-emerald-500"
            )}
          >
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-xl",
                    darkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-white/20 text-white"
                  )}>
                    <MapPin size={14} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    darkMode ? "text-emerald-500" : "text-emerald-100"
                  )}>
                    {location?.address || "Mencari Lokasi..."}
                  </span>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                  darkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-white/20 text-white"
                )}>
                  <Calendar size={12} />
                  {prayerTimes?.hijriDate || "Memuat..."}
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70",
                    darkMode ? "text-emerald-500" : "text-emerald-50"
                  )}>
                    {nextPrayer ? `Menuju ${nextPrayer.name}` : 'Memuat...'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h2 className={cn(
                      "text-4xl font-bold tracking-tighter",
                      darkMode ? "text-white" : "text-white"
                    )}>
                      {nextPrayer?.time || '--:--'}
                    </h2>
                    <span className={cn(
                      "text-sm font-bold opacity-70",
                      darkMode ? "text-emerald-400" : "text-emerald-100"
                    )}>
                      WIB
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-2",
                    darkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-black/20 text-white"
                  )}>
                    <Clock size={12} />
                    {timeRemaining || '--:--'}
                  </div>
                  <p className={cn(
                    "text-[9px] font-bold uppercase tracking-widest opacity-50",
                    darkMode ? "text-emerald-500" : "text-white"
                  )}>
                    Waktu Tersisa
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className={cn(
              "absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl",
              darkMode ? "bg-emerald-500/10" : "bg-white/10"
            )} />
            <div className={cn(
              "absolute -left-8 -bottom-8 w-32 h-32 rounded-full blur-3xl",
              darkMode ? "bg-amber-500/10" : "bg-amber-400/10"
            )} />
          </motion.div>
        )}

        {/* Info Carousel */}
        {activeTab === 'Home' && infoItems.length > 0 && (
          <div className="mb-8 relative h-48 rounded-[2rem] overflow-hidden shadow-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentInfoIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0"
              >
                <img 
                  src={infoItems[currentInfoIndex].imageUrl} 
                  alt={infoItems[currentInfoIndex].title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-white font-bold text-lg leading-tight mb-1">{infoItems[currentInfoIndex].title}</h3>
                  <p className="text-white/70 text-xs line-clamp-2">{infoItems[currentInfoIndex].description}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Carousel Indicators */}
            <div className="absolute bottom-4 right-6 flex gap-1.5">
              {infoItems.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === currentInfoIndex ? "w-4 bg-emerald-400" : "w-1 bg-white/30"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <div className="relative group mb-6">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
            darkMode ? "text-emerald-700 group-focus-within:text-emerald-500" : "text-emerald-400 group-focus-within:text-emerald-600"
          )} size={20} />
          <input 
            type="text" 
            placeholder="Cari doa, arti, atau kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-12 pr-12 py-4 rounded-2xl border focus:outline-none focus:ring-2 transition-all shadow-sm",
              darkMode 
                ? "bg-[#2d3748] border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-emerald-500/10 focus:border-emerald-500/50" 
                : "bg-white border-emerald-100 text-gray-900 placeholder-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500"
            )}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {availableCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border",
                selectedCategory === category
                  ? (darkMode ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" : "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20")
                  : (darkMode ? "bg-[#2d3748] border-gray-700 text-gray-400 hover:border-emerald-500/30" : "bg-white border-emerald-50 text-emerald-700 hover:border-emerald-200 shadow-sm")
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
        <div className="space-y-4">
          {filteredDoa.length > 0 ? (
            filteredDoa.map((doa, index) => (
              <motion.div
                key={doa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DoaCard 
                  doa={doa}
                  isFavorite={favorites.includes(doa.id)}
                  onToggleFavorite={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(doa.id);
                  }}
                  onClick={() => onSelectDoa(doa)}
                  darkMode={darkMode}
                />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                darkMode ? "bg-emerald-900/20 text-emerald-800" : "bg-emerald-50 text-emerald-200"
              )}>
                <Search size={40} />
              </div>
              <p className={cn(
                "text-sm font-bold",
                darkMode ? "text-emerald-800" : "text-emerald-300"
              )}>Tidak ada doa ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
