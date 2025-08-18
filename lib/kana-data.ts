export const kanaData = [
  // Hiragana - Basic Vowels
  { id: "h-a", character: "あ", romanji: "a", type: "hiragana" as const, category: "vowels" },
  { id: "h-i", character: "い", romanji: "i", type: "hiragana" as const, category: "vowels" },
  { id: "h-u", character: "う", romanji: "u", type: "hiragana" as const, category: "vowels" },
  { id: "h-e", character: "え", romanji: "e", type: "hiragana" as const, category: "vowels" },
  { id: "h-o", character: "お", romanji: "o", type: "hiragana" as const, category: "vowels" },

  // Hiragana - K sounds
  { id: "h-ka", character: "か", romanji: "ka", type: "hiragana" as const, category: "k-sounds" },
  { id: "h-ki", character: "き", romanji: "ki", type: "hiragana" as const, category: "k-sounds" },
  { id: "h-ku", character: "く", romanji: "ku", type: "hiragana" as const, category: "k-sounds" },
  { id: "h-ke", character: "け", romanji: "ke", type: "hiragana" as const, category: "k-sounds" },
  { id: "h-ko", character: "こ", romanji: "ko", type: "hiragana" as const, category: "k-sounds" },

  // Hiragana - S sounds
  { id: "h-sa", character: "さ", romanji: "sa", type: "hiragana" as const, category: "s-sounds" },
  {
    id: "h-shi",
    character: "し",
    romanji: "shi",
    type: "hiragana" as const,
    category: "s-sounds",
  },
  { id: "h-su", character: "す", romanji: "su", type: "hiragana" as const, category: "s-sounds" },
  { id: "h-se", character: "せ", romanji: "se", type: "hiragana" as const, category: "s-sounds" },
  { id: "h-so", character: "そ", romanji: "so", type: "hiragana" as const, category: "s-sounds" },

  // Hiragana - T sounds
  { id: "h-ta", character: "た", romanji: "ta", type: "hiragana" as const, category: "t-sounds" },
  {
    id: "h-chi",
    character: "ち",
    romanji: "chi",
    type: "hiragana" as const,
    category: "t-sounds",
  },
  {
    id: "h-tsu",
    character: "つ",
    romanji: "tsu",
    type: "hiragana" as const,
    category: "t-sounds",
  },
  { id: "h-te", character: "て", romanji: "te", type: "hiragana" as const, category: "t-sounds" },
  { id: "h-to", character: "と", romanji: "to", type: "hiragana" as const, category: "t-sounds" },

  // Hiragana - N sounds
  { id: "h-na", character: "な", romanji: "na", type: "hiragana" as const, category: "n-sounds" },
  { id: "h-ni", character: "に", romanji: "ni", type: "hiragana" as const, category: "n-sounds" },
  { id: "h-nu", character: "ぬ", romanji: "nu", type: "hiragana" as const, category: "n-sounds" },
  { id: "h-ne", character: "ね", romanji: "ne", type: "hiragana" as const, category: "n-sounds" },
  { id: "h-no", character: "の", romanji: "no", type: "hiragana" as const, category: "n-sounds" },

  // Hiragana - H sounds
  { id: "h-ha", character: "は", romanji: "ha", type: "hiragana" as const, category: "h-sounds" },
  { id: "h-hi", character: "ひ", romanji: "hi", type: "hiragana" as const, category: "h-sounds" },
  { id: "h-fu", character: "ふ", romanji: "fu", type: "hiragana" as const, category: "h-sounds" },
  { id: "h-he", character: "へ", romanji: "he", type: "hiragana" as const, category: "h-sounds" },
  { id: "h-ho", character: "ほ", romanji: "ho", type: "hiragana" as const, category: "h-sounds" },

  // Hiragana - M sounds
  { id: "h-ma", character: "ま", romanji: "ma", type: "hiragana" as const, category: "m-sounds" },
  { id: "h-mi", character: "み", romanji: "mi", type: "hiragana" as const, category: "m-sounds" },
  { id: "h-mu", character: "む", romanji: "mu", type: "hiragana" as const, category: "m-sounds" },
  { id: "h-me", character: "め", romanji: "me", type: "hiragana" as const, category: "m-sounds" },
  { id: "h-mo", character: "も", romanji: "mo", type: "hiragana" as const, category: "m-sounds" },

  // Hiragana - Y sounds
  { id: "h-ya", character: "や", romanji: "ya", type: "hiragana" as const, category: "y-sounds" },
  { id: "h-yu", character: "ゆ", romanji: "yu", type: "hiragana" as const, category: "y-sounds" },
  { id: "h-yo", character: "よ", romanji: "yo", type: "hiragana" as const, category: "y-sounds" },

  // Hiragana - R sounds
  { id: "h-ra", character: "ら", romanji: "ra", type: "hiragana" as const, category: "r-sounds" },
  { id: "h-ri", character: "り", romanji: "ri", type: "hiragana" as const, category: "r-sounds" },
  { id: "h-ru", character: "る", romanji: "ru", type: "hiragana" as const, category: "r-sounds" },
  { id: "h-re", character: "れ", romanji: "re", type: "hiragana" as const, category: "r-sounds" },
  { id: "h-ro", character: "ろ", romanji: "ro", type: "hiragana" as const, category: "r-sounds" },

  // Hiragana - W sounds
  { id: "h-wa", character: "わ", romanji: "wa", type: "hiragana" as const, category: "w-sounds" },
  { id: "h-wo", character: "を", romanji: "wo", type: "hiragana" as const, category: "w-sounds" },

  // Hiragana - N sound
  { id: "h-n", character: "ん", romanji: "n", type: "hiragana" as const, category: "n-sound" },

  // Hiragana - Dakuten G sounds
  {
    id: "h-ga",
    character: "が",
    romanji: "ga",
    type: "hiragana" as const,
    category: "dakuten-g",
  },
  {
    id: "h-gi",
    character: "ぎ",
    romanji: "gi",
    type: "hiragana" as const,
    category: "dakuten-g",
  },
  {
    id: "h-gu",
    character: "ぐ",
    romanji: "gu",
    type: "hiragana" as const,
    category: "dakuten-g",
  },
  {
    id: "h-ge",
    character: "げ",
    romanji: "ge",
    type: "hiragana" as const,
    category: "dakuten-g",
  },
  {
    id: "h-go",
    character: "ご",
    romanji: "go",
    type: "hiragana" as const,
    category: "dakuten-g",
  },

  // Hiragana - Dakuten Z sounds
  {
    id: "h-za",
    character: "ざ",
    romanji: "za",
    type: "hiragana" as const,
    category: "dakuten-z",
  },
  {
    id: "h-ji",
    character: "じ",
    romanji: "ji",
    type: "hiragana" as const,
    category: "dakuten-z",
  },
  {
    id: "h-zu",
    character: "ず",
    romanji: "zu",
    type: "hiragana" as const,
    category: "dakuten-z",
  },
  {
    id: "h-ze",
    character: "ぜ",
    romanji: "ze",
    type: "hiragana" as const,
    category: "dakuten-z",
  },
  {
    id: "h-zo",
    character: "ぞ",
    romanji: "zo",
    type: "hiragana" as const,
    category: "dakuten-z",
  },

  // Hiragana - Dakuten D sounds
  {
    id: "h-da",
    character: "だ",
    romanji: "da",
    type: "hiragana" as const,
    category: "dakuten-d",
  },
  {
    id: "h-dji",
    character: "ぢ",
    romanji: "dji",
    type: "hiragana" as const,
    category: "dakuten-d",
  },
  {
    id: "h-dzu",
    character: "づ",
    romanji: "dzu",
    type: "hiragana" as const,
    category: "dakuten-d",
  },
  {
    id: "h-de",
    character: "で",
    romanji: "de",
    type: "hiragana" as const,
    category: "dakuten-d",
  },
  {
    id: "h-do",
    character: "ど",
    romanji: "do",
    type: "hiragana" as const,
    category: "dakuten-d",
  },

  // Hiragana - Dakuten B sounds
  {
    id: "h-ba",
    character: "ば",
    romanji: "ba",
    type: "hiragana" as const,
    category: "dakuten-b",
  },
  {
    id: "h-bi",
    character: "び",
    romanji: "bi",
    type: "hiragana" as const,
    category: "dakuten-b",
  },
  {
    id: "h-bu",
    character: "ぶ",
    romanji: "bu",
    type: "hiragana" as const,
    category: "dakuten-b",
  },
  {
    id: "h-be",
    character: "べ",
    romanji: "be",
    type: "hiragana" as const,
    category: "dakuten-b",
  },
  {
    id: "h-bo",
    character: "ぼ",
    romanji: "bo",
    type: "hiragana" as const,
    category: "dakuten-b",
  },

  // Hiragana - Handakuten P sounds
  {
    id: "h-pa",
    character: "ぱ",
    romanji: "pa",
    type: "hiragana" as const,
    category: "handakuten-p",
  },
  {
    id: "h-pi",
    character: "ぴ",
    romanji: "pi",
    type: "hiragana" as const,
    category: "handakuten-p",
  },
  {
    id: "h-pu",
    character: "ぷ",
    romanji: "pu",
    type: "hiragana" as const,
    category: "handakuten-p",
  },
  {
    id: "h-pe",
    character: "ぺ",
    romanji: "pe",
    type: "hiragana" as const,
    category: "handakuten-p",
  },
  {
    id: "h-po",
    character: "ぽ",
    romanji: "po",
    type: "hiragana" as const,
    category: "handakuten-p",
  },

  // Hiragana - K combinations
  {
    id: "h-kya",
    character: "きゃ",
    romanji: "kya",
    type: "hiragana" as const,
    category: "k-combinations",
  },
  {
    id: "h-kyu",
    character: "きゅ",
    romanji: "kyu",
    type: "hiragana" as const,
    category: "k-combinations",
  },
  {
    id: "h-kyo",
    character: "きょ",
    romanji: "kyo",
    type: "hiragana" as const,
    category: "k-combinations",
  },

  // Hiragana - S combinations
  {
    id: "h-sha",
    character: "しゃ",
    romanji: "sha",
    type: "hiragana" as const,
    category: "s-combinations",
  },
  {
    id: "h-shu",
    character: "しゅ",
    romanji: "shu",
    type: "hiragana" as const,
    category: "s-combinations",
  },
  {
    id: "h-sho",
    character: "しょ",
    romanji: "sho",
    type: "hiragana" as const,
    category: "s-combinations",
  },

  // Hiragana - T combinations
  {
    id: "h-cha",
    character: "ちゃ",
    romanji: "cha",
    type: "hiragana" as const,
    category: "t-combinations",
  },
  {
    id: "h-chu",
    character: "ちゅ",
    romanji: "chu",
    type: "hiragana" as const,
    category: "t-combinations",
  },
  {
    id: "h-cho",
    character: "ちょ",
    romanji: "cho",
    type: "hiragana" as const,
    category: "t-combinations",
  },

  // Hiragana - N combinations
  {
    id: "h-nya",
    character: "にゃ",
    romanji: "nya",
    type: "hiragana" as const,
    category: "n-combinations",
  },
  {
    id: "h-nyu",
    character: "にゅ",
    romanji: "nyu",
    type: "hiragana" as const,
    category: "n-combinations",
  },
  {
    id: "h-nyo",
    character: "にょ",
    romanji: "nyo",
    type: "hiragana" as const,
    category: "n-combinations",
  },

  // Hiragana - H combinations
  {
    id: "h-hya",
    character: "ひゃ",
    romanji: "hya",
    type: "hiragana" as const,
    category: "h-combinations",
  },
  {
    id: "h-hyu",
    character: "ひゅ",
    romanji: "hyu",
    type: "hiragana" as const,
    category: "h-combinations",
  },
  {
    id: "h-hyo",
    character: "ひょ",
    romanji: "hyo",
    type: "hiragana" as const,
    category: "h-combinations",
  },

  // Hiragana - M combinations
  {
    id: "h-mya",
    character: "みゃ",
    romanji: "mya",
    type: "hiragana" as const,
    category: "m-combinations",
  },
  {
    id: "h-myu",
    character: "みゅ",
    romanji: "myu",
    type: "hiragana" as const,
    category: "m-combinations",
  },
  {
    id: "h-myo",
    character: "みょ",
    romanji: "myo",
    type: "hiragana" as const,
    category: "m-combinations",
  },

  // Hiragana - R combinations
  {
    id: "h-rya",
    character: "りゃ",
    romanji: "rya",
    type: "hiragana" as const,
    category: "r-combinations",
  },
  {
    id: "h-ryu",
    character: "りゅ",
    romanji: "ryu",
    type: "hiragana" as const,
    category: "r-combinations",
  },
  {
    id: "h-ryo",
    character: "りょ",
    romanji: "ryo",
    type: "hiragana" as const,
    category: "r-combinations",
  },

  // Hiragana - G combinations
  {
    id: "h-gya",
    character: "ぎゃ",
    romanji: "gya",
    type: "hiragana" as const,
    category: "g-combinations",
  },
  {
    id: "h-gyu",
    character: "ぎゅ",
    romanji: "gyu",
    type: "hiragana" as const,
    category: "g-combinations",
  },
  {
    id: "h-gyo",
    character: "ぎょ",
    romanji: "gyo",
    type: "hiragana" as const,
    category: "g-combinations",
  },

  // Hiragana - J combinations
  {
    id: "h-ja",
    character: "じゃ",
    romanji: "ja",
    type: "hiragana" as const,
    category: "j-combinations",
  },
  {
    id: "h-ju",
    character: "じゅ",
    romanji: "ju",
    type: "hiragana" as const,
    category: "j-combinations",
  },
  {
    id: "h-jo",
    character: "じょ",
    romanji: "jo",
    type: "hiragana" as const,
    category: "j-combinations",
  },

  // Hiragana - B combinations
  {
    id: "h-bya",
    character: "びゃ",
    romanji: "bya",
    type: "hiragana" as const,
    category: "b-combinations",
  },
  {
    id: "h-byu",
    character: "びゅ",
    romanji: "byu",
    type: "hiragana" as const,
    category: "b-combinations",
  },
  {
    id: "h-byo",
    character: "びょ",
    romanji: "byo",
    type: "hiragana" as const,
    category: "b-combinations",
  },

  // Hiragana - P combinations
  {
    id: "h-pya",
    character: "ぴゃ",
    romanji: "pya",
    type: "hiragana" as const,
    category: "p-combinations",
  },
  {
    id: "h-pyu",
    character: "ぴゅ",
    romanji: "pyu",
    type: "hiragana" as const,
    category: "p-combinations",
  },
  {
    id: "h-pyo",
    character: "ぴょ",
    romanji: "pyo",
    type: "hiragana" as const,
    category: "p-combinations",
  },

  // Katakana - Basic Vowels
  { id: "k-a", character: "ア", romanji: "a", type: "katakana" as const, category: "vowels" },
  { id: "k-i", character: "イ", romanji: "i", type: "katakana" as const, category: "vowels" },
  { id: "k-u", character: "ウ", romanji: "u", type: "katakana" as const, category: "vowels" },
  { id: "k-e", character: "エ", romanji: "e", type: "katakana" as const, category: "vowels" },
  { id: "k-o", character: "オ", romanji: "o", type: "katakana" as const, category: "vowels" },

  // Katakana - K sounds
  { id: "k-ka", character: "カ", romanji: "ka", type: "katakana" as const, category: "k-sounds" },
  { id: "k-ki", character: "キ", romanji: "ki", type: "katakana" as const, category: "k-sounds" },
  { id: "k-ku", character: "ク", romanji: "ku", type: "katakana" as const, category: "k-sounds" },
  { id: "k-ke", character: "ケ", romanji: "ke", type: "katakana" as const, category: "k-sounds" },
  { id: "k-ko", character: "コ", romanji: "ko", type: "katakana" as const, category: "k-sounds" },

  // Katakana - S sounds
  { id: "k-sa", character: "サ", romanji: "sa", type: "katakana" as const, category: "s-sounds" },
  {
    id: "k-shi",
    character: "シ",
    romanji: "shi",
    type: "katakana" as const,
    category: "s-sounds",
  },
  { id: "k-su", character: "ス", romanji: "su", type: "katakana" as const, category: "s-sounds" },
  { id: "k-se", character: "セ", romanji: "se", type: "katakana" as const, category: "s-sounds" },
  { id: "k-so", character: "ソ", romanji: "so", type: "katakana" as const, category: "s-sounds" },

  // Katakana - T sounds
  { id: "k-ta", character: "タ", romanji: "ta", type: "katakana" as const, category: "t-sounds" },
  {
    id: "k-chi",
    character: "チ",
    romanji: "chi",
    type: "katakana" as const,
    category: "t-sounds",
  },
  {
    id: "k-tsu",
    character: "ツ",
    romanji: "tsu",
    type: "katakana" as const,
    category: "t-sounds",
  },
  { id: "k-te", character: "テ", romanji: "te", type: "katakana" as const, category: "t-sounds" },
  { id: "k-to", character: "ト", romanji: "to", type: "katakana" as const, category: "t-sounds" },

  // Katakana - N sounds
  { id: "k-na", character: "ナ", romanji: "na", type: "katakana" as const, category: "n-sounds" },
  { id: "k-ni", character: "ニ", romanji: "ni", type: "katakana" as const, category: "n-sounds" },
  { id: "k-nu", character: "ヌ", romanji: "nu", type: "katakana" as const, category: "n-sounds" },
  { id: "k-ne", character: "ネ", romanji: "ne", type: "katakana" as const, category: "n-sounds" },
  { id: "k-no", character: "ノ", romanji: "no", type: "katakana" as const, category: "n-sounds" },

  // Katakana - H sounds
  { id: "k-ha", character: "ハ", romanji: "ha", type: "katakana" as const, category: "h-sounds" },
  { id: "k-hi", character: "ヒ", romanji: "hi", type: "katakana" as const, category: "h-sounds" },
  { id: "k-fu", character: "フ", romanji: "fu", type: "katakana" as const, category: "h-sounds" },
  { id: "k-he", character: "ヘ", romanji: "he", type: "katakana" as const, category: "h-sounds" },
  { id: "k-ho", character: "ホ", romanji: "ho", type: "katakana" as const, category: "h-sounds" },

  // Katakana - M sounds
  { id: "k-ma", character: "マ", romanji: "ma", type: "katakana" as const, category: "m-sounds" },
  { id: "k-mi", character: "ミ", romanji: "mi", type: "katakana" as const, category: "m-sounds" },
  { id: "k-mu", character: "ム", romanji: "mu", type: "katakana" as const, category: "m-sounds" },
  { id: "k-me", character: "メ", romanji: "me", type: "katakana" as const, category: "m-sounds" },
  { id: "k-mo", character: "モ", romanji: "mo", type: "katakana" as const, category: "m-sounds" },

  // Katakana - Y sounds
  { id: "k-ya", character: "ヤ", romanji: "ya", type: "katakana" as const, category: "y-sounds" },
  { id: "k-yu", character: "ユ", romanji: "yu", type: "katakana" as const, category: "y-sounds" },
  { id: "k-yo", character: "ヨ", romanji: "yo", type: "katakana" as const, category: "y-sounds" },

  // Katakana - R sounds
  { id: "k-ra", character: "ラ", romanji: "ra", type: "katakana" as const, category: "r-sounds" },
  { id: "k-ri", character: "リ", romanji: "ri", type: "katakana" as const, category: "r-sounds" },
  { id: "k-ru", character: "ル", romanji: "ru", type: "katakana" as const, category: "r-sounds" },
  { id: "k-re", character: "レ", romanji: "re", type: "katakana" as const, category: "r-sounds" },
  { id: "k-ro", character: "ロ", romanji: "ro", type: "katakana" as const, category: "r-sounds" },

  // Katakana - W sounds
  { id: "k-wa", character: "ワ", romanji: "wa", type: "katakana" as const, category: "w-sounds" },
  { id: "k-wo", character: "ヲ", romanji: "wo", type: "katakana" as const, category: "w-sounds" },

  // Katakana - N sound
  { id: "k-n", character: "ン", romanji: "n", type: "katakana" as const, category: "n-sound" },

  // Katakana - Dakuten G sounds
  {
    id: "k-ga",
    character: "ガ",
    romanji: "ga",
    type: "katakana" as const,
    category: "dakuten-g",
  },
  {
    id: "k-gi",
    character: "ギ",
    romanji: "gi",
    type: "katakana" as const,
    category: "dakuten-g",
  },
  {
    id: "k-gu",
    character: "グ",
    romanji: "gu",
    type: "katakana" as const,
    category: "dakuten-g",
  },
  {
    id: "k-ge",
    character: "ゲ",
    romanji: "ge",
    type: "katakana" as const,
    category: "dakuten-g",
  },
  {
    id: "k-go",
    character: "ゴ",
    romanji: "go",
    type: "katakana" as const,
    category: "dakuten-g",
  },

  // Katakana - Dakuten Z sounds
  {
    id: "k-za",
    character: "ザ",
    romanji: "za",
    type: "katakana" as const,
    category: "dakuten-z",
  },
  {
    id: "k-ji",
    character: "ジ",
    romanji: "ji",
    type: "katakana" as const,
    category: "dakuten-z",
  },
  {
    id: "k-zu",
    character: "ズ",
    romanji: "zu",
    type: "katakana" as const,
    category: "dakuten-z",
  },
  {
    id: "k-ze",
    character: "ゼ",
    romanji: "ze",
    type: "katakana" as const,
    category: "dakuten-z",
  },
  {
    id: "k-zo",
    character: "ゾ",
    romanji: "zo",
    type: "katakana" as const,
    category: "dakuten-z",
  },

  // Katakana - Dakuten D sounds
  {
    id: "k-da",
    character: "ダ",
    romanji: "da",
    type: "katakana" as const,
    category: "dakuten-d",
  },
  {
    id: "k-dji",
    character: "ヂ",
    romanji: "dji",
    type: "katakana" as const,
    category: "dakuten-d",
  },
  {
    id: "k-dzu",
    character: "ヅ",
    romanji: "dzu",
    type: "katakana" as const,
    category: "dakuten-d",
  },
  {
    id: "k-de",
    character: "デ",
    romanji: "de",
    type: "katakana" as const,
    category: "dakuten-d",
  },
  {
    id: "k-do",
    character: "ド",
    romanji: "do",
    type: "katakana" as const,
    category: "dakuten-d",
  },

  // Katakana - Dakuten B sounds
  {
    id: "k-ba",
    character: "バ",
    romanji: "ba",
    type: "katakana" as const,
    category: "dakuten-b",
  },
  {
    id: "k-bi",
    character: "ビ",
    romanji: "bi",
    type: "katakana" as const,
    category: "dakuten-b",
  },
  {
    id: "k-bu",
    character: "ブ",
    romanji: "bu",
    type: "katakana" as const,
    category: "dakuten-b",
  },
  {
    id: "k-be",
    character: "ベ",
    romanji: "be",
    type: "katakana" as const,
    category: "dakuten-b",
  },
  {
    id: "k-bo",
    character: "ボ",
    romanji: "bo",
    type: "katakana" as const,
    category: "dakuten-b",
  },

  // Katakana - Handakuten P sounds
  {
    id: "k-pa",
    character: "パ",
    romanji: "pa",
    type: "katakana" as const,
    category: "handakuten-p",
  },
  {
    id: "k-pi",
    character: "ピ",
    romanji: "pi",
    type: "katakana" as const,
    category: "handakuten-p",
  },
  {
    id: "k-pu",
    character: "プ",
    romanji: "pu",
    type: "katakana" as const,
    category: "handakuten-p",
  },
  {
    id: "k-pe",
    character: "ペ",
    romanji: "pe",
    type: "katakana" as const,
    category: "handakuten-p",
  },
  {
    id: "k-po",
    character: "ポ",
    romanji: "po",
    type: "katakana" as const,
    category: "handakuten-p",
  },

  // Katakana - K combinations
  {
    id: "k-kya",
    character: "キャ",
    romanji: "kya",
    type: "katakana" as const,
    category: "k-combinations",
  },
  {
    id: "k-kyu",
    character: "キュ",
    romanji: "kyu",
    type: "katakana" as const,
    category: "k-combinations",
  },
  {
    id: "k-kyo",
    character: "キョ",
    romanji: "kyo",
    type: "katakana" as const,
    category: "k-combinations",
  },

  // Katakana - S combinations
  {
    id: "k-sha",
    character: "シャ",
    romanji: "sha",
    type: "katakana" as const,
    category: "s-combinations",
  },
  {
    id: "k-shu",
    character: "シュ",
    romanji: "shu",
    type: "katakana" as const,
    category: "s-combinations",
  },
  {
    id: "k-sho",
    character: "ショ",
    romanji: "sho",
    type: "katakana" as const,
    category: "s-combinations",
  },

  // Katakana - T combinations
  {
    id: "k-cha",
    character: "チャ",
    romanji: "cha",
    type: "katakana" as const,
    category: "t-combinations",
  },
  {
    id: "k-chu",
    character: "チュ",
    romanji: "chu",
    type: "katakana" as const,
    category: "t-combinations",
  },
  {
    id: "k-cho",
    character: "チョ",
    romanji: "cho",
    type: "katakana" as const,
    category: "t-combinations",
  },

  // Katakana - N combinations
  {
    id: "k-nya",
    character: "ニャ",
    romanji: "nya",
    type: "katakana" as const,
    category: "n-combinations",
  },
  {
    id: "k-nyu",
    character: "ニュ",
    romanji: "nyu",
    type: "katakana" as const,
    category: "n-combinations",
  },
  {
    id: "k-nyo",
    character: "ニョ",
    romanji: "nyo",
    type: "katakana" as const,
    category: "n-combinations",
  },

  // Katakana - H combinations
  {
    id: "k-hya",
    character: "ヒャ",
    romanji: "hya",
    type: "katakana" as const,
    category: "h-combinations",
  },
  {
    id: "k-hyu",
    character: "ヒュ",
    romanji: "hyu",
    type: "katakana" as const,
    category: "h-combinations",
  },
  {
    id: "k-hyo",
    character: "ヒョ",
    romanji: "hyo",
    type: "katakana" as const,
    category: "h-combinations",
  },

  // Katakana - M combinations
  {
    id: "k-mya",
    character: "ミャ",
    romanji: "mya",
    type: "katakana" as const,
    category: "m-combinations",
  },
  {
    id: "k-myu",
    character: "ミュ",
    romanji: "myu",
    type: "katakana" as const,
    category: "m-combinations",
  },
  {
    id: "k-myo",
    character: "ミョ",
    romanji: "myo",
    type: "katakana" as const,
    category: "m-combinations",
  },

  // Katakana - R combinations
  {
    id: "k-rya",
    character: "リャ",
    romanji: "rya",
    type: "katakana" as const,
    category: "r-combinations",
  },
  {
    id: "k-ryu",
    character: "リュ",
    romanji: "ryu",
    type: "katakana" as const,
    category: "r-combinations",
  },
  {
    id: "k-ryo",
    character: "リョ",
    romanji: "ryo",
    type: "katakana" as const,
    category: "r-combinations",
  },

  // Katakana - G combinations
  {
    id: "k-gya",
    character: "ギャ",
    romanji: "gya",
    type: "katakana" as const,
    category: "g-combinations",
  },
  {
    id: "k-gyu",
    character: "ギュ",
    romanji: "gyu",
    type: "katakana" as const,
    category: "g-combinations",
  },
  {
    id: "k-gyo",
    character: "ギョ",
    romanji: "gyo",
    type: "katakana" as const,
    category: "g-combinations",
  },

  // Katakana - J combinations
  {
    id: "k-ja",
    character: "ジャ",
    romanji: "ja",
    type: "katakana" as const,
    category: "j-combinations",
  },
  {
    id: "k-ju",
    character: "ジュ",
    romanji: "ju",
    type: "katakana" as const,
    category: "j-combinations",
  },
  {
    id: "k-jo",
    character: "ジョ",
    romanji: "jo",
    type: "katakana" as const,
    category: "j-combinations",
  },

  // Katakana - B combinations
  {
    id: "k-bya",
    character: "ビャ",
    romanji: "bya",
    type: "katakana" as const,
    category: "b-combinations",
  },
  {
    id: "k-byu",
    character: "ビュ",
    romanji: "byu",
    type: "katakana" as const,
    category: "b-combinations",
  },
  {
    id: "k-byo",
    character: "ビョ",
    romanji: "byo",
    type: "katakana" as const,
    category: "b-combinations",
  },

  // Katakana - P combinations
  {
    id: "k-pya",
    character: "ピャ",
    romanji: "pya",
    type: "katakana" as const,
    category: "p-combinations",
  },
  {
    id: "k-pyu",
    character: "ピュ",
    romanji: "pyu",
    type: "katakana" as const,
    category: "p-combinations",
  },
  {
    id: "k-pyo",
    character: "ピョ",
    romanji: "pyo",
    type: "katakana" as const,
    category: "p-combinations",
  },
]
