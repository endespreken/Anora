export const TRIVIA_ID = [
  {
    question: "Siapakah presiden pertama Indonesia?",
    correct: "Soekarno",
    incorrect: ["Soeharto", "B.J. Habibie", "Megawati Soekarnoputri"],
    category: "Sejarah",
    difficulty: "Mudah"
  },
  {
    question: "Apa ibu kota dari provinsi Jawa Barat?",
    correct: "Bandung",
    incorrect: ["Semarang", "Surabaya", "Jakarta"],
    category: "Geografi",
    difficulty: "Mudah"
  },
  {
    question: "Gunung tertinggi di pulau Jawa adalah?",
    correct: "Gunung Semeru",
    incorrect: ["Gunung Merapi", "Gunung Bromo", "Gunung Rinjani"],
    category: "Geografi",
    difficulty: "Sedang"
  },
  {
    question: "Apa nama mata uang negara Jepang?",
    correct: "Yen",
    incorrect: ["Won", "Yuan", "Ringgit"],
    category: "Umum",
    difficulty: "Mudah"
  },
  {
    question: "Candi Borobudur merupakan candi bercorak agama?",
    correct: "Buddha",
    incorrect: ["Hindu", "Islam", "Kristen"],
    category: "Sejarah",
    difficulty: "Mudah"
  },
  {
    question: "Berapa hasil dari 15 x 6?",
    correct: "90",
    incorrect: ["75", "80", "100"],
    category: "Matematika",
    difficulty: "Mudah"
  },
  {
    question: "Planet manakah yang dikenal sebagai Planet Merah?",
    correct: "Mars",
    incorrect: ["Venus", "Jupiter", "Saturnus"],
    category: "Sains",
    difficulty: "Sedang"
  },
  {
    question: "Siapakah pahlawan wanita dari Aceh yang terkenal gigih melawan Belanda?",
    correct: "Cut Nyak Dien",
    incorrect: ["R.A. Kartini", "Cut Meutia", "Martha Christina Tiahahu"],
    category: "Sejarah",
    difficulty: "Sedang"
  },
  {
    question: "Apa nama benua terluas di dunia?",
    correct: "Asia",
    incorrect: ["Afrika", "Amerika Utara", "Eropa"],
    category: "Geografi",
    difficulty: "Mudah"
  },
  {
    question: "Alat pernapasan pada ikan adalah?",
    correct: "Insang",
    incorrect: ["Paru-paru", "Trakea", "Kulit"],
    category: "Sains",
    difficulty: "Mudah"
  },
  {
    question: "Binatang apakah yang dapat tidur sambil berdiri?",
    correct: "Kuda",
    incorrect: ["Sapi", "Kambing", "Gajah"],
    category: "Sains",
    difficulty: "Sedang"
  },
  {
    question: "Tokoh utama dalam anime Naruto adalah?",
    correct: "Naruto Uzumaki",
    incorrect: ["Sasuke Uchiha", "Kakashi Hatake", "Sakura Haruno"],
    category: "Hiburan",
    difficulty: "Mudah"
  },
  {
    question: "Berapa jumlah provinsi di Indonesia saat awal kemerdekaan?",
    correct: "8",
    incorrect: ["10", "12", "15"],
    category: "Sejarah",
    difficulty: "Sulit"
  },
  {
    question: "Penemu lampu pijar adalah?",
    correct: "Thomas Alva Edison",
    incorrect: ["Albert Einstein", "Isaac Newton", "Nikola Tesla"],
    category: "Sejarah",
    difficulty: "Sedang"
  },
  {
    question: "Apa kepanjangan dari 'www' pada alamat website?",
    correct: "World Wide Web",
    incorrect: ["World Web Wide", "Web World Wide", "Wide World Web"],
    category: "Teknologi",
    difficulty: "Sedang"
  }
];

export const getRandomTrivia = () => {
  const randomIndex = Math.floor(Math.random() * TRIVIA_ID.length);
  return TRIVIA_ID[randomIndex];
};
