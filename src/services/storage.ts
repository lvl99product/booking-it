import type { Book, Quote } from '../types';

const STORAGE_KEYS = {
  BOOKS: 'booking_it_books',
  QUOTES: 'booking_it_quotes',
  READING_DATES: 'booking_it_reading_dates',
  YEARLY_GOAL: 'booking_it_yearly_goal',
};

// Generates high-quality gradient colors for book covers
const BOOK_COVER_GRADIENTS = [
  'linear-gradient(135deg, #7A9D96 0%, #4D625E 100%)', // Sage / Forest Green
  'linear-gradient(135deg, #C67D5A 0%, #8E4F32 100%)', // Terracotta Clay
  'linear-gradient(135deg, #DFD3C3 0%, #A0937D 100%)', // Cozy Sand / Linen
  'linear-gradient(135deg, #E6BA95 0%, #B88B4A 100%)', // Mustard / Warm Sun
  'linear-gradient(135deg, #8E9B97 0%, #5E6966 100%)', // Eucalyptus Grey
  'linear-gradient(135deg, #D3B4B4 0%, #9F7E7E 100%)', // Dusty Rose
  'linear-gradient(135deg, #7A8B99 0%, #465362 100%)', // Mineral Slate
  'linear-gradient(135deg, #A8B58F 0%, #687256 100%)', // Warm Olive
];

export function getRandomCoverGradient(): string {
  const index = Math.floor(Math.random() * BOOK_COVER_GRADIENTS.length);
  return BOOK_COVER_GRADIENTS[index];
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_BOOKS: Book[] = [
  {
    id: 'book-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverColor: BOOK_COVER_GRADIENTS[1], // Terracotta Clay
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    status: 'reading',
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    thoughts: 'A systems-first approach to identity change and habit stacking. Highly actionable.'
  },
  {
    id: 'book-2',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    coverColor: BOOK_COVER_GRADIENTS[0], // Sage / Forest Green
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    status: 'finished',
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rating: 5,
    thoughts: 'A gold standard of Stoic philosophy. Teaches me resilience, focus, and keeping perspective on outside events.'
  },
  {
    id: 'book-3',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    coverColor: BOOK_COVER_GRADIENTS[5], // Dusty Rose
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    status: 'finished',
    startDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    rating: 4,
    thoughts: 'A charming story filled with deep metaphors. The secret is that only with the heart can one see rightly.'
  },
];

const DEFAULT_QUOTES: Quote[] = [
  {
    id: 'quote-1',
    bookId: 'book-1',
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    chapter: 'Chapter 1',
    page: '27',
    notes: 'A foundational concept. Systems are daily practices that form your identity.',
    tags: ['self-improvement', 'habits', 'systems'],
    isFavorite: true,
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'quote-2',
    bookId: 'book-1',
    text: 'Every action you take is a vote for the type of person you wish to become.',
    chapter: 'Chapter 2',
    page: '34',
    notes: 'Identity change is the north star of habit building.',
    tags: ['self-improvement', 'identity', 'habits'],
    isFavorite: false,
    createdAt: Date.now() - 24 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'quote-3',
    bookId: 'book-2',
    text: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    chapter: 'Book IV',
    page: '45',
    notes: 'Classic Stoic dichotomy of control. Extremely empowering.',
    tags: ['philosophy', 'stoicism', 'mindset'],
    isFavorite: true,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'quote-4',
    bookId: 'book-3',
    text: 'It is only with the heart that one can see rightly; what is essential is invisible to the eye.',
    chapter: 'Chapter 21',
    page: '72',
    notes: 'A beautiful reminder of emotional truth vs superficial appearance.',
    tags: ['philosophy', 'love', 'wisdom'],
    isFavorite: true,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
];

export const storageService = {
  getBooks(): Book[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (!raw) {
      this.saveBooks(DEFAULT_BOOKS);
      return DEFAULT_BOOKS;
    }
    return JSON.parse(raw);
  },

  saveBooks(books: Book[]): void {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  },

  getQuotes(): Quote[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (!raw) {
      this.saveQuotes(DEFAULT_QUOTES);
      return DEFAULT_QUOTES;
    }
    return JSON.parse(raw);
  },

  saveQuotes(quotes: Quote[]): void {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  },

  addBook(title: string, author: string, status: 'reading' | 'finished' | 'to-read' = 'reading', coverColor?: string): Book {
    const books = this.getBooks();
    const newBook: Book = {
      id: `book-${Date.now()}`,
      title,
      author,
      coverColor: coverColor || getRandomCoverGradient(),
      createdAt: Date.now(),
      status,
      startDate: status === 'reading' ? getLocalDateString() : undefined,
    };
    books.unshift(newBook);
    this.saveBooks(books);
    if (status === 'reading') {
      this.logReadingToday();
    }
    return newBook;
  },

  updateBook(updatedBook: Book): void {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === updatedBook.id);
    if (index !== -1) {
      books[index] = updatedBook;
      this.saveBooks(books);
    }
  },

  addQuote(quoteData: Omit<Quote, 'id' | 'createdAt'>): Quote {
    const quotes = this.getQuotes();
    const newQuote: Quote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      createdAt: Date.now(),
    };
    quotes.unshift(newQuote);
    this.saveQuotes(quotes);
    this.logReadingToday();
    return newQuote;
  },

  updateQuote(updatedQuote: Quote): void {
    const quotes = this.getQuotes();
    const index = quotes.findIndex(q => q.id === updatedQuote.id);
    if (index !== -1) {
      quotes[index] = updatedQuote;
      this.saveQuotes(quotes);
    }
  },

  getGoal(year: number): number {
    const raw = localStorage.getItem(`${STORAGE_KEYS.YEARLY_GOAL}_${year}`);
    if (!raw) {
      return 12;
    }
    return parseInt(raw, 10);
  },

  saveGoal(year: number, target: number): void {
    localStorage.setItem(`${STORAGE_KEYS.YEARLY_GOAL}_${year}`, target.toString());
  },

  getReadingHistory(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.READING_DATES);
    if (!raw) {
      const today = getLocalDateString();
      const yesterday = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
      const initial = [yesterday, today];
      this.saveReadingHistory(initial);
      return initial;
    }
    return JSON.parse(raw);
  },

  saveReadingHistory(dates: string[]): void {
    localStorage.setItem(STORAGE_KEYS.READING_DATES, JSON.stringify(dates));
  },

  logReadingToday(): boolean {
    const history = this.getReadingHistory();
    const today = getLocalDateString();
    if (!history.includes(today)) {
      history.push(today);
      this.saveReadingHistory(history);
      return true;
    }
    return false;
  },

  toggleReadingToday(): boolean {
    const history = this.getReadingHistory();
    const today = getLocalDateString();
    if (history.includes(today)) {
      const updated = history.filter(d => d !== today);
      this.saveReadingHistory(updated);
      return false;
    } else {
      history.push(today);
      this.saveReadingHistory(history);
      return true;
    }
  },

  getStreak(): number {
    const history = this.getReadingHistory();
    if (history.length === 0) return 0;
    
    const sortedDates = [...new Set(history)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const todayStr = getLocalDateString();
    const yesterdayStr = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }
    
    let streak = 0;
    let checkDate = new Date(sortedDates[0]);
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const diffTime = Math.abs(checkDate.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        checkDate = date;
      } else {
        break;
      }
    }
    
    return streak;
  },

  deleteQuote(quoteId: string): void {
    const quotes = this.getQuotes();
    const filtered = quotes.filter(q => q.id !== quoteId);
    this.saveQuotes(filtered);
  },

  deleteBook(bookId: string): void {
    const books = this.getBooks();
    const filteredBooks = books.filter(b => b.id !== bookId);
    this.saveBooks(filteredBooks);

    // Delete all associated quotes
    const quotes = this.getQuotes();
    const filteredQuotes = quotes.filter(q => q.bookId !== bookId);
    this.saveQuotes(filteredQuotes);
  },

  toggleFavorite(quoteId: string): Quote | null {
    const quotes = this.getQuotes();
    const index = quotes.findIndex(q => q.id === quoteId);
    if (index !== -1) {
      quotes[index].isFavorite = !quotes[index].isFavorite;
      this.saveQuotes(quotes);
      return quotes[index];
    }
    return null;
  },

  exportData(): string {
    const data = {
      books: this.getBooks(),
      quotes: this.getQuotes(),
      version: '1.0',
      exportedAt: Date.now(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.books) && Array.isArray(data.quotes)) {
        const sanitizedBooks = data.books
          .filter((b: unknown): b is Book => Boolean(b && typeof b === 'object' && 'id' in b && 'title' in b && 'author' in b))
          .map((b: Book) => ({
            ...b,
            coverUrl: typeof b.coverUrl === 'string' && /^https:\/\//i.test(b.coverUrl) ? b.coverUrl : undefined,
          }));
        const sanitizedQuotes = data.quotes.filter(
          (q: unknown): q is Quote => Boolean(q && typeof q === 'object' && 'id' in q && 'bookId' in q && 'text' in q)
        );
        this.saveBooks(sanitizedBooks);
        this.saveQuotes(sanitizedQuotes);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import data', e);
      return false;
    }
  },

  resetToStarter(): void {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.READING_DATES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.YEARLY_GOAL, '12');
  },

  resetToTestData(): void {
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.QUOTES);
    localStorage.removeItem(STORAGE_KEYS.READING_DATES);
    localStorage.removeItem(STORAGE_KEYS.YEARLY_GOAL);
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(getLocalDateString(d));
    }
    localStorage.setItem(STORAGE_KEYS.READING_DATES, JSON.stringify(dates));
  }
};

export interface CuratedQuote {
  id: string;
  text: string;
  bookTitle: string;
  author: string;
}

export const CURATED_LITERARY_QUOTES: CuratedQuote[] = [
  {
    id: 'curated-1',
    text: 'You never really understand a person until you consider things from his point of view... until you climb into his skin and walk around in it.',
    bookTitle: 'To Kill a Mockingbird',
    author: 'Harper Lee'
  },
  {
    id: 'curated-2',
    text: 'Who controls the past controls the future. Who controls the present controls the past.',
    bookTitle: '1984',
    author: 'George Orwell'
  },
  {
    id: 'curated-3',
    text: 'So we beat on, boats against the current, borne back ceaselessly into the past.',
    bookTitle: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald'
  },
  {
    id: 'curated-4',
    text: 'All that is gold does not glitter, not all those who wander are lost; the old that is strong does not wither, deep roots are not reached by the frost.',
    bookTitle: 'The Fellowship of the Ring',
    author: 'J.R.R. Tolkien'
  },
  {
    id: 'curated-5',
    text: 'I must not fear. Fear is the mind-killer. Fear is the little-death that brings total obliteration.',
    bookTitle: 'Dune',
    author: 'Frank Herbert'
  },
  {
    id: 'curated-6',
    text: 'The only way to get rid of a temptation is to yield to it. Resist it, and your soul grows sick with longing.',
    bookTitle: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde'
  },
  {
    id: 'curated-7',
    text: 'Nothing is so painful to the human mind as a great and sudden change.',
    bookTitle: 'Frankenstein',
    author: 'Mary Shelley'
  },
  {
    id: 'curated-8',
    text: 'All grown-ups were once children... but only few of them remember it.',
    bookTitle: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry'
  },
  {
    id: 'curated-9',
    text: 'I am no bird; and no net ensnares me; I am a free human being with an independent will.',
    bookTitle: 'Jane Eyre',
    author: 'Charlotte Brontë'
  },
  {
    id: 'curated-10',
    text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    bookTitle: 'Pride and Prejudice',
    author: 'Jane Austen'
  },
  {
    id: 'curated-11',
    text: 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness...',
    bookTitle: 'A Tale of Two Cities',
    author: 'Charles Dickens'
  },
  {
    id: 'curated-12',
    text: 'We are such stuff as dreams are made on, and our little life is rounded with a sleep.',
    bookTitle: 'The Tempest',
    author: 'William Shakespeare'
  }
];
