# Booking It

A mobile-first reading tracker and literary highlight journal built with React, TypeScript, and Vite.

## Features

- **Reading Dashboard:** Track yearly reading goals, daily reading streaks (toggleable with automatic local-midnight reset), and swipe between multiple currently-reading books.
- **Library & Backlog:** Organize books across *Currently Reading*, *Want to Read*, and *Finished* shelves with ratings, reading duration, and personal reviews.
- **Automatic Book Covers:** Fetches cover artwork via the Open Library API with automatic Google Books fallback and gradient cover placeholders.
- **Highlights & Reflections:** Save passages with chapter/page references, reflections, tags, favorites, and a daily quote widget.
- **Local-First Storage:** All data persists in `localStorage` with JSON export/import backups.

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — Start the Vite development server
- `npm run build` — Type-check and build for production
- `npm run preview` — Preview the production build locally
- `npm run lint` — Run Oxlint checks
