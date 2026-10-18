import type { KanaCharacter } from "../types/kana"

export const kanaData = [
  // Hiragana - Basic Vowels
  { id: "h-a", character: "あ", romaji: "a", type: "hiragana" as const, category: "vowels" },
  { id: "h-i", character: "い", romaji: "i", type: "hiragana" as const, category: "vowels" },
  { id: "h-u", character: "う", romaji: "u", type: "hiragana" as const, category: "vowels" },
  { id: "h-e", character: "え", romaji: "e", type: "hiragana" as const, category: "vowels" },
  { id: "h-o", character: "お", romaji: "o", type: "hiragana" as const, category: "vowels" },

  // Hiragana - K sounds
  { id: "h-ka", character: "か", romaji: "ka", type: "hiragana" as const, category: "k-sounds" },
  { id: "h-ki", character: "き", romaji: "ki", type: "hiragana" as const, category: "k-sounds" },
  { id: "h-ku", character: "く", romaji: "ku", type: "hiragana" as const, category: "k-sounds" },
  { id: "h-ke", character: "け", romaji: "ke", type: "hiragana" as const, category: "k-sounds" },
  { id: "h-ko", character: "こ", romaji: "ko", type: "hiragana" as const, category: "k-sounds" },

  // Hiragana - S sounds
  { id: "h-sa", character: "さ", romaji: "sa", type: "hiragana" as const, category: "s-sounds" },
  {
    id: "h-shi",
    character: "し",
    romaji: "shi",
    type: "hiragana" as const,
    category: "s-sounds",
  },
  { id: "h-su", character: "す", romaji: "su", type: "hiragana" as const, category: "s-sounds" },
  { id: "h-se", character: "せ", romaji: "se", type: "hiragana" as const, category: "s-sounds" },
  { id: "h-so", character: "そ", romaji: "so", type: "hiragana" as const, category: "s-sounds" },

  // Hiragana - T sounds
  { id: "h-ta", character: "た", romaji: "ta", type: "hiragana" as const, category: "t-sounds" },
  {
    id: "h-chi",
    character: "ち",
    romaji: "chi",
    type: "hiragana" as const,
    category: "t-sounds",
  },
  {
    id: "h-tsu",
    character: "つ",
    romaji: "tsu",
    type: "hiragana" as const,
    category: "t-sounds",
  },
  { id: "h-te", character: "て", romaji: "te", type: "hiragana" as const, category: "t-sounds" },
  { id: "h-to", character: "と", romaji: "to", type: "hiragana" as const, category: "t-sounds" },

  // Hiragana - N sounds
  { id: "h-na", character: "な", romaji: "na", type: "hiragana" as const, category: "n-sounds" },
  { id: "h-ni", character: "に", romaji: "ni", type: "hiragana" as const, category: "n-sounds" },
  { id: "h-nu", character: "ぬ", romaji: "nu", type: "hiragana" as const, category: "n-sounds" },
  { id: "h-ne", character: "ね", romaji: "ne", type: "hiragana" as const, category: "n-sounds" },
  { id: "h-no", character: "の", romaji: "no", type: "hiragana" as const, category: "n-sounds" },

  // Hiragana - H sounds
  { id: "h-ha", character: "は", romaji: "ha", type: "hiragana" as const, category: "h-sounds" },
  { id: "h-hi", character: "ひ", romaji: "hi", type: "hiragana" as const, category: "h-sounds" },
  { id: "h-fu", character: "ふ", romaji: "fu", type: "hiragana" as const, category: "h-sounds" },
  { id: "h-he", character: "へ", romaji: "he", type: "hiragana" as const, category: "h-sounds" },
  { id: "h-ho", character: "ほ", romaji: "ho", type: "hiragana" as const, category: "h-sounds" },

  // Hiragana - M sounds
  { id: "h-ma", character: "ま", romaji: "ma", type: "hiragana" as const, category: "m-sounds" },
  { id: "h-mi", character: "み", romaji: "mi", type: "hiragana" as const, category: "m-sounds" },
  { id: "h-mu", character: "む", romaji: "mu", type: "hiragana" as const, category: "m-sounds" },
  { id: "h-me", character: "め", romaji: "me", type: "hiragana" as const, category: "m-sounds" },
  { id: "h-mo", character: "も", romaji: "mo", type: "hiragana" as const, category: "m-sounds" },

  // Hiragana - Y sounds
  { id: "h-ya", character: "や", romaji: "ya", type: "hiragana" as const, category: "y-sounds" },
  { id: "h-yu", character: "ゆ", romaji: "yu", type: "hiragana" as const, category: "y-sounds" },
  { id: "h-yo", character: "よ", romaji: "yo", type: "hiragana" as const, category: "y-sounds" },

  // Hiragana - R sounds
  { id: "h-ra", character: "ら", romaji: "ra", type: "hiragana" as const, category: "r-sounds" },
  { id: "h-ri", character: "り", romaji: "ri", type: "hiragana" as const, category: "r-sounds" },
  { id: "h-ru", character: "る", romaji: "ru", type: "hiragana" as const, category: "r-sounds" },
  { id: "h-re", character: "れ", romaji: "re", type: "hiragana" as const, category: "r-sounds" },
  { id: "h-ro", character: "ろ", romaji: "ro", type: "hiragana" as const, category: "r-sounds" },

  // Hiragana - W sounds
  { id: "h-wa", character: "わ", romaji: "wa", type: "hiragana" as const, category: "w-sounds" },
  { id: "h-wo", character: "を", romaji: "wo", type: "hiragana" as const, category: "w-sounds" },

  // Hiragana - N sound
  { id: "h-n", character: "ん", romaji: "n", type: "hiragana" as const, category: "n-sound" },

  // Hiragana - Dakuten G sounds
  {
    id: "h-ga",
    character: "が",
    romaji: "ga",
    type: "hiragana" as const,
    category: "dakuten-g",
  },
  {
    id: "h-gi",
    character: "ぎ",
    romaji: "gi",
    type: "hiragana" as const,
    category: "dakuten-g",
  },
  {
    id: "h-gu",
    character: "ぐ",
    romaji: "gu",
    type: "hiragana" as const,
    category: "dakuten-g",
  },
  {
    id: "h-ge",
    character: "げ",
    romaji: "ge",
    type: "hiragana" as const,
    category: "dakuten-g",
  },
  {
    id: "h-go",
    character: "ご",
    romaji: "go",
    type: "hiragana" as const,
    category: "dakuten-g",
  },

  // Hiragana - Dakuten Z sounds
  {
    id: "h-za",
    character: "ざ",
    romaji: "za",
    type: "hiragana" as const,
    category: "dakuten-z",
  },
  {
    id: "h-ji",
    character: "じ",
    romaji: "ji",
    type: "hiragana" as const,
    category: "dakuten-z",
  },
  {
    id: "h-zu",
    character: "ず",
    romaji: "zu",
    type: "hiragana" as const,
    category: "dakuten-z",
  },
  {
    id: "h-ze",
    character: "ぜ",
    romaji: "ze",
    type: "hiragana" as const,
    category: "dakuten-z",
  },
  {
    id: "h-zo",
    character: "ぞ",
    romaji: "zo",
    type: "hiragana" as const,
    category: "dakuten-z",
  },

  // Hiragana - Dakuten D sounds
  {
    id: "h-da",
    character: "だ",
    romaji: "da",
    type: "hiragana" as const,
    category: "dakuten-d",
  },
  {
    id: "h-dji",
    character: "ぢ",
    romaji: "dji",
    type: "hiragana" as const,
    category: "dakuten-d",
  },
  {
    id: "h-dzu",
    character: "づ",
    romaji: "dzu",
    type: "hiragana" as const,
    category: "dakuten-d",
  },
  {
    id: "h-de",
    character: "で",
    romaji: "de",
    type: "hiragana" as const,
    category: "dakuten-d",
  },
  {
    id: "h-do",
    character: "ど",
    romaji: "do",
    type: "hiragana" as const,
    category: "dakuten-d",
  },

  // Hiragana - Dakuten B sounds
  {
    id: "h-ba",
    character: "ば",
    romaji: "ba",
    type: "hiragana" as const,
    category: "dakuten-b",
  },
  {
    id: "h-bi",
    character: "び",
    romaji: "bi",
    type: "hiragana" as const,
    category: "dakuten-b",
  },
  {
    id: "h-bu",
    character: "ぶ",
    romaji: "bu",
    type: "hiragana" as const,
    category: "dakuten-b",
  },
  {
    id: "h-be",
    character: "べ",
    romaji: "be",
    type: "hiragana" as const,
    category: "dakuten-b",
  },
  {
    id: "h-bo",
    character: "ぼ",
    romaji: "bo",
    type: "hiragana" as const,
    category: "dakuten-b",
  },

  // Hiragana - Handakuten P sounds
  {
    id: "h-pa",
    character: "ぱ",
    romaji: "pa",
    type: "hiragana" as const,
    category: "handakuten-p",
  },
  {
    id: "h-pi",
    character: "ぴ",
    romaji: "pi",
    type: "hiragana" as const,
    category: "handakuten-p",
  },
  {
    id: "h-pu",
    character: "ぷ",
    romaji: "pu",
    type: "hiragana" as const,
    category: "handakuten-p",
  },
  {
    id: "h-pe",
    character: "ぺ",
    romaji: "pe",
    type: "hiragana" as const,
    category: "handakuten-p",
  },
  {
    id: "h-po",
    character: "ぽ",
    romaji: "po",
    type: "hiragana" as const,
    category: "handakuten-p",
  },

  // Hiragana - K combinations
  {
    id: "h-kya",
    character: "きゃ",
    romaji: "kya",
    type: "hiragana" as const,
    category: "k-combinations",
  },
  {
    id: "h-kyu",
    character: "きゅ",
    romaji: "kyu",
    type: "hiragana" as const,
    category: "k-combinations",
  },
  {
    id: "h-kyo",
    character: "きょ",
    romaji: "kyo",
    type: "hiragana" as const,
    category: "k-combinations",
  },

  // Hiragana - S combinations
  {
    id: "h-sha",
    character: "しゃ",
    romaji: "sha",
    type: "hiragana" as const,
    category: "s-combinations",
  },
  {
    id: "h-shu",
    character: "しゅ",
    romaji: "shu",
    type: "hiragana" as const,
    category: "s-combinations",
  },
  {
    id: "h-sho",
    character: "しょ",
    romaji: "sho",
    type: "hiragana" as const,
    category: "s-combinations",
  },

  // Hiragana - T combinations
  {
    id: "h-cha",
    character: "ちゃ",
    romaji: "cha",
    type: "hiragana" as const,
    category: "t-combinations",
  },
  {
    id: "h-chu",
    character: "ちゅ",
    romaji: "chu",
    type: "hiragana" as const,
    category: "t-combinations",
  },
  {
    id: "h-cho",
    character: "ちょ",
    romaji: "cho",
    type: "hiragana" as const,
    category: "t-combinations",
  },

  // Hiragana - N combinations
  {
    id: "h-nya",
    character: "にゃ",
    romaji: "nya",
    type: "hiragana" as const,
    category: "n-combinations",
  },
  {
    id: "h-nyu",
    character: "にゅ",
    romaji: "nyu",
    type: "hiragana" as const,
    category: "n-combinations",
  },
  {
    id: "h-nyo",
    character: "にょ",
    romaji: "nyo",
    type: "hiragana" as const,
    category: "n-combinations",
  },

  // Hiragana - H combinations
  {
    id: "h-hya",
    character: "ひゃ",
    romaji: "hya",
    type: "hiragana" as const,
    category: "h-combinations",
  },
  {
    id: "h-hyu",
    character: "ひゅ",
    romaji: "hyu",
    type: "hiragana" as const,
    category: "h-combinations",
  },
  {
    id: "h-hyo",
    character: "ひょ",
    romaji: "hyo",
    type: "hiragana" as const,
    category: "h-combinations",
  },

  // Hiragana - M combinations
  {
    id: "h-mya",
    character: "みゃ",
    romaji: "mya",
    type: "hiragana" as const,
    category: "m-combinations",
  },
  {
    id: "h-myu",
    character: "みゅ",
    romaji: "myu",
    type: "hiragana" as const,
    category: "m-combinations",
  },
  {
    id: "h-myo",
    character: "みょ",
    romaji: "myo",
    type: "hiragana" as const,
    category: "m-combinations",
  },

  // Hiragana - R combinations
  {
    id: "h-rya",
    character: "りゃ",
    romaji: "rya",
    type: "hiragana" as const,
    category: "r-combinations",
  },
  {
    id: "h-ryu",
    character: "りゅ",
    romaji: "ryu",
    type: "hiragana" as const,
    category: "r-combinations",
  },
  {
    id: "h-ryo",
    character: "りょ",
    romaji: "ryo",
    type: "hiragana" as const,
    category: "r-combinations",
  },

  // Hiragana - G combinations
  {
    id: "h-gya",
    character: "ぎゃ",
    romaji: "gya",
    type: "hiragana" as const,
    category: "g-combinations",
  },
  {
    id: "h-gyu",
    character: "ぎゅ",
    romaji: "gyu",
    type: "hiragana" as const,
    category: "g-combinations",
  },
  {
    id: "h-gyo",
    character: "ぎょ",
    romaji: "gyo",
    type: "hiragana" as const,
    category: "g-combinations",
  },

  // Hiragana - J combinations
  {
    id: "h-ja",
    character: "じゃ",
    romaji: "ja",
    type: "hiragana" as const,
    category: "j-combinations",
  },
  {
    id: "h-ju",
    character: "じゅ",
    romaji: "ju",
    type: "hiragana" as const,
    category: "j-combinations",
  },
  {
    id: "h-jo",
    character: "じょ",
    romaji: "jo",
    type: "hiragana" as const,
    category: "j-combinations",
  },

  // Hiragana - B combinations
  {
    id: "h-bya",
    character: "びゃ",
    romaji: "bya",
    type: "hiragana" as const,
    category: "b-combinations",
  },
  {
    id: "h-byu",
    character: "びゅ",
    romaji: "byu",
    type: "hiragana" as const,
    category: "b-combinations",
  },
  {
    id: "h-byo",
    character: "びょ",
    romaji: "byo",
    type: "hiragana" as const,
    category: "b-combinations",
  },

  // Hiragana - P combinations
  {
    id: "h-pya",
    character: "ぴゃ",
    romaji: "pya",
    type: "hiragana" as const,
    category: "p-combinations",
  },
  {
    id: "h-pyu",
    character: "ぴゅ",
    romaji: "pyu",
    type: "hiragana" as const,
    category: "p-combinations",
  },
  {
    id: "h-pyo",
    character: "ぴょ",
    romaji: "pyo",
    type: "hiragana" as const,
    category: "p-combinations",
  },

  // Katakana - Basic Vowels
  { id: "k-a", character: "ア", romaji: "a", type: "katakana" as const, category: "vowels" },
  { id: "k-i", character: "イ", romaji: "i", type: "katakana" as const, category: "vowels" },
  { id: "k-u", character: "ウ", romaji: "u", type: "katakana" as const, category: "vowels" },
  { id: "k-e", character: "エ", romaji: "e", type: "katakana" as const, category: "vowels" },
  { id: "k-o", character: "オ", romaji: "o", type: "katakana" as const, category: "vowels" },

  // Katakana - K sounds
  { id: "k-ka", character: "カ", romaji: "ka", type: "katakana" as const, category: "k-sounds" },
  { id: "k-ki", character: "キ", romaji: "ki", type: "katakana" as const, category: "k-sounds" },
  { id: "k-ku", character: "ク", romaji: "ku", type: "katakana" as const, category: "k-sounds" },
  { id: "k-ke", character: "ケ", romaji: "ke", type: "katakana" as const, category: "k-sounds" },
  { id: "k-ko", character: "コ", romaji: "ko", type: "katakana" as const, category: "k-sounds" },

  // Katakana - S sounds
  { id: "k-sa", character: "サ", romaji: "sa", type: "katakana" as const, category: "s-sounds" },
  {
    id: "k-shi",
    character: "シ",
    romaji: "shi",
    type: "katakana" as const,
    category: "s-sounds",
  },
  { id: "k-su", character: "ス", romaji: "su", type: "katakana" as const, category: "s-sounds" },
  { id: "k-se", character: "セ", romaji: "se", type: "katakana" as const, category: "s-sounds" },
  { id: "k-so", character: "ソ", romaji: "so", type: "katakana" as const, category: "s-sounds" },

  // Katakana - T sounds
  { id: "k-ta", character: "タ", romaji: "ta", type: "katakana" as const, category: "t-sounds" },
  {
    id: "k-chi",
    character: "チ",
    romaji: "chi",
    type: "katakana" as const,
    category: "t-sounds",
  },
  {
    id: "k-tsu",
    character: "ツ",
    romaji: "tsu",
    type: "katakana" as const,
    category: "t-sounds",
  },
  { id: "k-te", character: "テ", romaji: "te", type: "katakana" as const, category: "t-sounds" },
  { id: "k-to", character: "ト", romaji: "to", type: "katakana" as const, category: "t-sounds" },

  // Katakana - N sounds
  { id: "k-na", character: "ナ", romaji: "na", type: "katakana" as const, category: "n-sounds" },
  { id: "k-ni", character: "ニ", romaji: "ni", type: "katakana" as const, category: "n-sounds" },
  { id: "k-nu", character: "ヌ", romaji: "nu", type: "katakana" as const, category: "n-sounds" },
  { id: "k-ne", character: "ネ", romaji: "ne", type: "katakana" as const, category: "n-sounds" },
  { id: "k-no", character: "ノ", romaji: "no", type: "katakana" as const, category: "n-sounds" },

  // Katakana - H sounds
  { id: "k-ha", character: "ハ", romaji: "ha", type: "katakana" as const, category: "h-sounds" },
  { id: "k-hi", character: "ヒ", romaji: "hi", type: "katakana" as const, category: "h-sounds" },
  { id: "k-fu", character: "フ", romaji: "fu", type: "katakana" as const, category: "h-sounds" },
  { id: "k-he", character: "ヘ", romaji: "he", type: "katakana" as const, category: "h-sounds" },
  { id: "k-ho", character: "ホ", romaji: "ho", type: "katakana" as const, category: "h-sounds" },

  // Katakana - M sounds
  { id: "k-ma", character: "マ", romaji: "ma", type: "katakana" as const, category: "m-sounds" },
  { id: "k-mi", character: "ミ", romaji: "mi", type: "katakana" as const, category: "m-sounds" },
  { id: "k-mu", character: "ム", romaji: "mu", type: "katakana" as const, category: "m-sounds" },
  { id: "k-me", character: "メ", romaji: "me", type: "katakana" as const, category: "m-sounds" },
  { id: "k-mo", character: "モ", romaji: "mo", type: "katakana" as const, category: "m-sounds" },

  // Katakana - Y sounds
  { id: "k-ya", character: "ヤ", romaji: "ya", type: "katakana" as const, category: "y-sounds" },
  { id: "k-yu", character: "ユ", romaji: "yu", type: "katakana" as const, category: "y-sounds" },
  { id: "k-yo", character: "ヨ", romaji: "yo", type: "katakana" as const, category: "y-sounds" },

  // Katakana - R sounds
  { id: "k-ra", character: "ラ", romaji: "ra", type: "katakana" as const, category: "r-sounds" },
  { id: "k-ri", character: "リ", romaji: "ri", type: "katakana" as const, category: "r-sounds" },
  { id: "k-ru", character: "ル", romaji: "ru", type: "katakana" as const, category: "r-sounds" },
  { id: "k-re", character: "レ", romaji: "re", type: "katakana" as const, category: "r-sounds" },
  { id: "k-ro", character: "ロ", romaji: "ro", type: "katakana" as const, category: "r-sounds" },

  // Katakana - W sounds
  { id: "k-wa", character: "ワ", romaji: "wa", type: "katakana" as const, category: "w-sounds" },
  { id: "k-wo", character: "ヲ", romaji: "wo", type: "katakana" as const, category: "w-sounds" },

  // Katakana - N sound
  { id: "k-n", character: "ン", romaji: "n", type: "katakana" as const, category: "n-sound" },

  // Katakana - Dakuten G sounds
  {
    id: "k-ga",
    character: "ガ",
    romaji: "ga",
    type: "katakana" as const,
    category: "dakuten-g",
  },
  {
    id: "k-gi",
    character: "ギ",
    romaji: "gi",
    type: "katakana" as const,
    category: "dakuten-g",
  },
  {
    id: "k-gu",
    character: "グ",
    romaji: "gu",
    type: "katakana" as const,
    category: "dakuten-g",
  },
  {
    id: "k-ge",
    character: "ゲ",
    romaji: "ge",
    type: "katakana" as const,
    category: "dakuten-g",
  },
  {
    id: "k-go",
    character: "ゴ",
    romaji: "go",
    type: "katakana" as const,
    category: "dakuten-g",
  },

  // Katakana - Dakuten Z sounds
  {
    id: "k-za",
    character: "ザ",
    romaji: "za",
    type: "katakana" as const,
    category: "dakuten-z",
  },
  {
    id: "k-ji",
    character: "ジ",
    romaji: "ji",
    type: "katakana" as const,
    category: "dakuten-z",
  },
  {
    id: "k-zu",
    character: "ズ",
    romaji: "zu",
    type: "katakana" as const,
    category: "dakuten-z",
  },
  {
    id: "k-ze",
    character: "ゼ",
    romaji: "ze",
    type: "katakana" as const,
    category: "dakuten-z",
  },
  {
    id: "k-zo",
    character: "ゾ",
    romaji: "zo",
    type: "katakana" as const,
    category: "dakuten-z",
  },

  // Katakana - Dakuten D sounds
  {
    id: "k-da",
    character: "ダ",
    romaji: "da",
    type: "katakana" as const,
    category: "dakuten-d",
  },
  {
    id: "k-dji",
    character: "ヂ",
    romaji: "dji",
    type: "katakana" as const,
    category: "dakuten-d",
  },
  {
    id: "k-dzu",
    character: "ヅ",
    romaji: "dzu",
    type: "katakana" as const,
    category: "dakuten-d",
  },
  {
    id: "k-de",
    character: "デ",
    romaji: "de",
    type: "katakana" as const,
    category: "dakuten-d",
  },
  {
    id: "k-do",
    character: "ド",
    romaji: "do",
    type: "katakana" as const,
    category: "dakuten-d",
  },

  // Katakana - Dakuten B sounds
  {
    id: "k-ba",
    character: "バ",
    romaji: "ba",
    type: "katakana" as const,
    category: "dakuten-b",
  },
  {
    id: "k-bi",
    character: "ビ",
    romaji: "bi",
    type: "katakana" as const,
    category: "dakuten-b",
  },
  {
    id: "k-bu",
    character: "ブ",
    romaji: "bu",
    type: "katakana" as const,
    category: "dakuten-b",
  },
  {
    id: "k-be",
    character: "ベ",
    romaji: "be",
    type: "katakana" as const,
    category: "dakuten-b",
  },
  {
    id: "k-bo",
    character: "ボ",
    romaji: "bo",
    type: "katakana" as const,
    category: "dakuten-b",
  },

  // Katakana - Handakuten P sounds
  {
    id: "k-pa",
    character: "パ",
    romaji: "pa",
    type: "katakana" as const,
    category: "handakuten-p",
  },
  {
    id: "k-pi",
    character: "ピ",
    romaji: "pi",
    type: "katakana" as const,
    category: "handakuten-p",
  },
  {
    id: "k-pu",
    character: "プ",
    romaji: "pu",
    type: "katakana" as const,
    category: "handakuten-p",
  },
  {
    id: "k-pe",
    character: "ペ",
    romaji: "pe",
    type: "katakana" as const,
    category: "handakuten-p",
  },
  {
    id: "k-po",
    character: "ポ",
    romaji: "po",
    type: "katakana" as const,
    category: "handakuten-p",
  },

  // Katakana - K combinations
  {
    id: "k-kya",
    character: "キャ",
    romaji: "kya",
    type: "katakana" as const,
    category: "k-combinations",
  },
  {
    id: "k-kyu",
    character: "キュ",
    romaji: "kyu",
    type: "katakana" as const,
    category: "k-combinations",
  },
  {
    id: "k-kyo",
    character: "キョ",
    romaji: "kyo",
    type: "katakana" as const,
    category: "k-combinations",
  },

  // Katakana - S combinations
  {
    id: "k-sha",
    character: "シャ",
    romaji: "sha",
    type: "katakana" as const,
    category: "s-combinations",
  },
  {
    id: "k-shu",
    character: "シュ",
    romaji: "shu",
    type: "katakana" as const,
    category: "s-combinations",
  },
  {
    id: "k-sho",
    character: "ショ",
    romaji: "sho",
    type: "katakana" as const,
    category: "s-combinations",
  },

  // Katakana - T combinations
  {
    id: "k-cha",
    character: "チャ",
    romaji: "cha",
    type: "katakana" as const,
    category: "t-combinations",
  },
  {
    id: "k-chu",
    character: "チュ",
    romaji: "chu",
    type: "katakana" as const,
    category: "t-combinations",
  },
  {
    id: "k-cho",
    character: "チョ",
    romaji: "cho",
    type: "katakana" as const,
    category: "t-combinations",
  },

  // Katakana - N combinations
  {
    id: "k-nya",
    character: "ニャ",
    romaji: "nya",
    type: "katakana" as const,
    category: "n-combinations",
  },
  {
    id: "k-nyu",
    character: "ニュ",
    romaji: "nyu",
    type: "katakana" as const,
    category: "n-combinations",
  },
  {
    id: "k-nyo",
    character: "ニョ",
    romaji: "nyo",
    type: "katakana" as const,
    category: "n-combinations",
  },

  // Katakana - H combinations
  {
    id: "k-hya",
    character: "ヒャ",
    romaji: "hya",
    type: "katakana" as const,
    category: "h-combinations",
  },
  {
    id: "k-hyu",
    character: "ヒュ",
    romaji: "hyu",
    type: "katakana" as const,
    category: "h-combinations",
  },
  {
    id: "k-hyo",
    character: "ヒョ",
    romaji: "hyo",
    type: "katakana" as const,
    category: "h-combinations",
  },

  // Katakana - M combinations
  {
    id: "k-mya",
    character: "ミャ",
    romaji: "mya",
    type: "katakana" as const,
    category: "m-combinations",
  },
  {
    id: "k-myu",
    character: "ミュ",
    romaji: "myu",
    type: "katakana" as const,
    category: "m-combinations",
  },
  {
    id: "k-myo",
    character: "ミョ",
    romaji: "myo",
    type: "katakana" as const,
    category: "m-combinations",
  },

  // Katakana - R combinations
  {
    id: "k-rya",
    character: "リャ",
    romaji: "rya",
    type: "katakana" as const,
    category: "r-combinations",
  },
  {
    id: "k-ryu",
    character: "リュ",
    romaji: "ryu",
    type: "katakana" as const,
    category: "r-combinations",
  },
  {
    id: "k-ryo",
    character: "リョ",
    romaji: "ryo",
    type: "katakana" as const,
    category: "r-combinations",
  },

  // Katakana - G combinations
  {
    id: "k-gya",
    character: "ギャ",
    romaji: "gya",
    type: "katakana" as const,
    category: "g-combinations",
  },
  {
    id: "k-gyu",
    character: "ギュ",
    romaji: "gyu",
    type: "katakana" as const,
    category: "g-combinations",
  },
  {
    id: "k-gyo",
    character: "ギョ",
    romaji: "gyo",
    type: "katakana" as const,
    category: "g-combinations",
  },

  // Katakana - J combinations
  {
    id: "k-ja",
    character: "ジャ",
    romaji: "ja",
    type: "katakana" as const,
    category: "j-combinations",
  },
  {
    id: "k-ju",
    character: "ジュ",
    romaji: "ju",
    type: "katakana" as const,
    category: "j-combinations",
  },
  {
    id: "k-jo",
    character: "ジョ",
    romaji: "jo",
    type: "katakana" as const,
    category: "j-combinations",
  },

  // Katakana - B combinations
  {
    id: "k-bya",
    character: "ビャ",
    romaji: "bya",
    type: "katakana" as const,
    category: "b-combinations",
  },
  {
    id: "k-byu",
    character: "ビュ",
    romaji: "byu",
    type: "katakana" as const,
    category: "b-combinations",
  },
  {
    id: "k-byo",
    character: "ビョ",
    romaji: "byo",
    type: "katakana" as const,
    category: "b-combinations",
  },

  // Katakana - P combinations
  {
    id: "k-pya",
    character: "ピャ",
    romaji: "pya",
    type: "katakana" as const,
    category: "p-combinations",
  },
  {
    id: "k-pyu",
    character: "ピュ",
    romaji: "pyu",
    type: "katakana" as const,
    category: "p-combinations",
  },
  {
    id: "k-pyo",
    character: "ピョ",
    romaji: "pyo",
    type: "katakana" as const,
    category: "p-combinations",
  },
] satisfies KanaCharacter[]
