export const TEBAK_KATA_ID = [
  { clue: "Ibukota Indonesia", answer: "JAKARTA" },
  { clue: "Mata Uang Indonesia", answer: "RUPIAH" },
  { clue: "Presiden Pertama Indonesia", answer: "SOEKARNO" },
  { clue: "Benda langit bercahaya di malam hari", answer: "BINTANG" },
  { clue: "Hewan yang memiliki belalai", answer: "GAJAH" },
  { clue: "Pulau dewata", answer: "BALI" },
  { clue: "Alat musik yang dipetik", answer: "GITAR" },
  { clue: "Minuman berwarna hitam dan pahit", answer: "KOPI" },
  { clue: "Warna bendera Indonesia bagian atas", answer: "MERAH" },
  { clue: "Sistem operasi komputer dari Microsoft", answer: "WINDOWS" },
  { clue: "Benua terbesar di dunia", answer: "ASIA" },
  { clue: "Alat pernapasan pada ikan", answer: "INSANG" },
  { clue: "Rasa air laut", answer: "ASIN" },
  { clue: "Hewan peliharaan yang bisa mengeong", answer: "KUCING" },
  { clue: "Bunga nasional Jepang", answer: "SAKURA" },
  { clue: "Kendaraan beroda dua bermesin", answer: "SEPEDA MOTOR" },
  { clue: "Planet yang kita tinggali", answer: "BUMI" },
  { clue: "Tempat menyimpan uang", answer: "BANK" },
  { clue: "Ibukota provinsi Jawa Barat", answer: "BANDUNG" },
  { clue: "Bahan bakar kendaraan bermotor", answer: "BENSIN" }
];

// Fungsi untuk menyensor huruf
// Contoh: JAKARTA -> J _ K _ _ T A
export const generateTebakKata = () => {
  const randomIndex = Math.floor(Math.random() * TEBAK_KATA_ID.length);
  const data = TEBAK_KATA_ID[randomIndex];
  const answerArr = data.answer.split('');
  
  // Tentukan berapa huruf yang akan disensor (sekitar 50-60%)
  const charsToHide = Math.max(1, Math.floor(answerArr.length * 0.5));
  let hiddenIndices = new Set();
  
  while (hiddenIndices.size < charsToHide) {
    const rIndex = Math.floor(Math.random() * answerArr.length);
    // Jangan sensor karakter spasi
    if (answerArr[rIndex] !== ' ') {
      hiddenIndices.add(rIndex);
    }
  }

  const censoredArr = answerArr.map((char, index) => {
    if (char === ' ') return '  '; // Spasi lebih lebar
    if (hiddenIndices.has(index)) return '_';
    return char;
  });

  return {
    clue: data.clue,
    answer: data.answer,
    censored: censoredArr.join(' ') // Spasi antar huruf agar jelas
  };
};
