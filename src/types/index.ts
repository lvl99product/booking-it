export interface Book {
  id: string;
  title: string;
  author: string;
  coverColor: string; // Hex code or CSS gradient string for visual book cover
  coverUrl?: string;  // URL to external book cover image
  createdAt: number;
  status: 'reading' | 'finished' | 'to-read';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  rating?: number;    // 0 to 5 stars
  thoughts?: string;  // personal notes/review
  currentPage?: number;
  totalPages?: number;
  progressPercent?: number; // 0 to 100
  progressMode?: 'pages' | 'percent';
}

export interface ReadingGoal {
  year: number;
  target: number;
}

export interface Quote {
  id: string;
  bookId: string;
  text: string;
  chapter?: string;
  page?: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
}

export interface AppState {
  books: Book[];
  quotes: Quote[];
}
