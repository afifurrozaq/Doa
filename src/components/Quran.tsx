import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Book, ChevronRight, Play, Pause, X, Info, Volume2, ArrowLeft, WifiOff, Download, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: {
    [key: string]: string;
  };
}

interface Ayat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  teksTajweed?: string;
  audio: {
    [key: string]: string;
  };
}

interface SurahDetail extends Surah {
  ayat: Ayat[];
}

interface QuranProps {
  darkMode: boolean;
}

const TajweedAyat: React.FC<{ text: string; darkMode: boolean }> = ({ text, darkMode }) => {
  // Al Quran Cloud Tajweed markers:
  // [h] = Ghunnah (Red)
  // [i] = Ikhfa (Orange)
  // [j] = Idgham (Green)
  // [q] = Qalqalah (Blue)
  // [m] = Mad (Purple)
  
  // The API actually returns HTML-like tags or specific markers depending on the edition.
  // The 'quran-tajweed' edition uses specific Unicode characters or tags.
  // Let's assume it uses the tag format <span class="..."> or specific markers.
  // If it's the 'quran-tajweed' edition, it often uses specific colors in the text itself if rendered as HTML.
  
  // A common way to handle this is to replace the markers with styled spans.
  // For 'quran-tajweed' from api.alquran.cloud, it uses:
  // <phrase class="tajweed-ghunnah">...</phrase> etc.
  
  const parseTajweed = (input: string) => {
    let processed = input;
    
    // 1. Handle Al Quran Cloud <phrase> tags
    const phraseRules = [
      { class: 'tajweed-ghunnah', color: 'text-red-500' },
      { class: 'tajweed-ikhfa', color: 'text-orange-500' },
      { class: 'tajweed-idgham', color: 'text-green-500' },
      { class: 'tajweed-qalqalah', color: 'text-blue-500' },
      { class: 'tajweed-mad', color: 'text-purple-500' },
      { class: 'tajweed-iqlab', color: 'text-amber-500' },
    ];

    phraseRules.forEach(rule => {
      const regex = new RegExp(`<phrase class="${rule.class}">(.*?)</phrase>`, 'g');
      processed = processed.replace(regex, `<span class="${rule.color} font-bold">$1</span>`);
    });

    // 2. Handle bracket markers [h], [i], etc. (common in some editions)
    const bracketRules = [
      { tag: 'h', color: 'text-red-500' },    // Ghunnah
      { tag: 'i', color: 'text-orange-500' }, // Ikhfa
      { tag: 'j', color: 'text-green-500' },  // Idgham
      { tag: 'q', color: 'text-blue-500' },   // Qalqalah
      { tag: 'm', color: 'text-purple-500' }, // Mad
      { tag: 'o', color: 'text-amber-500' },  // Iqlab
    ];

    bracketRules.forEach(rule => {
      const regex = new RegExp(`\\[${rule.tag}\\](.*?)\\[\\/${rule.tag}\\]`, 'g');
      processed = processed.replace(regex, `<span class="${rule.color} font-bold">$1</span>`);
    });

    // 3. Handle the specific [code[text] format (e.g., [h:4[ٱ] or [n[ـٰ])
    // Pattern: [code[content]
    const complexRegex = /\[([a-z0-9:]+)\[([^\]]+)\]/g;
    processed = processed.replace(complexRegex, (match, code, content) => {
      let colorClass = "text-inherit";
      const firstChar = code.charAt(0).toLowerCase();

      switch (firstChar) {
        case 'g': colorClass = "text-red-500"; break; // Ghunnah
        case 'i': colorClass = "text-orange-500"; break; // Ikhfa
        case 'd': 
        case 'j': colorClass = "text-green-500"; break; // Idgham
        case 'q': colorClass = "text-blue-500"; break; // Qalqalah
        case 'm': 
        case 'p':
        case 'n': colorClass = "text-purple-500"; break; // Mad
        case 'l': colorClass = "text-amber-500"; break; // Iqlab
        case 'h': colorClass = "text-gray-400"; break; // Hamzatul Wasl (Muted)
      }

      return `<span class="${colorClass} font-bold">${content}</span>`;
    });

    return processed;
  };

  return (
    <p 
      className={cn(
        "text-4xl font-arabic text-right leading-[2.5] tracking-wide",
        darkMode ? "text-gray-100" : "text-emerald-900"
      )}
      dangerouslySetInnerHTML={{ __html: parseTajweed(text) }}
    />
  );
};

const Quran: React.FC<QuranProps> = ({ darkMode }) => {
  const [view, setView] = useState<'list' | 'detail' | 'juz-detail'>('list');
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');
  const [selectedJuz, setSelectedJuz] = useState<any>(null);
  const [loadingJuz, setLoadingJuz] = useState(false);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cachedSurahs, setCachedSurahs] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showTajweedGuide, setShowTajweedGuide] = useState(false);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    // Load cached surahs list
    const savedSurahs = localStorage.getItem('quran_surahs');
    if (savedSurahs) {
      setSurahs(JSON.parse(savedSurahs));
      setLoading(false);
    }

    // Check which surahs are cached in detail
    const keys = Object.keys(localStorage);
    const cachedIds = keys
      .filter(k => k.startsWith('quran_surah_'))
      .map(k => parseInt(k.replace('quran_surah_', '')));
    setCachedSurahs(cachedIds);

    fetchSurahs();

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const fetchSurahs = async () => {
    if (!navigator.onLine && surahs.length > 0) return;
    
    try {
      const response = await fetch('https://equran.id/api/v2/surat');
      const data = await response.json();
      setSurahs(data.data);
      localStorage.setItem('quran_surahs', JSON.stringify(data.data));
    } catch (error) {
      console.error('Error fetching surahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSurah = async (nomor: number) => {
    setView('detail');
    setLoadingDetail(true);
    
    // Try cache first
    const cached = localStorage.getItem(`quran_surah_${nomor}`);
    if (cached) {
      setSelectedSurah(JSON.parse(cached));
      setLoadingDetail(false);
      // Still fetch in background if online to update
      if (navigator.onLine) {
        fetchSurahDetail(nomor, true);
      }
    } else {
      await fetchSurahDetail(nomor);
    }
  };

  const fetchSurahDetail = async (nomor: number, background = false) => {
    try {
      const response = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
      const data = await response.json();
      const surahData = data.data;

      // Fetch Tajweed data from Al Quran Cloud
      if (navigator.onLine) {
        try {
          const tajweedResponse = await fetch(`https://api.alquran.cloud/v1/surah/${nomor}/quran-tajweed`);
          const tajweedData = await tajweedResponse.json();
          if (tajweedData.code === 200) {
            surahData.ayat = surahData.ayat.map((a: any, index: number) => ({
              ...a,
              teksTajweed: tajweedData.data.ayahs[index].text
            }));
          }
        } catch (e) {
          console.error('Error fetching tajweed:', e);
        }
      }

      setSelectedSurah(surahData);
      localStorage.setItem(`quran_surah_${nomor}`, JSON.stringify(surahData));
      
      if (!cachedSurahs.includes(nomor)) {
        setCachedSurahs(prev => [...prev, nomor]);
      }
    } catch (error) {
      console.error('Error fetching surah detail:', error);
    } finally {
      if (!background) setLoadingDetail(false);
    }
  };

  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.arti.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAudio = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setPlayingAudio(url);
      audio.onended = () => setPlayingAudio(null);
    }
  };

  const openJuz = async (nomor: number) => {
    setView('juz-detail');
    setLoadingJuz(true);
    try {
      const response = await fetch(`https://api.alquran.cloud/v1/juz/${nomor}/quran-tajweed`);
      const data = await response.json();
      setSelectedJuz(data.data);
    } catch (error) {
      console.error('Error fetching juz:', error);
    } finally {
      setLoadingJuz(false);
    }
  };

  const goBack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudio(null);
    }
    setView('list');
    setSelectedSurah(null);
    setSelectedJuz(null);
  };

  if (view === 'juz-detail' && selectedJuz) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col h-full overflow-hidden"
      >
        <header className={cn(
          "px-6 pt-12 pb-6 z-10 border-b",
          darkMode ? "bg-[#1a202c] border-gray-800" : "bg-white border-emerald-50"
        )}>
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={goBack}
              className={cn(
                "p-2 rounded-xl transition-colors",
                darkMode ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h2 className={cn(
                "text-xl font-bold",
                darkMode ? "text-emerald-400" : "text-emerald-900"
              )}>Juz {selectedJuz.number}</h2>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                darkMode ? "text-emerald-600" : "text-emerald-600"
              )}>Total {selectedJuz.ayahs.length} Ayat</p>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-12 p-6 pb-32">
          {selectedJuz.ayahs.map((ayat: any, index: number) => (
            <div key={index} className="space-y-6 group">
              <div className="flex justify-between items-start gap-6">
                <div className={cn(
                  "px-3 py-1 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 border transition-colors",
                  darkMode ? "bg-emerald-900/20 border-emerald-800/30 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                )}>
                  {ayat.surah.name} • {ayat.numberInSurah}
                </div>
                <TajweedAyat text={ayat.text} darkMode={darkMode} />
              </div>
              <div className={cn(
                "h-px w-full opacity-10",
                darkMode ? "bg-emerald-500" : "bg-emerald-900"
              )} />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (view === 'detail' && selectedSurah) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -100) {
            if (selectedSurah.nomor < 114) openSurah(selectedSurah.nomor + 1);
          } else if (info.offset.x > 100) {
            if (selectedSurah.nomor > 1) openSurah(selectedSurah.nomor - 1);
          }
        }}
        className="flex-1 flex flex-col h-full overflow-hidden"
      >
        {/* Detail Header */}
        <header className={cn(
          "px-6 pt-12 pb-6 z-10 border-b",
          darkMode ? "bg-[#1a202c] border-gray-800" : "bg-white border-emerald-50"
        )}>
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={goBack}
              className={cn(
                "p-2 rounded-xl transition-colors",
                darkMode ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="text-center">
              <h2 className={cn(
                "text-xl font-bold",
                darkMode ? "text-emerald-400" : "text-emerald-900"
              )}>{selectedSurah.namaLatin}</h2>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                darkMode ? "text-emerald-600" : "text-emerald-600"
              )}>{selectedSurah.arti} • {selectedSurah.tempatTurun}</p>
            </div>
            <button 
              onClick={() => toggleAudio(selectedSurah.audioFull['03'])}
              className={cn(
                "p-2 rounded-xl transition-colors",
                darkMode ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              )}
            >
              {playingAudio === selectedSurah.audioFull['03'] ? <Pause size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
          
          {/* Info Bar */}
          <div className="flex items-center justify-center gap-4">
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1",
              darkMode ? "bg-emerald-900/20 text-emerald-500" : "bg-emerald-50 text-emerald-600"
            )}>
              <Book size={12} />
              {selectedSurah.jumlahAyat} Ayat
            </div>
            {cachedSurahs.includes(selectedSurah.nomor) && (
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1",
                darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"
              )}>
                <CheckCircle2 size={12} />
                Tersedia Offline
              </div>
            )}
          </div>
        </header>

        {/* Ayat List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-12 p-6 pb-32">
          {/* Bismillah */}
          {selectedSurah.nomor !== 1 && selectedSurah.nomor !== 9 && (
            <div className="text-center py-8">
              <p className={cn(
                "text-4xl font-arabic",
                darkMode ? "text-emerald-400" : "text-emerald-600"
              )}>بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
            </div>
          )}

          {selectedSurah.ayat.map((ayat) => (
            <div key={ayat.nomorAyat} className="space-y-6 group">
              <div className="flex justify-between items-start gap-6">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 border transition-colors",
                  darkMode ? "bg-emerald-900/20 border-emerald-800/30 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                )}>
                  {ayat.nomorAyat}
                </div>
                {ayat.teksTajweed ? (
                  <TajweedAyat text={ayat.teksTajweed} darkMode={darkMode} />
                ) : (
                  <p className={cn(
                    "text-4xl font-arabic text-right leading-[2.5] tracking-wide",
                    darkMode ? "text-gray-100" : "text-emerald-900"
                  )}>
                    {ayat.teksArab}
                  </p>
                )}
              </div>
              <div className="pl-16 space-y-3">
                <p className={cn(
                  "text-xs font-bold italic leading-relaxed",
                  darkMode ? "text-emerald-400/60" : "text-emerald-600/60"
                )}>{ayat.teksLatin}</p>
                <p className={cn(
                  "text-sm leading-relaxed font-medium",
                  darkMode ? "text-gray-400" : "text-gray-600"
                )}>{ayat.teksIndonesia}</p>
              </div>
              <div className={cn(
                "h-px w-full opacity-10",
                darkMode ? "bg-emerald-500" : "bg-emerald-900"
              )} />
            </div>
          ))}
          
          <div className="text-center py-10 space-y-6">
            {/* Tajweed Legend */}
            <div className={cn(
              "p-4 rounded-3xl border text-left max-w-xs mx-auto",
              darkMode ? "bg-gray-800/50 border-gray-700" : "bg-emerald-50/50 border-emerald-100"
            )}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60">Panduan Tajwid</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold">Ghunnah</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-[10px] font-bold">Ikhfa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold">Idgham</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold">Qalqalah</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[10px] font-bold">Mad</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold">Iqlab</span>
                </div>
              </div>
            </div>

            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest",
              darkMode ? "bg-emerald-900/20 text-emerald-500" : "bg-emerald-50 text-emerald-600"
            )}>
              <Info size={14} />
              Akhir Surah {selectedSurah.namaLatin}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-6 pt-12 pb-6 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={cn(
              "text-3xl font-bold tracking-tight",
              darkMode ? "text-emerald-400" : "text-emerald-900"
            )}>
              Al-Quran
            </h1>
            <p className={cn(
              "text-sm font-medium",
              darkMode ? "text-emerald-400/70" : "text-emerald-600/70"
            )}>
              {isOffline ? 'Mode Offline • Akses surah tersimpan' : 'Baca dan dengarkan Al-Quran Digital'}
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border relative",
            darkMode ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/50" : "bg-emerald-100 text-emerald-700 border-emerald-200/50"
          )}>
            <Book size={24} />
            {isOffline && (
              <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white dark:border-gray-900">
                <WifiOff size={10} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('surah')}
            className={cn(
              "flex-1 py-3 rounded-2xl text-xs font-bold transition-all",
              activeTab === 'surah' 
                ? (darkMode ? "bg-emerald-500 text-white" : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20")
                : (darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500")
            )}
          >
            Surah
          </button>
          <button 
            onClick={() => setActiveTab('juz')}
            className={cn(
              "flex-1 py-3 rounded-2xl text-xs font-bold transition-all",
              activeTab === 'juz' 
                ? (darkMode ? "bg-emerald-500 text-white" : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20")
                : (darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500")
            )}
          >
            Juz
          </button>
        </div>

        <div className="relative group">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
            darkMode ? "text-emerald-700 group-focus-within:text-emerald-500" : "text-emerald-400 group-focus-within:text-emerald-600"
          )} size={20} />
          <input 
            type="text" 
            placeholder="Cari Surah..."
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
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
        {activeTab === 'surah' ? (
          <>
            {/* Tajweed Guide Toggle */}
            <div className="mb-6">
          <button 
            onClick={() => setShowTajweedGuide(!showTajweedGuide)}
            className={cn(
              "w-full p-4 rounded-3xl border flex items-center justify-between transition-all",
              darkMode ? "bg-emerald-900/10 border-emerald-800/30 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-700"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center",
                darkMode ? "bg-emerald-900/40" : "bg-emerald-100"
              )}>
                <Info size={16} />
              </div>
              <span className="text-sm font-bold">Panduan Warna Tajwid</span>
            </div>
            <ChevronRight size={18} className={cn(
              "transition-transform",
              showTajweedGuide && "rotate-90"
            )} />
          </button>

          <AnimatePresence>
            {showTajweedGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className={cn(
                  "mt-3 p-5 rounded-3xl border grid grid-cols-2 gap-4",
                  darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-emerald-50 shadow-sm"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/20" />
                    <div>
                      <p className="text-[11px] font-bold leading-none">Ghunnah</p>
                      <p className="text-[9px] opacity-50">Dengung</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-500/20" />
                    <div>
                      <p className="text-[11px] font-bold leading-none">Ikhfa</p>
                      <p className="text-[9px] opacity-50">Samar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/20" />
                    <div>
                      <p className="text-[11px] font-bold leading-none">Idgham</p>
                      <p className="text-[9px] opacity-50">Melebur</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20" />
                    <div>
                      <p className="text-[11px] font-bold leading-none">Qalqalah</p>
                      <p className="text-[9px] opacity-50">Memantul</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm shadow-purple-500/20" />
                    <div>
                      <p className="text-[11px] font-bold leading-none">Mad</p>
                      <p className="text-[9px] opacity-50">Panjang</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" />
                    <div>
                      <p className="text-[11px] font-bold leading-none">Iqlab</p>
                      <p className="text-[9px] opacity-50">Mengganti</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm shadow-gray-400/20" />
                    <div>
                      <p className="text-[11px] font-bold leading-none">Hamzatul Wasl</p>
                      <p className="text-[9px] opacity-50">Muted</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading && surahs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
            <p className={darkMode ? "text-emerald-400" : "text-emerald-600"}>Memuat Al-Quran...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSurahs.map((surah) => (
              <motion.button
                key={surah.nomor}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openSurah(surah.nomor)}
                className={cn(
                  "p-4 rounded-3xl border flex items-center justify-between transition-all group text-left",
                  darkMode ? "bg-[#2d3748] border-gray-700 hover:bg-gray-700" : "bg-white border-emerald-50 hover:bg-emerald-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm relative",
                    darkMode ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {surah.nomor}
                    {cachedSurahs.includes(surah.nomor) && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </div>
                  <div>
                    <h3 className={cn(
                      "font-bold",
                      darkMode ? "text-gray-100" : "text-emerald-900"
                    )}>{surah.namaLatin}</h3>
                    <p className={cn(
                      "text-xs",
                      darkMode ? "text-emerald-700" : "text-emerald-500"
                    )}>{surah.arti} • {surah.jumlahAyat} Ayat</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-2xl font-arabic",
                    darkMode ? "text-emerald-400" : "text-emerald-600"
                  )}>{surah.nama}</span>
                  <ChevronRight size={18} className={cn(
                    darkMode ? "text-emerald-800" : "text-emerald-200"
                  )} />
                </div>
              </motion.button>
            ))}
            
            {filteredSurahs.length === 0 && (
              <div className="text-center py-20">
                <Search size={48} className="mx-auto mb-4 text-emerald-100" />
                <p className="text-gray-500">Surah tidak ditemukan</p>
              </div>
            )}
          </div>
        )}
      </>
    ) : (
      <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
              <motion.button
                key={juz}
                whileTap={{ scale: 0.95 }}
                onClick={() => openJuz(juz)}
                className={cn(
                  "aspect-square rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all",
                  darkMode ? "bg-[#2d3748] border-gray-700 hover:bg-gray-700" : "bg-white border-emerald-50 hover:bg-emerald-50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                  darkMode ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                )}>
                  {juz}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  darkMode ? "text-gray-400" : "text-gray-500"
                )}>Juz</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Detail Overlay */}
      {(loadingDetail || loadingJuz) && (
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
            <p className="text-sm font-bold text-emerald-600">Membuka {loadingJuz ? 'Juz' : 'Surah'}...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quran;
