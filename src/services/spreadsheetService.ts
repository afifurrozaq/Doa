import Papa from 'papaparse';
import { Doa, DOA_DATA } from '../constants';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

const getCsvUrl = () => {
  if (!SHEET_ID) return '';
  
  // Cache busting with timestamp
  const timestamp = new Date().getTime();
  
  // If it's a published ID (starts with 2PACX)
  if (SHEET_ID.startsWith('2PACX')) {
    return `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv&t=${timestamp}`;
  }
  
  // Standard Sheet ID
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&t=${timestamp}`;
};

export const fetchDoaFromSpreadsheet = async (): Promise<Doa[]> => {
  const CSV_URL = getCsvUrl();
  
  // Helper to get cached data
  const getCachedData = () => {
    const cached = localStorage.getItem('cached_doa_data');
    if (cached) {
      try {
        return JSON.parse(cached) as Doa[];
      } catch (e) {
        console.error('Error parsing cached data:', e);
      }
    }
    return DOA_DATA;
  };

  if (!CSV_URL) {
    console.warn('VITE_GOOGLE_SHEET_ID is not set. Using local data.');
    return getCachedData();
  }

  try {
    const fetchWithRetry = async (retries = 2): Promise<Response> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s timeout

      try {
        const response = await fetch(CSV_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (retries > 0 && (err.name === 'AbortError' || err.name === 'TypeError')) {
          console.warn(`Fetch failed, retrying... (${retries} retries left)`);
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchWithRetry(retries - 1);
        }
        throw err;
      }
    };

    const response = await fetchWithRetry();

    if (!response.ok) {
      console.error(`Spreadsheet fetch failed with status: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as any[];
          const seenIds = new Set<string>();
          
          const mappedData: Doa[] = [];
          
          parsedData.forEach((row, index) => {
            let id = row.id || String(index + 1);
            
            // Ensure ID is unique
            if (seenIds.has(id)) {
              id = `${id}_${index}`;
            }
            seenIds.add(id);

            mappedData.push({
              id,
              title: row.title || 'Tanpa Judul',
              arabic: row.arabic || '',
              latin: row.latin || '',
              translation: row.translation || '',
              category: row.category || 'Umum',
              source: row.source || row.sumber || '',
              notes: row.notes || row.keterangan || ''
            });
          });
          
          if (mappedData.length === 0) {
            console.warn('Spreadsheet parsed but returned no data.');
            resolve(getCachedData());
          } else {
            // Cache the successful fetch
            localStorage.setItem('cached_doa_data', JSON.stringify(mappedData));
            resolve(mappedData);
          }
        },
        error: (error: any) => {
          console.error('Error parsing CSV:', error);
          resolve(getCachedData());
        }
      });
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Spreadsheet fetch timed out');
    } else {
      console.error('Error fetching spreadsheet:', error.message || error);
      console.info('Tip: Ensure your Google Sheet is "Published to the web" as CSV and the ID is correct.');
    }
    return getCachedData();
  }
};
