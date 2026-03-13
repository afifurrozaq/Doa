export interface InfoItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
}

export async function fetchInfoCarousel(): Promise<InfoItem[]> {
  // Example Google Sheet CSV URL (Replace with your actual published CSV URL)
  // Format: id, title, description, imageUrl, link
  const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-X8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y_8_Y/pub?output=csv';
  
  try {
    // For now, since we don't have a real URL, we'll return mock data 
    // but the structure for fetching is ready.
    // In a real scenario, you would uncomment the fetch block below.
    
    /*
    const response = await fetch(SPREADSHEET_CSV_URL);
    const csvText = await response.text();
    const rows = csvText.split('\n').slice(1); // Skip header
    return rows.map(row => {
      const [id, title, description, imageUrl, link] = row.split(',');
      return { id, title, description, imageUrl, link };
    });
    */

    return [
      {
        id: '1',
        title: 'Ramadhan Kareem',
        description: 'Mari tingkatkan ibadah di bulan suci yang penuh berkah ini.',
        imageUrl: 'https://picsum.photos/seed/ramadhan/800/400',
      },
      {
        id: '2',
        title: 'Zakat Fitrah',
        description: 'Jangan lupa tunaikan kewajiban zakat fitrah sebelum Idul Fitri.',
        imageUrl: 'https://picsum.photos/seed/zakat/800/400',
      },
      {
        id: '3',
        title: 'Iktikaf 10 Hari Terakhir',
        description: 'Kejar malam Lailatul Qadar dengan memperbanyak ibadah di masjid.',
        imageUrl: 'https://picsum.photos/seed/mosque/800/400',
      }
    ];
  } catch (error) {
    console.error("Error fetching info carousel:", error);
    return [];
  }
}
