export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export async function fetchPrayerTimes(lat: number, lon: number): Promise<PrayerTimes | null> {
  try {
    const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`);
    const data = await response.json();
    if (data.code === 200) {
      const timings = data.data.timings;
      const hijri = data.data.date.hijri;
      return {
        ...timings,
        hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year} H`
      };
    }
  } catch (error) {
    console.error("Error fetching prayer times:", error);
  }
  return null;
}

export async function fetchAddress(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
    const data = await response.json();
    if (data.address) {
      // Try to get subdistrict (kecamatan)
      return data.address.suburb || data.address.village || data.address.town || data.address.city_district || data.address.city || "Lokasi tidak dikenal";
    }
  } catch (error) {
    console.error("Error fetching address:", error);
  }
  return null;
}

export function getNextPrayer(timings: PrayerTimes): { name: string; time: string } {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: 'Subuh', time: timings.Fajr },
    { name: 'Terbit', time: timings.Sunrise },
    { name: 'Dzuhur', time: timings.Dhuhr },
    { name: 'Ashar', time: timings.Asr },
    { name: 'Maghrib', time: timings.Maghrib },
    { name: 'Isya', time: timings.Isha },
  ];

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTime = hours * 60 + minutes;
    if (prayerTime > currentTime) {
      return prayer;
    }
  }

  // If all prayers today have passed, the next one is Fajr tomorrow
  return { name: 'Subuh', time: timings.Fajr };
}

export function getTimeRemaining(prayerTime: string): string {
  const now = new Date();
  const [p_hours, p_minutes] = prayerTime.split(':').map(Number);
  
  const target = new Date();
  target.setHours(p_hours, p_minutes, 0, 0);
  
  // If target time is earlier than now, it must be for tomorrow
  if (target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}j`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

export function checkIsPrayerTime(timings: PrayerTimes): string | null {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  const prayers = [
    { name: 'Subuh', time: timings.Fajr },
    { name: 'Dzuhur', time: timings.Dhuhr },
    { name: 'Ashar', time: timings.Asr },
    { name: 'Maghrib', time: timings.Maghrib },
    { name: 'Isya', time: timings.Isha },
  ];

  const match = prayers.find(p => p.time === currentTime);
  return match ? match.name : null;
}
