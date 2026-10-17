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

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - UI component library
- **Lucide React** - Icons
- **next-themes** - Theme switching

## Prerequisites

- Node.js 22.13+ within the Node 22 release line (verified with 22.22.0)
- npm (the repository uses `package-lock.json`)

## Local Setup

1. **Clone or download the project files**

2. **Install dependencies**
   ```sh
    npm ci
    ```
   
4. **Run development server**
   ```sh
    npm run dev
    ```
   
6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks without bypassing diagnostics
- `npm test` - Run the kana baseline and read-only recovery contract tests

Use the committed npm lockfile for reproducible installs. Review security updates with `npm audit`; do not apply `npm audit fix --force` without checking compatibility. The implementation progress log records known application diagnostics separately from dependency audit results.

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

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.
