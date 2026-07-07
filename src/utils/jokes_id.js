export const JOKES_ID = [
  "Kenapa pohon kelapa di depan rumah harus ditebang? Karena kalau dicabut berat.",
  "Hewan apa yang paling hening? Semute.",
  "Kenapa superman bajunya pakai huruf S? Kalau pakai M atau XL kebesaran.",
  "Tahu nggak kenapa donat tengahnya bolong? Karena yang utuh cuma cintaku padamu.",
  "Penyanyi luar negeri yang suka sepedaan? Selena Gowes.",
  "Kenapa matahari tenggelam? Karena dia nggak bisa berenang.",
  "Benda apa yang kalau ditutup jadi tongkat, kalau dibuka jadi tenda? Payung.",
  "Sayur apa yang pintar nyanyi? Kol-play.",
  "Penyanyi yang sering nggak sadar diri? Pingsan Mambo.",
  "Kuman apa yang paling bersih? Kumandi pakai sabun.",
  "Buah apa yang paling rajin? Apel pagi.",
  "Kenapa ayam kalau berkokok matanya merem? Karena udah hafal liriknya.",
  "Sepatu apa yang bisa dipakai masak? Sepatula.",
  "Hewan apa yang bersaudara? Katak beradik.",
  "Kenapa ikan hidup di air tawar? Karena kalau hidup di air asin, nanti dia darah tinggi."
];

export const getRandomJoke = () => {
  const randomIndex = Math.floor(Math.random() * JOKES_ID.length);
  return JOKES_ID[randomIndex];
};
