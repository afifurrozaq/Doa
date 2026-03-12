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

export const DOA_DATA: Doa[] = [
  {
    id: "1",
    title: "Doa Sebelum Makan",
    arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ",
    latin: "Allahumma baarik lanaa fiimaa razaqtanaa wa qinaa 'adzaaban naar.",
    translation: "Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami dan peliharalah kami dari siksa api neraka.",
    category: "Harian"
  },
  {
    id: "2",
    title: "Doa Sesudah Makan",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    latin: "Alhamdu lillahil ladzii ath'amanaa wa saqaanaa wa ja'alanaa muslimiin.",
    translation: "Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami muslim.",
    category: "Harian"
  },
  {
    id: "3",
    title: "Doa Sebelum Tidur",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    latin: "Bismika Allahumma amuutu wa ahyaa.",
    translation: "Dengan nama-Mu ya Allah, aku mati dan aku hidup.",
    category: "Harian"
  },
  {
    id: "4",
    title: "Doa Bangun Tidur",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    latin: "Alhamdu lillahil ladzii ahyaanaa ba'da maa amaatanaa wa ilaihin nusyuur.",
    translation: "Segala puji bagi Allah yang telah menghidupkan kami sesudah mematikan kami (tidur) dan kepada-Nya kami kembali.",
    category: "Harian"
  },
  {
    id: "5",
    title: "Doa Masuk Masjid",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    latin: "Allahummaftah lii abwaaba rahmatik.",
    translation: "Ya Allah, bukakanlah bagiku pintu-pintu rahmat-Mu.",
    category: "Ibadah"
  },
  {
    id: "6",
    title: "Doa Keluar Masjid",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    latin: "Allahumma innii as-aluka min fadhlik.",
    translation: "Ya Allah, sesungguhnya aku memohon keutamaan dari-Mu.",
    category: "Ibadah"
  },
  {
    id: "7",
    title: "Doa Kedua Orang Tua",
    arabic: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    latin: "Rabbighfir lii wa liwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa.",
    translation: "Ya Tuhanku, ampunilah dosaku dan dosa kedua orang tuaku, dan sayangilah mereka sebagaimana mereka menyayangiku di waktu kecil.",
    category: "Keluarga"
  },
  {
    id: "8",
    title: "Doa Kebaikan Dunia Akhirat",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    latin: "Rabbanaa aatinaa fid dunyaa hasanatan wa fil aakhirati hasanatan wa qinaa 'adzaaban naar.",
    translation: "Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan peliharalah kami dari siksa api neraka.",
    category: "Umum"
  }
];
