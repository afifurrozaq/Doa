import { useState, useEffect } from 'react';
import { PrayerTimes, Location } from '../types';
import { fetchPrayerTimes, checkIsPrayerTime, fetchAddress } from '../services/prayerService';

export function usePrayer(notificationsEnabled: boolean) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(() => {
    const saved = localStorage.getItem('prayer_times');
    return saved ? JSON.parse(saved) : null;
  });
  const [location, setLocation] = useState<Location | null>(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastNotifiedPrayer, setLastNotifiedPrayer] = useState<string | null>(null);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);

  useEffect(() => {
    const getPrayerData = async (lat: number, lon: number) => {
      setIsLoading(true);
      const [times, address] = await Promise.all([
        fetchPrayerTimes(lat, lon),
        fetchAddress(lat, lon)
      ]);
      
      if (times) {
        setPrayerTimes(times);
        localStorage.setItem('prayer_times', JSON.stringify(times));
      }
      
      const loc = { lat, lon, address: address || undefined };
      setLocation(loc);
      localStorage.setItem('user_location', JSON.stringify(loc));
      
      setIsLoading(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(loc);
          getPrayerData(loc.lat, loc.lon);
        },
        () => getPrayerData(-6.2088, 106.8456) // Default Jakarta
      );
    } else {
      getPrayerData(-6.2088, 106.8456);
    }
  }, []);

  useEffect(() => {
    if (!notificationsEnabled || !prayerTimes) return;

    const interval = setInterval(() => {
      const prayerName = checkIsPrayerTime(prayerTimes);
      if (prayerName && prayerName !== lastNotifiedPrayer) {
        setIsAdhanPlaying(true);
        setLastNotifiedPrayer(prayerName);
        
        if (Notification.permission === 'granted') {
          new Notification(`Waktu Solat ${prayerName}`, {
            body: `Sekarang adalah waktu untuk solat ${prayerName}.`,
            icon: 'https://picsum.photos/seed/doa/192/192'
          });
        }
      } else if (!prayerName) {
        setLastNotifiedPrayer(null);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [notificationsEnabled, prayerTimes, lastNotifiedPrayer]);

  return {
    prayerTimes,
    location,
    isLoading,
    isAdhanPlaying,
    setIsAdhanPlaying
  };
}
