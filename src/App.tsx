import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { toPng } from 'html-to-image';

import { Doa, AppTab, QuranBookmark } from './types';
import { useSettings } from './hooks/useSettings';
import { useDoa } from './hooks/useDoa';
import { usePrayer } from './hooks/usePrayer';
import { usePwa } from './hooks/usePwa';

import BottomNav from './components/layout/BottomNav';
import HomeTab from './components/HomeTab';
import PrayerTab from './components/PrayerTab';
import SettingsTab from './components/SettingsTab';
import Quran from './components/Quran';
import DoaModal from './components/DoaModal';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('Home');
  const [selectedDoa, setSelectedDoa] = useState<Doa | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [navigatedAyat, setNavigatedAyat] = useState<{ surahNomor: number; ayatNomor: number } | null>(null);
  const [quranBookmarks, setQuranBookmarks] = useState<QuranBookmark[]>([]);
  const storyRef = useRef<HTMLDivElement>(null);

  const { darkMode, setDarkMode, notificationsEnabled, setNotificationsEnabled } = useSettings();
  const { doaData, isLoading, fetchError, favorites, toggleFavorite, history, addToHistory, clearHistory, categories } = useDoa(activeTab);
  const { prayerTimes, location, isLoading: isPrayerLoading, isAdhanPlaying, setIsAdhanPlaying } = usePrayer(notificationsEnabled);
  const { deferredPrompt, installApp } = usePwa();

  const adhanAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isAdhanPlaying) {
      if (adhanAudioRef.current) {
        adhanAudioRef.current.play().catch(err => console.error("Error playing adhan:", err));
      }
    } else {
      if (adhanAudioRef.current) {
        adhanAudioRef.current.pause();
        adhanAudioRef.current.currentTime = 0;
      }
    }
  }, [isAdhanPlaying]);

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('quran_bookmarks');
    if (savedBookmarks) {
      setQuranBookmarks(JSON.parse(savedBookmarks));
    }
  }, [activeTab]);

  const handleNavigateToAyat = (surahNomor: number, ayatNomor: number) => {
    setNavigatedAyat({ surahNomor, ayatNomor });
    setActiveTab('Quran');
  };

  const handleRemoveQuranBookmark = (surahNomor: number, ayatNomor: number) => {
    const updated = quranBookmarks.filter(b => !(b.surahNomor === surahNomor && b.ayatNomor === ayatNomor));
    setQuranBookmarks(updated);
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated));
  };

  const handleSelectDoa = (doa: Doa) => {
    setSelectedDoa(doa);
    addToHistory(doa.id);
  };

  const handleCloseModal = () => {
    setSelectedDoa(null);
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      } else {
        alert('Izin notifikasi ditolak. Silakan aktifkan di pengaturan browser Anda.');
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const stopAdhan = () => {
    if (adhanAudioRef.current) {
      adhanAudioRef.current.pause();
      adhanAudioRef.current.currentTime = 0;
      setIsAdhanPlaying(false);
    }
  };

  const testAdhan = () => {
    setIsAdhanPlaying(true);
    // Auto stop after 5 seconds for testing
    setTimeout(() => {
      setIsAdhanPlaying(false);
    }, 5000);
  };

  const handleShare = async (doa: Doa) => {
    const text = `${doa.title}\n\n${doa.arabic}\n\n${doa.latin}\n\nArtinya: ${doa.translation}\n\nDibagikan dari Doa Harian Modern`;
    if (navigator.share) {
      try {
        await navigator.share({ title: doa.title, text, url: window.location.href });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Teks doa telah disalin ke clipboard.');
    }
  };

  const handleShareImage = async () => {
    if (!storyRef.current || !selectedDoa) return;
    try {
      setIsGeneratingImage(true);
      // Give time for the hidden element to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(storyRef.current, { 
        quality: 0.95, 
        pixelRatio: 2, 
        backgroundColor: '#f0fdf4',
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `doa-${selectedDoa.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('Gagal membuat gambar. Silakan coba lagi.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden transition-colors duration-300",
      darkMode ? "bg-[#1a202c] text-[#f7fafc]" : "bg-[#FDFCF9] text-gray-900"
    )}>
      {/* Adhan Indicator */}
      <AnimatePresence>
        {isAdhanPlaying && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <div className={cn("p-4 rounded-3xl shadow-2xl border flex items-center justify-between backdrop-blur-xl", darkMode ? "bg-emerald-900/90 border-emerald-700" : "bg-white/90 border-emerald-100")}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white animate-pulse"><Volume2 size={20} /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Sedang Berkumandang</p>
                  <p className={cn("font-bold", darkMode ? "text-white" : "text-emerald-900")}>Adzan Makkah</p>
                </div>
              </div>
              <button onClick={stopAdhan} className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors">Berhenti</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decoration */}
      <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none", darkMode ? "bg-emerald-900/20" : "bg-emerald-50")} />
      <div className={cn("absolute bottom-0 left-0 w-64 h-64 rounded-full -ml-32 -mb-32 blur-3xl opacity-50 pointer-events-none", darkMode ? "bg-amber-900/20" : "bg-amber-50")} />

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'Home' || activeTab === 'Favorites' ? (
            <HomeTab 
              activeTab={activeTab} 
              doaData={doaData} 
              favorites={favorites} 
              onToggleFavorite={toggleFavorite} 
              onSelectDoa={handleSelectDoa}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              darkMode={darkMode}
              prayerTimes={prayerTimes}
              location={location}
            />
          ) : activeTab === 'Prayer' ? (
            <PrayerTab prayerTimes={prayerTimes} location={location} isLoading={isPrayerLoading} darkMode={darkMode} />
          ) : activeTab === 'Quran' ? (
            <Quran 
              darkMode={darkMode} 
              navigatedAyat={navigatedAyat} 
              onClearNavigation={() => setNavigatedAyat(null)} 
            />
          ) : (
            <SettingsTab 
              darkMode={darkMode} setDarkMode={setDarkMode} 
              notificationsEnabled={notificationsEnabled} onToggleNotifications={handleToggleNotifications}
              history={history} onClearHistory={clearHistory}
              doaData={doaData} onSelectDoa={handleSelectDoa}
              deferredPrompt={deferredPrompt} onInstall={installApp}
              quranBookmarks={quranBookmarks}
              onNavigateToAyat={handleNavigateToAyat}
              onRemoveQuranBookmark={handleRemoveQuranBookmark}
              onTestAdhan={testAdhan}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} />

      <audio 
        ref={adhanAudioRef} 
        src="https://www.islamcan.com/audio/adhan/azan1.mp3" 
        preload="auto"
      />

      <DoaModal 
        doa={selectedDoa} 
        onClose={handleCloseModal} 
        isFavorite={selectedDoa ? favorites.includes(selectedDoa.id) : false}
        onToggleFavorite={() => selectedDoa && toggleFavorite(selectedDoa.id)}
        onShare={() => selectedDoa && handleShare(selectedDoa)}
        onCopy={() => selectedDoa && navigator.clipboard.writeText(selectedDoa.arabic)}
        onShareImage={handleShareImage}
        isGeneratingImage={isGeneratingImage}
        darkMode={darkMode}
        storyRef={storyRef}
      />
    </div>
  );
}
