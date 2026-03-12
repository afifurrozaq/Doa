import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  Heart, 
  Home, 
  Settings, 
  ChevronRight, 
  Play, 
  Pause,
  Volume2,
  X,
  Moon,
  Sun,
  Share2,
  Copy,
  History,
  Trash2,
  Image as ImageIcon,
  Download,
  Clock,
  MapPin,
  Bell,
  BellOff
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { DOA_DATA, Doa } from './constants';
import { generateSpeech } from './services/geminiService';
import { fetchDoaFromSpreadsheet } from './services/spreadsheetService';
import { fetchPrayerTimes, getNextPrayer, PrayerTimes, checkIsPrayerTime, getTimeRemaining } from './services/prayerService';
import AppIconGenerator from './components/AppIconGenerator';
import Quran from './components/Quran';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [doaData, setDoaData] = useState<Doa[]>(DOA_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoa, setSelectedDoa] = useState<Doa | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'Home' | 'Prayer' | 'Quran' | 'Favorites' | 'Settings'>('Home');
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isPrayerLoading, setIsPrayerLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [lastNotifiedPrayer, setLastNotifiedPrayer] = useState<string | null>(null);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const adhanAudioRef = useRef<HTMLAudioElement | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup audio on modal close
  useEffect(() => {
    if (!selectedDoa) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setAudioProgress(0);
      setAudioDuration(0);
    }
  }, [selectedDoa]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Load data from spreadsheet with real-time polling
  useEffect(() => {
    const loadData = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = await fetchDoaFromSpreadsheet();
        
        // Only update if data actually changed to prevent unnecessary re-renders
        setDoaData(prev => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });
        setFetchError(null);
      } catch (err) {
        console.error("Failed to load data:", err);
        setFetchError("Gagal sinkronisasi data terbaru");
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    // Initial load
    loadData(true);

    // Poll every 30 seconds for updates
    const interval = setInterval(() => {
      loadData(false); // Don't show spinner for background updates
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  // Load favorites and history from localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem('doa_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    const savedHistory = localStorage.getItem('doa_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory([...new Set(parsed as string[])]);
        }
      } catch (e) {
        console.error('Error parsing history:', e);
      }
    }
  }, []);

  // Fetch Prayer Times
  useEffect(() => {
    const getPrayerData = async (lat: number, lon: number) => {
      setIsPrayerLoading(true);
      const times = await fetchPrayerTimes(lat, lon);
      if (times) {
        setPrayerTimes(times);
        localStorage.setItem('prayer_times', JSON.stringify(times));
      }
      setIsPrayerLoading(false);
    };

    const savedTimes = localStorage.getItem('prayer_times');
    if (savedTimes) setPrayerTimes(JSON.parse(savedTimes));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude });
          getPrayerData(latitude, longitude);
        },
        () => {
          // Default to Jakarta if geolocation fails
          getPrayerData(-6.2088, 106.8456);
        }
      );
    } else {
      getPrayerData(-6.2088, 106.8456);
    }
  }, []);

  // Notification logic
  useEffect(() => {
    if (!notificationsEnabled || !prayerTimes) return;

    const checkInterval = setInterval(() => {
      const prayerName = checkIsPrayerTime(prayerTimes);
      if (prayerName && prayerName !== lastNotifiedPrayer) {
        // Trigger notification
        if (Notification.permission === 'granted') {
          new Notification(`Waktu Solat ${prayerName}`, {
            body: `Sekarang adalah waktu untuk solat ${prayerName}. Mari tunaikan kewajiban.`,
            icon: 'https://picsum.photos/seed/doa/192/192'
          });
          
          // Play Adhan
          if (!adhanAudioRef.current) {
            adhanAudioRef.current = new Audio('https://upload.wikimedia.org/wikipedia/commons/2/24/Adhan_Makkah.mp3');
            adhanAudioRef.current.onended = () => setIsAdhanPlaying(false);
          }
          
          adhanAudioRef.current.play().catch(err => {
            console.error("Failed to play Adhan audio:", err);
          });
          setIsAdhanPlaying(true);
          
          setLastNotifiedPrayer(prayerName);
        }
      } else if (!prayerName) {
        setLastNotifiedPrayer(null);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [notificationsEnabled, prayerTimes, lastNotifiedPrayer]);

  const stopAdhan = () => {
    if (adhanAudioRef.current) {
      adhanAudioRef.current.pause();
      adhanAudioRef.current.currentTime = 0;
      setIsAdhanPlaying(false);
    }
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

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('doa_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('doa_history', JSON.stringify(history));
  }, [history]);

  // Update history when a doa is selected
  useEffect(() => {
    if (selectedDoa) {
      setHistory(prev => {
        const filtered = prev.filter(id => id !== selectedDoa.id);
        return [selectedDoa.id, ...filtered].slice(0, 10);
      });
    }
  }, [selectedDoa]);

  const categories = useMemo(() => {
    const cats = ['Semua', ...new Set(doaData.map(d => d.category))];
    return cats;
  }, [doaData]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    doaData.forEach(doa => {
      // If in favorites tab, only count favorites
      if (activeTab === 'Favorites' && !favorites.includes(doa.id)) return;
      counts[doa.category] = (counts[doa.category] || 0) + 1;
    });
    return counts;
  }, [doaData, favorites, activeTab]);

  const availableCategories = useMemo(() => {
    if (activeTab === 'Favorites') {
      return ['Semua', ...Object.keys(categoryCounts)];
    }
    return categories;
  }, [categories, categoryCounts, activeTab]);

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

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handlePlayAudio = async (doa: Doa) => {
    if (isAudioLoading) return;

    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }
    
    setIsAudioLoading(true);
    const url = await generateSpeech(doa.arabic);
    setIsAudioLoading(false);
    
    if (url) {
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });
      audio.addEventListener('timeupdate', () => {
        setAudioProgress(audio.currentTime);
      });
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration);
      });

      audio.play();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here
  };

  const handleShare = async (doa: Doa) => {
    const text = `${doa.title}\n\n${doa.arabic}\n\n${doa.latin}\n\nArtinya: ${doa.translation}\n\nDibagikan dari Doa Harian Modern`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: doa.title,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      copyToClipboard(text);
      alert('Teks doa telah disalin ke clipboard untuk dibagikan.');
    }
  };

  const handleShareImage = async () => {
    if (!storyRef.current || !selectedDoa) return;
    
    try {
      setIsGeneratingImage(true);
      
      // Wait a bit for fonts/styles to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(storyRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#f0fdf4', // emerald-50
      });
      
      const link = document.createElement('a');
      link.download = `doa-${selectedDoa.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div 
      className={cn(
        "min-h-screen flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden transition-colors duration-300",
        darkMode ? "bg-[#1a202c] text-[#f7fafc]" : "bg-[#FDFCF9] text-gray-900"
      )}
      style={darkMode ? { backgroundColor: '#1a202c', color: '#f7fafc' } : {}}
    >
      {/* Adhan Playing Indicator */}
      <AnimatePresence>
        {isAdhanPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
          >
            <div className={cn(
              "p-4 rounded-3xl shadow-2xl border flex items-center justify-between backdrop-blur-xl",
              darkMode ? "bg-emerald-900/90 border-emerald-700" : "bg-white/90 border-emerald-100"
            )}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white animate-pulse">
                  <Volume2 size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Sedang Berkumandang</p>
                  <p className={cn("font-bold", darkMode ? "text-white" : "text-emerald-900")}>Adzan Makkah</p>
                </div>
              </div>
              <button 
                onClick={stopAdhan}
                className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors"
              >
                Berhenti
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decoration */}
      <div className={cn(
        "absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 pointer-events-none",
        darkMode ? "bg-emerald-900/20" : "bg-emerald-50"
      )} />
      <div className={cn(
        "absolute bottom-0 left-0 w-64 h-64 rounded-full -ml-32 -mb-32 blur-3xl opacity-50 pointer-events-none",
        darkMode ? "bg-amber-900/20" : "bg-amber-50"
      )} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {activeTab === 'Quran' ? (
            <Quran darkMode={darkMode} />
          ) : activeTab === 'Settings' ? (
            <div className="flex-1 flex flex-col p-6 pt-12">
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
                  <div className="h-px bg-emerald-50" />
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
                      onClick={handleToggleNotifications}
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
                        onClick={() => setHistory([])}
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
                            onClick={() => {
                              setSelectedDoa(doa);
                              // We don't change tab, just open modal
                            }}
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

                {/* App Icon Generator */}


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
                  )}>1.3.0 (Stable)</p>
                  <p className={cn(
                    "text-[10px] mt-2",
                    darkMode ? "text-emerald-700" : "text-emerald-500"
                  )}>Pembaruan otomatis diaktifkan</p>
                </div>

                {deferredPrompt && (
                  <button 
                    onClick={handleInstallApp}
                    className="w-full bg-emerald-600 text-white p-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    <Download size={20} />
                    Instal Aplikasi
                  </button>
                )}
              </div>
            </div>
          ) : activeTab === 'Prayer' ? (
            <div className="flex-1 flex flex-col p-6 pt-12 overflow-y-auto pb-32">
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

              {isPrayerLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : prayerTimes ? (
                <div className="space-y-4">
                  {[
                    { name: 'Subuh', time: prayerTimes.Fajr },
                    { name: 'Terbit', time: prayerTimes.Sunrise },
                    { name: 'Dzuhur', time: prayerTimes.Dhuhr },
                    { name: 'Ashar', time: prayerTimes.Asr },
                    { name: 'Maghrib', time: prayerTimes.Maghrib },
                    { name: 'Isya', time: prayerTimes.Isha },
                  ].map((prayer) => {
                    const next = getNextPrayer(prayerTimes);
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
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Gagal memuat waktu solat</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="px-6 pt-12 pb-6 z-10">
                {!isOnline && (
                  <div className={cn(
                    "mb-4 p-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 border shadow-sm",
                    darkMode ? "bg-amber-900/20 text-amber-400 border-amber-900/30" : "bg-amber-50 text-amber-800 border-amber-100"
                  )}>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Mode Offline Aktif - Menggunakan Data Cache
                  </div>
                )}

                {isOnline && fetchError && (
                  <div className={cn(
                    "mb-4 p-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 border shadow-sm",
                    darkMode ? "bg-rose-900/20 text-rose-400 border-rose-900/30" : "bg-rose-50 text-rose-800 border-rose-100"
                  )}>
                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                    {fetchError} - Menggunakan Data Terakhir
                  </div>
                )}
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
                    {activeTab === 'Favorites' ? <Heart size={24} fill="currentColor" /> : <BookOpen size={24} />}
                  </div>
                </div>

                {/* Prayer Times Widget on Home */}
                {activeTab === 'Home' && prayerTimes && (
                  <button 
                    onClick={() => setActiveTab('Prayer')}
                    className={cn(
                      "mb-6 p-4 rounded-3xl border flex items-center justify-between shadow-sm group transition-all active:scale-95",
                      darkMode ? "bg-emerald-900/20 border-emerald-800/50" : "bg-emerald-50 border-emerald-100"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        darkMode ? "bg-emerald-600 text-white" : "bg-emerald-600 text-white"
                      )}>
                        <Clock size={20} />
                      </div>
                      <div className="text-left">
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          darkMode ? "text-emerald-500" : "text-emerald-600"
                        )}>Solat Berikutnya</p>
                        <p className={cn(
                          "font-bold",
                          darkMode ? "text-emerald-200" : "text-emerald-900"
                        )}>
                          {getNextPrayer(prayerTimes).name} • {getNextPrayer(prayerTimes).time}
                          <span className="ml-2 text-[10px] opacity-60">
                            (-{getTimeRemaining(getNextPrayer(prayerTimes).time)})
                          </span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className={cn(
                      "transition-transform group-hover:translate-x-1",
                      darkMode ? "text-emerald-800" : "text-emerald-200"
                    )} />
                  </button>
                )}

                {/* Search Bar */}
                <div className="relative group">
                  <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                    darkMode ? "text-emerald-700 group-focus-within:text-emerald-500" : "text-emerald-400 group-focus-within:text-emerald-600"
                  )} size={20} />
                  <input 
                    type="text" 
                    placeholder="Cari judul, arti, arab, atau latin..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "w-full pl-12 pr-12 py-4 rounded-2xl border focus:outline-none focus:ring-2 transition-all shadow-sm",
                      darkMode 
                        ? "bg-[#2d3748] border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-emerald-500/10 focus:border-emerald-500/50" 
                        : "bg-white border-emerald-100 text-gray-900 placeholder-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500"
                    )}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className={cn(
                        "absolute right-4 top-1/2 -translate-y-1/2 transition-colors",
                        darkMode ? "text-gray-500 hover:text-gray-300" : "text-emerald-300 hover:text-emerald-500"
                      )}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </header>

              {/* Categories */}
              <div className="px-6 mb-6 z-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    darkMode ? "text-emerald-700" : "text-emerald-400"
                  )}>Kategori Doa</h2>
                  {selectedCategory !== 'Semua' && (
                    <button 
                      onClick={() => setSelectedCategory('Semua')}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                    >
                      Hapus Filter
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto flex gap-3 no-scrollbar -mx-2 px-2">
                  {availableCategories.map(cat => {
                    const count = cat === 'Semua' 
                      ? (activeTab === 'Favorites' ? favorites.length : doaData.length)
                      : categoryCounts[cat] || 0;
                    
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2",
                          selectedCategory === cat 
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                            : darkMode 
                              ? "bg-[#2d3748] text-emerald-400 border border-gray-700 hover:bg-gray-700"
                              : "bg-white text-emerald-700 border border-emerald-100 hover:bg-emerald-50"
                        )}
                      >
                        {cat}
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-md text-[10px]",
                          selectedCategory === cat
                            ? "bg-white/20 text-white"
                            : darkMode ? "bg-emerald-900/30 text-emerald-500" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doa List */}
              <main className="flex-1 px-6 pb-24 overflow-y-auto z-10">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className={cn(
                      "w-12 h-12 border-4 rounded-full animate-spin mb-4",
                      darkMode ? "border-emerald-900/30 border-t-emerald-500" : "border-emerald-100 border-t-emerald-600"
                    )} />
                    <p className={cn(
                      "font-medium",
                      darkMode ? "text-emerald-500" : "text-emerald-600"
                    )}>Memuat data doa...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDoa.map((doa, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={doa.id}
                        onClick={() => setSelectedDoa(doa)}
                        className={cn(
                          "doa-card p-5 rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer group transition-all",
                          darkMode 
                            ? "bg-[#2d3748] border-gray-700 hover:border-emerald-500/50" 
                            : "bg-white border-emerald-50 hover:border-emerald-200"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-colors",
                          darkMode 
                            ? "bg-emerald-900/30 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white" 
                            : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className={cn(
                            "font-bold transition-colors",
                            darkMode ? "text-gray-100 group-hover:text-emerald-400" : "text-emerald-900 group-hover:text-emerald-700"
                          )}>{doa.title}</h3>
                          <p className={cn(
                            "text-xs font-medium uppercase tracking-wider",
                            darkMode ? "text-emerald-700" : "text-emerald-500"
                          )}>{doa.category}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(doa.id);
                          }}
                          className={cn(
                            "p-2 rounded-xl transition-colors",
                            favorites.includes(doa.id) 
                              ? "text-rose-500 bg-rose-500/10" 
                              : darkMode ? "text-emerald-800 hover:text-emerald-600" : "text-emerald-200 hover:text-emerald-400"
                          )}
                        >
                          <Heart size={20} fill={favorites.includes(doa.id) ? "currentColor" : "none"} />
                        </button>
                        <ChevronRight size={20} className={cn(
                          "transition-colors",
                          darkMode ? "text-emerald-800 group-hover:text-emerald-600" : "text-emerald-200 group-hover:text-emerald-400"
                        )} />
                      </motion.div>
                    ))}
                    
                    {filteredDoa.length === 0 && (
                      <div className="text-center py-12">
                        <div className={cn(
                          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
                          darkMode ? "bg-emerald-900/20" : "bg-emerald-50"
                        )}>
                          {activeTab === 'Favorites' 
                            ? <Heart size={32} className={darkMode ? "text-emerald-800" : "text-emerald-200"} /> 
                            : <Search size={32} className={darkMode ? "text-emerald-800" : "text-emerald-200"} />}
                        </div>
                        <p className={cn(
                          "font-semibold",
                          darkMode ? "text-gray-100" : "text-emerald-900"
                        )}>
                          {activeTab === 'Favorites' ? 'Belum ada doa favorit' : 'Doa tidak ditemukan'}
                        </p>
                        <p className={cn(
                          "text-sm",
                          darkMode ? "text-emerald-700" : "text-emerald-500"
                        )}>
                          {activeTab === 'Favorites' ? 'Tandai doa dengan ikon hati untuk menyimpannya di sini' : 'Coba kata kunci lain'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </main>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md backdrop-blur-xl border-t px-4 py-4 flex justify-between items-center z-20 transition-colors duration-300",
        darkMode ? "bg-[#1a202c]/80 border-gray-800" : "bg-white/80 border-emerald-50"
      )}>
        <button 
          onClick={() => setActiveTab('Home')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors w-16",
            activeTab === 'Home' 
              ? darkMode ? "text-emerald-400" : "text-emerald-600" 
              : darkMode ? "text-gray-600 hover:text-gray-400" : "text-emerald-300 hover:text-emerald-500"
          )}
        >
          <Home size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Beranda</span>
        </button>
        <button 
          onClick={() => setActiveTab('Prayer')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors w-16",
            activeTab === 'Prayer' 
              ? darkMode ? "text-emerald-400" : "text-emerald-600" 
              : darkMode ? "text-gray-600 hover:text-gray-400" : "text-emerald-300 hover:text-emerald-500"
          )}
        >
          <Clock size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Solat</span>
        </button>

        {/* Quran Button - Timbul */}
        <div className="relative -top-6">
          <button 
            onClick={() => setActiveTab('Quran')}
            className={cn(
              "w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1 shadow-xl transition-all active:scale-90",
              activeTab === 'Quran'
                ? "bg-emerald-600 text-white shadow-emerald-500/40"
                : darkMode ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            )}
          >
            <BookOpen size={28} />
            <span className="text-[8px] font-black uppercase tracking-tighter">Al-Quran</span>
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('Favorites')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors w-16",
            activeTab === 'Favorites' 
              ? darkMode ? "text-emerald-400" : "text-emerald-600" 
              : darkMode ? "text-gray-600 hover:text-gray-400" : "text-emerald-300 hover:text-emerald-500"
          )}
        >
          <Heart size={20} fill={activeTab === 'Favorites' ? "currentColor" : "none"} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Favorit</span>
        </button>
        <button 
          onClick={() => setActiveTab('Settings')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors w-16",
            activeTab === 'Settings' 
              ? darkMode ? "text-emerald-400" : "text-emerald-600" 
              : darkMode ? "text-gray-600 hover:text-gray-400" : "text-emerald-300 hover:text-emerald-500"
          )}
        >
          <Settings size={20} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Menu</span>
        </button>
      </nav>

      {/* Doa Detail Modal */}
      <AnimatePresence>
        {selectedDoa && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm p-4",
              darkMode ? "bg-black/60" : "bg-emerald-950/20"
            )}
            onClick={() => setSelectedDoa(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "w-full max-w-md rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative",
                darkMode ? "bg-[#1a202c] border-t border-x border-gray-800" : "bg-white"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Handle */}
              <div className={cn(
                "absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full",
                darkMode ? "bg-gray-800" : "bg-emerald-100"
              )} />
              
              <div className="flex justify-between items-start mb-8 mt-2">
                <div>
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border",
                    darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/50" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  )}>
                    {selectedDoa.category}
                  </span>
                  <h2 className={cn(
                    "text-2xl font-bold mt-2",
                    darkMode ? "text-gray-100" : "text-emerald-900"
                  )}>{selectedDoa.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedDoa(null)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    darkMode ? "bg-gray-800 text-gray-400 hover:text-gray-200" : "bg-emerald-50 text-emerald-400 hover:bg-emerald-100"
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Arabic Text */}
                <div className="text-right">
                  <p className={cn(
                    "font-arabic text-4xl md:text-5xl leading-[2] dir-rtl tracking-normal",
                    darkMode ? "text-emerald-400" : "text-emerald-950"
                  )}>
                    {selectedDoa.arabic}
                  </p>
                </div>

                {/* Latin Transliteration */}
                <div className={cn(
                  "p-6 rounded-3xl border-l-4",
                  darkMode 
                    ? "bg-emerald-900/10 border-emerald-500/30" 
                    : "bg-emerald-50/30 border-emerald-200"
                )}>
                  <h4 className={cn(
                    "text-[9px] font-bold uppercase tracking-[0.2em] mb-2 opacity-60",
                    darkMode ? "text-emerald-500" : "text-emerald-600"
                  )}>Transliterasi</h4>
                  <p className={cn(
                    "italic font-medium leading-relaxed text-lg",
                    darkMode ? "text-emerald-100/90" : "text-emerald-800"
                  )}>
                    "{selectedDoa.latin}"
                  </p>
                </div>

                {/* Translation */}
                <div className="px-2">
                  <h4 className={cn(
                    "text-[9px] font-bold uppercase tracking-[0.2em] mb-3 opacity-60",
                    darkMode ? "text-emerald-700" : "text-emerald-400"
                  )}>Artinya</h4>
                  <p className={cn(
                    "leading-relaxed font-medium text-base",
                    darkMode ? "text-gray-300" : "text-emerald-900/80"
                  )}>
                    {selectedDoa.translation}
                  </p>
                </div>

                {/* Source & Notes */}
                {(selectedDoa.source || selectedDoa.notes) && (
                  <div className="px-2 space-y-4">
                    {selectedDoa.source && (
                      <div>
                        <h4 className={cn(
                          "text-[9px] font-bold uppercase tracking-[0.2em] mb-1 opacity-60",
                          darkMode ? "text-emerald-700" : "text-emerald-400"
                        )}>Sumber</h4>
                        <p className={cn(
                          "text-xs font-medium italic",
                          darkMode ? "text-emerald-500/70" : "text-emerald-600/70"
                        )}>
                          {selectedDoa.source}
                        </p>
                      </div>
                    )}
                    {selectedDoa.notes && (
                      <div className={cn(
                        "p-4 rounded-2xl border border-dashed",
                        darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
                      )}>
                        <h4 className={cn(
                          "text-[9px] font-bold uppercase tracking-[0.2em] mb-2 opacity-60",
                          darkMode ? "text-gray-500" : "text-gray-400"
                        )}>Keterangan</h4>
                        <p className={cn(
                          "text-xs leading-relaxed",
                          darkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {selectedDoa.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Audio Player */}
                {(audioDuration > 0 || isAudioLoading) && (
                  <div className={cn(
                    "p-6 rounded-3xl border",
                    darkMode ? "bg-emerald-900/10 border-emerald-900/20" : "bg-emerald-50/50 border-emerald-100/50"
                  )}>
                    <div className="flex items-center gap-4 mb-4">
                      <button 
                        onClick={() => handlePlayAudio(selectedDoa)}
                        className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                      >
                        {isAudioLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause size={20} fill="currentColor" />
                        ) : (
                          <Play size={20} className="ml-1" fill="currentColor" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={cn(
                          "flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2",
                          darkMode ? "text-emerald-500" : "text-emerald-600"
                        )}>
                          <span>{formatTime(audioProgress)}</span>
                          <span>{formatTime(audioDuration)}</span>
                        </div>
                        <div className={cn(
                          "h-1.5 w-full rounded-full overflow-hidden",
                          darkMode ? "bg-emerald-900/30" : "bg-emerald-100"
                        )}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                            className="h-full bg-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                 
                  <button 
                    onClick={() => {
                      let text = `${selectedDoa.title}\n\n${selectedDoa.arabic}\n\n${selectedDoa.latin}\n\nArtinya: ${selectedDoa.translation}`;
                      if (selectedDoa.source) text += `\n\nSumber: ${selectedDoa.source}`;
                      if (selectedDoa.notes) text += `\n\nKeterangan: ${selectedDoa.notes}`;
                      copyToClipboard(text);
                    }}
                    className={cn(
                      "p-4 rounded-2xl transition-colors",
                      darkMode ? "bg-gray-800 text-emerald-400 hover:bg-gray-700" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    )}
                    title="Salin Doa"
                  >
                    <Copy size={20} />
                  </button>
                  <button 
                    onClick={handleShareImage}
                    disabled={isGeneratingImage}
                    className={cn(
                      "p-4 rounded-2xl transition-colors disabled:opacity-50",
                      darkMode ? "bg-gray-800 text-emerald-400 hover:bg-gray-700" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    )}
                    title="Simpan sebagai Gambar"
                  >
                    {isGeneratingImage ? (
                      <div className={cn(
                        "w-5 h-5 border-2 rounded-full animate-spin",
                        darkMode ? "border-emerald-400/30 border-t-emerald-400" : "border-emerald-600/30 border-t-emerald-600"
                      )} />
                    ) : (
                      <ImageIcon size={20} />
                    )}
                  </button>
                  <button 
                    onClick={() => handleShare(selectedDoa)}
                    className={cn(
                      "p-4 rounded-2xl transition-colors",
                      darkMode ? "bg-gray-800 text-emerald-400 hover:bg-gray-700" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    )}
                    title="Bagikan Doa"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Story Component for Image Generation */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div 
          ref={storyRef}
          className="w-[1080px] h-[1920px] bg-emerald-50 p-20 flex flex-col justify-between relative overflow-hidden"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-200/30 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-16">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
                <BookOpen size={48} className="text-white" />
              </div>
              <p className="text-emerald-600 font-bold uppercase tracking-[0.4em] text-2xl">Doa Harian</p>
            </div>

            <div className="space-y-12 w-full">
              <h1 className="text-7xl font-black text-emerald-900 leading-tight">
                {selectedDoa?.title}
              </h1>
              
              <div className="h-2 w-32 bg-emerald-200 mx-auto rounded-full" />
            </div>

            <div className="w-full flex-1 flex flex-col justify-center space-y-12 py-10">
              <p 
                className="font-arabic leading-[2] text-emerald-950 dir-rtl px-10 text-center"
                style={{ 
                  fontSize: !selectedDoa?.arabic ? '6rem' : 
                            selectedDoa.arabic.length > 300 ? '3.5rem' :
                            selectedDoa.arabic.length > 200 ? '4.5rem' :
                            selectedDoa.arabic.length > 100 ? '6rem' : '8rem',
                  wordBreak: 'break-word'
                }}
              >
                {selectedDoa?.arabic}
              </p>

              <div className="bg-white/60 backdrop-blur-md p-10 rounded-[60px] border border-emerald-100 shadow-xl w-full">
                <p 
                  className="text-emerald-800 italic font-semibold leading-relaxed mb-8 text-center"
                  style={{
                    fontSize: !selectedDoa?.latin ? '2.5rem' :
                              selectedDoa.latin.length > 300 ? '1.8rem' :
                              selectedDoa.latin.length > 150 ? '2.2rem' : '3rem'
                  }}
                >
                  "{selectedDoa?.latin}"
                </p>
                
                <div className="h-px bg-emerald-100 mb-8" />
                
                <p 
                  className="text-emerald-900 font-bold leading-relaxed text-center"
                  style={{
                    fontSize: !selectedDoa?.translation ? '2.5rem' :
                              selectedDoa.translation.length > 300 ? '1.8rem' :
                              selectedDoa.translation.length > 150 ? '2.2rem' : '3rem'
                  }}
                >
                  {selectedDoa?.translation}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Moon size={24} className="text-white" />
              </div>
              <p className="text-emerald-900 font-black text-3xl tracking-tight">Aplikasi Doa Harian</p>
            </div>
            <p className="text-emerald-400 font-bold text-xl uppercase tracking-widest">Tersedia di Play Store & App Store</p>
          </div>
        </div>
      </div>
    </div>
  );
}
