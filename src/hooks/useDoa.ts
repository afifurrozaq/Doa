import { useState, useEffect, useMemo } from 'react';
import { Doa } from '../types';
import { fetchDoaFromSpreadsheet } from '../services/spreadsheetService';
import { DOA_DATA } from '../constants';

export function useDoa(activeTab: string) {
  const [doaData, setDoaData] = useState<Doa[]>(DOA_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('doa_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('doa_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const loadData = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = await fetchDoaFromSpreadsheet();
        setDoaData(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
        setFetchError(null);
      } catch (err) {
        setFetchError("Gagal sinkronisasi data terbaru");
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    loadData(true);
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('doa_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('doa_history', JSON.stringify(history));
  }, [history]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const addToHistory = (id: string) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item !== id);
      return [id, ...filtered].slice(0, 10);
    });
  };

  const clearHistory = () => setHistory([]);

  const categories = useMemo(() => ['Semua', ...new Set(doaData.map(d => d.category))], [doaData]);

  return {
    doaData,
    isLoading,
    fetchError,
    favorites,
    toggleFavorite,
    history,
    addToHistory,
    clearHistory,
    categories
  };
}
