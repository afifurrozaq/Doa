import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { PrayerTimes, Location } from '../types';
import { getNextPrayer, getTimeRemaining } from '../services/prayerService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PrayerTabProps {
  prayerTimes: PrayerTimes | null;
  location: Location | null;
  isLoading: boolean;
  darkMode: boolean;
}

const PrayerTab: React.FC<PrayerTabProps> = ({ prayerTimes, location, isLoading, darkMode }) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!prayerTimes) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Gagal memuat waktu solat</p>
      </div>
    );
  }

  const prayers = [
    { name: 'Subuh', time: prayerTimes.Fajr },
    { name: 'Terbit', time: prayerTimes.Sunrise },
    { name: 'Dzuhur', time: prayerTimes.Dhuhr },
    { name: 'Ashar', time: prayerTimes.Asr },
    { name: 'Maghrib', time: prayerTimes.Maghrib },
    { name: 'Isya', time: prayerTimes.Isha },
  ];

  const next = getNextPrayer(prayerTimes);

  return (
    <div className="flex-1 flex flex-col p-6 pt-12 overflow-y-auto pb-32 no-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={cn(
            "text-3xl font-bold tracking-tight",
            darkMode ? "text-emerald-400" : "text-emerald-900"
          )}>Waktu Solat</h1>
          <p className={cn(
            "text-sm font-medium flex items-center gap-1",
            darkMode ? "text-emerald-400/70" : "text-emerald-600/70"
          )}>
            <MapPin size={14} />
            {location ? "Lokasi Terdeteksi" : "Jakarta (Default)"}
          </p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border",
          darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/50" : "bg-emerald-100 text-emerald-700 border-emerald-200/50"
        )}>
          <Clock size={24} />
        </div>
      </div>

      <div className="space-y-4">
        {prayers.map((prayer) => {
          const isNext = next.name === prayer.name;
          return (
            <div 
              key={prayer.name}
              className={cn(
                "p-5 rounded-3xl border flex items-center justify-between transition-all",
                isNext 
                  ? darkMode ? "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-900/20" : "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-100"
                  : darkMode ? "bg-[#2d3748] border-gray-700" : "bg-white border-emerald-50"
              )}
            >
              <span className={cn(
                "font-bold",
                isNext ? "text-white" : darkMode ? "text-gray-100" : "text-emerald-900"
              )}>{prayer.name}</span>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className={cn(
                    "text-xl block font-black leading-none",
                    isNext ? "text-white" : darkMode ? "text-emerald-400" : "text-emerald-600"
                  )}>{prayer.time}</span>
                  {isNext && (
                    <span className="text-[10px] font-bold text-white/70 block mt-1">
                      -{getTimeRemaining(prayer.time)}
                    </span>
                  )}
                </div>
                {isNext && (
                  <div className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest">
                    Berikutnya
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrayerTab;
