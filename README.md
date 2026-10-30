# Kana Learning App

An interactive web application designed to help learners master the Japanese writing systems (**Hiragana** & **Katakana**) as well as foundational **JLPT** vocabulary and Kanji. Built with a fast, distraction-free, and accessible user interface, it provides an optimal learning experience on both desktop and mobile devices.

---

## Overview & Key Features

**Kana Learning App** combines visual mnemonics, audio pronunciation cues, and spaced repetition exercises to accelerate Kana acquisition:

- **Interactive Kana Grid & Study Cards**:
  - Full matrix covering _Gojūon_ (basic), _Dakuon_, _Handakuon_, and _Yōon_ (combination) characters.
  - Detailed character cards with visual guides and stroke order demonstrations.
- **Interactive Practice & Quiz Modes**:
  - Multiple-choice quizzes, reading recognition challenges, and flashcard decks.
  - Instant answer evaluation with seamless Romaji-to-Kana input conversion powered by [Wanakana](https://wanakana.com/).
- **JLPT Vocabulary & Kanji Catalog**:
  - Curated vocabulary and characters organized by JLPT proficiency level (N5 through N1).
  - Fast search and filtering by character type, difficulty level, and tags.
- **Local Progress Tracking**:
  - Tracks practice streaks, accuracy metrics, and character mastery directly in local browser storage—no account registration required.
- **Printable Practice Sheets**:
  - Dedicated print layouts designed for offline handwriting and stroke order practice.
  - High-contrast grid templates optimized for standard paper sizes.
- **Dark & Light Mode**:
  - Seamless system-aware theme switching via `next-themes` for comfortable study in any lighting environment.
- **Accessibility & Typography**:
  - Built to WCAG standards with semantic HTML, full keyboard navigation, and authentic Japanese typography using _Noto Serif JP_ and _Geist_.

---

## Tech Stack

The application is built on modern web standards with strict type safety and optimized client-server performance:

| Category              | Technology                                       | Purpose / Role                                                               |
| :-------------------- | :----------------------------------------------- | :--------------------------------------------------------------------------- |
| **Framework**         | [Next.js](https://nextjs.org/) 16 (App Router)   | Full-stack React framework with server rendering & static asset optimization |
| **UI Library**        | [React](https://react.dev/) 19                   | Declarative component architecture                                           |
| **Language**          | [TypeScript](https://www.typescriptlang.org/) v5 | Strict static typing across domain models and components                     |
| **Styling**           | [Tailwind CSS](https://tailwindcss.com/) v4      | Utility-first CSS framework with `@tailwindcss/postcss`                      |
| **UI Primitives**     | [Radix UI](https://www.radix-ui.com/)            | Unstyled, accessible component primitives (Dialog, Slot)                     |
| **Icons & Fonts**     | Lucide React, Noto Serif JP, Geist               | Consistent vector iconography and authentic Japanese typography              |
| **Domain Logic**      | Wanakana (`wanakana`)                            | Romaji, Hiragana, and Katakana phonetic conversion and validation            |
| **Validation & Data** | Zod & Kanji Data                                 | Runtime schema validation and comprehensive Kanji dataset integration        |
| **Unit Testing**      | Vitest                                           | Fast unit and domain logic testing runner                                    |
| **E2E Testing**       | Playwright                                       | Multi-browser end-to-end integration and accessibility test suite            |
| **Code Quality**      | ESLint & Prettier                                | Static code analysis, linting, and automated code formatting                 |

---

## Project Structure

A high-level overview of the repository directory layout:

```text
kana-learning/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD automation pipelines
├── app/                    # Next.js App Router (Pages, Layouts, and API Routes)
│   ├── api/                # API route handlers (cards, decks, etc.)
│   ├── archive/            # Learning material archive pages
│   ├── card/[id]/          # Dynamic routes for individual character cards
│   ├── dashboard/          # User study dashboard and progress summaries
│   ├── deck/               # Flashcard and practice deck interfaces
│   ├── jlpt/               # JLPT vocabulary and Kanji catalog
│   ├── privacy/            # Privacy policy page
│   ├── search/             # Global search across Kana and vocabulary
│   ├── set/[slug]/         # Dynamic character set practice routes
│   ├── sources/            # Data source attributions and references
│   ├── layout.tsx          # Root application layout
│   └── page.tsx            # Home / landing page
├── components/             # Reusable React components
│   ├── platform/           # Feature-specific components (catalog, quiz, print, etc.)
│   └── ui/                 # Atomic UI primitives (button, dialog, sheet, etc.)
├── content/                # Static datasets for Kana, Kanji, and JLPT items
├── docs/                   # Architectural documentation and contribution guidelines
├── lib/                    # Domain logic, Wanakana helpers, data loaders, and types
├── public/                 # Static assets (fonts, icons, images, licenses)
├── scripts/                # Build and content management scripts
│   └── resources/          # Dataset compilation and verification (prepare.ts, check.ts)
├── tests/                  # Automated test suites (Unit, Baseline, E2E, Smoke)
├── eslint.config.mjs       # Modern ESLint configuration
├── package.json            # Project manifest, scripts, and dependencies
├── playwright.config.ts    # Playwright browser testing configuration
├── postcss.config.mjs      # PostCSS configuration for Tailwind CSS v4
├── tsconfig.json           # TypeScript compiler configuration
├── vitest.config.mts       # Vitest frontend testing configuration
└── vitest.domain.config.mts# Vitest configuration for domain logic tests
```

---

## System Requirements

Ensure your development environment meets the following specifications before installing:

- **Node.js**: Version `>= 22.13.0 < 25` (Node.js v22 LTS recommended).
- **Package Manager**: `npm` version `10.9.x` or compatible.
- **Git**: Installed for version control and repository management.

---

## Installation & Local Development Setup

### 1. Clone the Repository

Clone the project repository to your local machine:

```bash
git clone https://github.com/dikawp/kana-learning.git
cd kana-learning
```

### 2. Install Dependencies

Install all required production and development dependencies:

```bash
npm install
```

### 3. Prepare Static Resources (Optional / Recommended)

If you have updated or modified the source files in the `content/` directory, run the resource preparation script to compile the dataset:

```bash
npm run resources:prepare
```

### 4. Start the Development Server

Launch the Next.js local development server:

```bash
npm run dev
```

Open your browser and navigate to:

```text
http://localhost:3000
```

The application supports Hot Module Replacement (HMR); updates made to the source files will reflect immediately in the browser.

---

## Building for Production

To test production performance and compile optimized deployment artifacts:

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm run start
   ```

The production server will listen on `http://localhost:3000` by default.

---

## Available NPM Scripts

The repository includes a comprehensive set of automated scripts to streamline development, testing, and maintenance:

| Command                     | Description                                                                           |
| :-------------------------- | :------------------------------------------------------------------------------------ |
| `npm run dev`               | Launches the Next.js local development server                                         |
| `npm run build`             | Compiles and optimizes the application for production deployment                      |
| `npm run start`             | Runs the production-optimized Next.js server                                          |
| `npm run lint`              | Executes static code analysis with ESLint                                             |
| `npm run typecheck`         | Validates TypeScript types across the entire project without emitting files           |
| `npm run format`            | Automatically formats all source files using Prettier                                 |
| `npm run format:check`      | Verifies code formatting compliance with Prettier rules                               |
| `npm run resources:prepare` | Compiles and generates static resources from raw data files                           |
| `npm run resources:check`   | Validates the integrity and schema of dataset resources                               |
| `npm run test`              | Executes all unit test suites (native baseline, domain, and frontend)                 |
| `npm run test:native`       | Runs native Node.js baseline test runners                                             |
| `npm run test:domain`       | Runs isolated domain and business logic tests via Vitest                              |
| `npm run test:frontend`     | Runs React component and UI tests via Vitest                                          |
| `npm run test:browser`      | Executes end-to-end browser tests across browsers via Playwright                      |
| `npm run test:production`   | Performs production smoke tests against compiled output                               |
| `npm run check`             | Runs the full verification pipeline (format, data audit, tests, lint, typecheck, E2E) |

---

## Testing & Quality Assurance

Maintain code reliability and accessibility before submitting changes by running the automated testing suites:

1. **Run Unit & Domain Tests**:

   ```bash
   npm run test
   ```

2. **Run End-to-End Browser Tests**:
   If running Playwright for the first time, install the required browser binaries:

   ```bash
   npx playwright install --with-deps
   npm run test:browser
   ```

3. **Run the Full Verification Pipeline**:
   ```bash
   npm run check
   ```
   _This command runs formatting checks, dataset validation, unit testing, linting, TypeScript type checking, and full browser E2E tests in sequence._

---

## License & Credits

Developed by [dikawp](https://github.com/dikawp). Please refer to the repository license file for terms regarding usage, distribution, and code modification.
