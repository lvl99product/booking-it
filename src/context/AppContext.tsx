import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Book, Quote } from '../types';
import { storageService, getLocalDateString } from '../services/storage';
import { fetchBookMetadata } from '../services/coverService';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error';
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

interface AppContextValue {
  // Data
  books: Book[];
  quotes: Quote[];
  streak: number;
  yearlyGoal: number;
  hasLoggedToday: boolean;
  readingDates: string[];

  // Toast
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error') => void;
  dismissToast: (id: string) => void;

  // Confirm dialog
  confirmOptions: ConfirmOptions | null;
  showConfirm: (opts: ConfirmOptions) => void;
  dismissConfirm: () => void;

  // Book operations
  addBook: (title: string, author: string, status: 'reading' | 'to-read') => Book;
  updateBook: (book: Book) => void;
  deleteBook: (bookId: string) => void;

  // Quote operations
  addQuote: (data: Omit<Quote, 'id' | 'createdAt'>) => Quote;
  updateQuote: (quote: Quote) => void;
  deleteQuote: (quoteId: string) => void;
  toggleFavorite: (quoteId: string) => void;

  // Goal
  saveGoal: (target: number) => void;
  logReadingToday: (silent?: boolean) => boolean;
  toggleReadingToday: () => void;

  // Data helpers
  getBookById: (id: string) => Book | undefined;
  getQuotesByBook: (bookId: string) => Quote[];

  // Export/Import
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Preferences
  showDiscoveryQuotes: boolean;
  toggleDiscoveryQuotes: () => void;

  // Test data triggers
  resetToStarter: () => void;
  resetToTestData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [streak, setStreak] = useState(0);
  const [yearlyGoal, setYearlyGoal] = useState(12);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [readingDates, setReadingDates] = useState<string[]>([]);
  const [showDiscoveryQuotes, setShowDiscoveryQuotes] = useState<boolean>(() =>
    storageService.getDiscoveryQuotesEnabled()
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const attemptedMetadataIdsRef = useRef<Set<string>>(new Set());

  const syncReadingActivity = useCallback(() => {
    const history = storageService.getReadingHistory();
    setReadingDates(history);
    setStreak(storageService.getStreak());
    setHasLoggedToday(history.includes(getLocalDateString()));
  }, []);

  const backfillMissingMetadata = useCallback(async (targetBooks: Book[]) => {
    for (const b of targetBooks) {
      if ((b.coverUrl && b.totalPages) || attemptedMetadataIdsRef.current.has(b.id)) continue;
      attemptedMetadataIdsRef.current.add(b.id);
      const { coverUrl, totalPages } = await fetchBookMetadata(b.title, b.author);
      if (coverUrl || totalPages) {
        const latest = storageService.getBooks().find(item => item.id === b.id);
        if (latest) {
          const nextCover = latest.coverUrl || coverUrl;
          const nextPages = latest.totalPages || totalPages;
          if (nextCover !== latest.coverUrl || nextPages !== latest.totalPages) {
            storageService.updateBook({ ...latest, coverUrl: nextCover, totalPages: nextPages });
            setBooks(storageService.getBooks());
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const initialBooks = storageService.getBooks();
    setBooks(initialBooks);
    setQuotes(storageService.getQuotes());
    setYearlyGoal(storageService.getGoal(new Date().getFullYear()));
    syncReadingActivity();
    backfillMissingMetadata(initialBooks);
  }, [backfillMissingMetadata, syncReadingActivity]);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback((opts: ConfirmOptions) => {
    setConfirmOptions(opts);
  }, []);

  const dismissConfirm = useCallback(() => {
    setConfirmOptions(null);
  }, []);

  const addBook = useCallback((title: string, author: string, status: 'reading' | 'to-read'): Book => {
    const book = storageService.addBook(title, author, status);
    setBooks(storageService.getBooks());
    syncReadingActivity();

    // Background fetch book cover and total page count
    attemptedMetadataIdsRef.current.add(book.id);
    fetchBookMetadata(title, author).then(({ coverUrl, totalPages }) => {
      if (coverUrl || totalPages) {
        const latest = storageService.getBooks().find(item => item.id === book.id);
        if (latest) {
          storageService.updateBook({
            ...latest,
            coverUrl: latest.coverUrl || coverUrl,
            totalPages: latest.totalPages || totalPages,
          });
          setBooks(storageService.getBooks());
        }
      }
    });

    return book;
  }, [syncReadingActivity]);

  const updateBook = useCallback((book: Book) => {
    storageService.updateBook(book);
    setBooks(storageService.getBooks());
  }, []);

  const deleteBook = useCallback((bookId: string) => {
    storageService.deleteBook(bookId);
    setBooks(storageService.getBooks());
    setQuotes(storageService.getQuotes());
  }, []);

  const addQuote = useCallback((data: Omit<Quote, 'id' | 'createdAt'>): Quote => {
    const quote = storageService.addQuote(data);
    setQuotes(storageService.getQuotes());
    syncReadingActivity();
    return quote;
  }, [syncReadingActivity]);

  const updateQuote = useCallback((quote: Quote) => {
    storageService.updateQuote(quote);
    setQuotes(storageService.getQuotes());
  }, []);

  const deleteQuote = useCallback((quoteId: string) => {
    storageService.deleteQuote(quoteId);
    setQuotes(storageService.getQuotes());
  }, []);

  const toggleFavorite = useCallback((quoteId: string) => {
    storageService.toggleFavorite(quoteId);
    setQuotes(storageService.getQuotes());
  }, []);

  const saveGoal = useCallback((target: number) => {
    storageService.saveGoal(new Date().getFullYear(), target);
    setYearlyGoal(target);
  }, []);

  const logReadingToday = useCallback((silent = false): boolean => {
    const logged = storageService.logReadingToday();
    syncReadingActivity();
    if (logged && !silent) {
      showToast('Reading logged for today');
    }
    return logged;
  }, [showToast, syncReadingActivity]);

  const toggleReadingToday = useCallback(() => {
    const isLoggedNow = storageService.toggleReadingToday();
    syncReadingActivity();
    if (isLoggedNow) {
      showToast('Reading logged for today');
    } else {
      showToast('Log removed for today');
    }
  }, [showToast, syncReadingActivity]);

  const getBookById = useCallback((id: string) => books.find(b => b.id === id), [books]);

  const getQuotesByBook = useCallback((bookId: string) => quotes.filter(q => q.bookId === bookId), [quotes]);

  const handleExport = useCallback(() => {
    const dataStr = storageService.exportData();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `deez_books_backup_${getLocalDateString()}.json`;
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', exportFileDefaultName);
    link.click();
    showToast('Backup exported!');
  }, [showToast]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        const result = event.target?.result as string;
        const success = storageService.importData(result);
        if (success) {
          setBooks(storageService.getBooks());
          setQuotes(storageService.getQuotes());
          syncReadingActivity();
          showToast('Data imported successfully!');
        } else {
          showToast('Failed to import — check the JSON file.', 'error');
        }
      };
    }
  }, [showToast, syncReadingActivity]);

  const toggleDiscoveryQuotes = useCallback(() => {
    setShowDiscoveryQuotes(prev => {
      const next = !prev;
      storageService.setDiscoveryQuotesEnabled(next);
      showToast(next ? 'Discovery quotes turned on' : 'Discovery quotes turned off');
      return next;
    });
  }, [showToast]);

  const resetToStarter = useCallback(() => {
    attemptedMetadataIdsRef.current.clear();
    storageService.resetToStarter();
    setBooks([]);
    setQuotes([]);
    setStreak(0);
    setYearlyGoal(12);
    setHasLoggedToday(false);
    setReadingDates([]);
    showToast('App reset to clean starter state');
  }, [showToast]);

  const resetToTestData = useCallback(() => {
    attemptedMetadataIdsRef.current.clear();
    storageService.resetToTestData();
    const loadedBooks = storageService.getBooks();
    setBooks(loadedBooks);
    setQuotes(storageService.getQuotes());
    setYearlyGoal(storageService.getGoal(new Date().getFullYear()));
    syncReadingActivity();
    showToast('Loaded demo test data (5-day streak)');
    backfillMissingMetadata(loadedBooks);
  }, [showToast, backfillMissingMetadata, syncReadingActivity]);

  return (
    <AppContext.Provider value={{
      books, quotes, streak, yearlyGoal, hasLoggedToday, readingDates,
      toasts, showToast, dismissToast,
      confirmOptions, showConfirm, dismissConfirm,
      addBook, updateBook, deleteBook,
      addQuote, updateQuote, deleteQuote, toggleFavorite,
      saveGoal, logReadingToday, toggleReadingToday,
      getBookById, getQuotesByBook,
      handleExport, handleImport,
      showDiscoveryQuotes, toggleDiscoveryQuotes,
      resetToStarter, resetToTestData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
