# Japanese Kana Learning App

A comprehensive web application for learning Japanese Hiragana and Katakana characters with interactive flashcards, quizzes, and progress tracking.

## Features

- **Flashcard Mode**: Learn characters one by one with spaced repetition
- **Quiz Mode**: Test your knowledge with customizable quizzes
  - Choose between Hiragana, Katakana, or All characters
  - Select number of questions (5-25)
  - Get detailed results and scoring
- **Table View**: Browse all characters organized by category and type
- **Progress Tracking**: Track your learning progress with local storage
- **Dark/Light Mode**: Toggle between themes
- **Mobile Responsive**: Works perfectly on all devices
- **Search & Filter**: Find specific characters or filter by type/category

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - UI component library
- **Lucide React** - Icons
- **next-themes** - Theme switching

## Prerequisites

- Node.js 18+ 
- npm or pnpm package manager

## Local Setup

### Option 1: Using npm (recommended for you)

1. **Clone or download the project files**

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Option 2: Using pnpm (original setup)

1. **Install pnpm globally** (if not already installed)
   \`\`\`bash
   npm install -g pnpm
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Run development server**
   \`\`\`bash
   pnpm dev
   \`\`\`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx        # Root layout with theme provider
│   ├── globals.css       # Global styles
│   └── loading.tsx       # Loading component
├── components/
│   ├── ui/              # shadcn/ui components
│   └── theme-provider.tsx # Theme context provider
├── lib/
│   ├── kana-data.ts     # Complete Kana dataset
│   └── utils.ts         # Utility functions
└── README.md            # This file
\`\`\`

## Data

The app includes a comprehensive dataset of 214 Japanese characters:
- **Hiragana**: Basic characters, dakuten, handakuten variants
- **Katakana**: Basic characters, dakuten, handakuten variants
- **Categories**: Vowels, K-sounds, S-sounds, T-sounds, N-sounds, H-sounds, M-sounds, Y-sounds, R-sounds, W-sounds

## Features in Detail

### Flashcard Mode
- Navigate through characters with previous/next buttons
- Mark characters as learned
- Progress indicator shows completion percentage
- Responsive card design with large, clear characters

### Quiz Mode
- Pre-quiz setup to choose type and question count
- Multiple choice questions with 4 options
- Real-time scoring and progress tracking
- Detailed results screen with review of all answers
- Option to restart or switch to flashcards for practice

### Table View
- Traditional Kana chart layout
- Organized by categories (vowels, consonants)
- Separate sections for Hiragana and Katakana
- Clean table format with character and romanji

### Progress Tracking
- Automatic saving to browser's local storage
- Persistent across sessions
- Visual indicators for learned characters
- Progress statistics in each mode

## Customization

The app uses Tailwind CSS for styling and can be easily customized:
- Colors: Modify the color scheme in `globals.css`
- Layout: Adjust spacing and sizing with Tailwind classes
- Data: Add more characters or modify existing ones in `lib/kana-data.ts`

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.
