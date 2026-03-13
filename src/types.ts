export interface Doa {
  id: string;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  category: string;
  source?: string;
  notes?: string;
}

export interface QuranBookmark {
  surahNomor: number;
  surahNama: string;
  ayatNomor: number;
  timestamp: number;
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  date?: string;
  hijriDate?: string;
}

export interface Location {
  lat: number;
  lon: number;
  address?: string;
}

export interface Bookmark {
  surahNomor: number;
  surahNama: string;
  ayatNomor: number;
}

export type AppTab = 'Home' | 'Prayer' | 'Quran' | 'Favorites' | 'Settings';

export interface AppSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
}
