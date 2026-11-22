import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Book, Quote } from '../types';
import { storageService, getLocalDateString } from '../services/storage';
import { fetchBookCover } from '../services/coverService';

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
  logReadingToday: () => void;
  toggleReadingToday: () => void;

  // Data helpers
  getBookById: (id: string) => Book | undefined;
  getQuotesByBook: (bookId: string) => Quote[];

  // Export/Import
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;

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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const attemptedCoverIdsRef = useRef<Set<string>>(new Set());

  const backfillMissingCovers = useCallback(async (targetBooks: Book[]) => {
    for (const b of targetBooks) {
      if (b.coverUrl || attemptedCoverIdsRef.current.has(b.id)) continue;
      attemptedCoverIdsRef.current.add(b.id);
      const coverUrl = await fetchBookCover(b.title, b.author);
      if (coverUrl) {
        const latest = storageService.getBooks().find(item => item.id === b.id);
        if (latest && !latest.coverUrl) {
          storageService.updateBook({ ...latest, coverUrl });
          setBooks(storageService.getBooks());
        }
      }
    }
  }, []);

  useEffect(() => {
    const initialBooks = storageService.getBooks();
    setBooks(initialBooks);
    setQuotes(storageService.getQuotes());
    setYearlyGoal(storageService.getGoal(new Date().getFullYear()));
    setStreak(storageService.getStreak());
    setHasLoggedToday(storageService.getReadingHistory().includes(getLocalDateString()));
    backfillMissingCovers(initialBooks);
  }, [backfillMissingCovers]);

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
    setStreak(storageService.getStreak());
    setHasLoggedToday(storageService.getReadingHistory().includes(getLocalDateString()));

    // Background fetch book cover
    attemptedCoverIdsRef.current.add(book.id);
    fetchBookCover(title, author).then(coverUrl => {
      if (coverUrl) {
        const latest = storageService.getBooks().find(item => item.id === book.id);
        if (latest) {
          storageService.updateBook({ ...latest, coverUrl });
          setBooks(storageService.getBooks());
        }
      }
    });

    return book;
  }, []);

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
    setStreak(storageService.getStreak());
    setHasLoggedToday(storageService.getReadingHistory().includes(getLocalDateString()));
    return quote;
  }, []);

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

  const logReadingToday = useCallback(() => {
    const logged = storageService.logReadingToday();
    if (logged) {
      setStreak(storageService.getStreak());
      setHasLoggedToday(true);
      showToast('🔥 Reading logged! Keep the streak alive!');
    }
  }, [showToast]);

  const toggleReadingToday = useCallback(() => {
    const isLoggedNow = storageService.toggleReadingToday();
    setStreak(storageService.getStreak());
    setHasLoggedToday(isLoggedNow);
    if (isLoggedNow) {
      showToast('🔥 Reading logged! Keep the streak alive!');
    } else {
      showToast('Log removed for today.');
    }
  }, [showToast]);

  const getBookById = useCallback((id: string) => books.find(b => b.id === id), [books]);

  const getQuotesByBook = useCallback((bookId: string) => quotes.filter(q => q.bookId === bookId), [quotes]);

  const handleExport = useCallback(() => {
    const dataStr = storageService.exportData();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `booking_it_backup_${getLocalDateString()}.json`;
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
          setStreak(storageService.getStreak());
          showToast('Data imported successfully!');
        } else {
          showToast('Failed to import — check the JSON file.', 'error');
        }
      };
    }
  }, [showToast]);

  const resetToStarter = useCallback(() => {
    attemptedCoverIdsRef.current.clear();
    storageService.resetToStarter();
    setBooks([]);
    setQuotes([]);
    setStreak(0);
    setYearlyGoal(12);
    setHasLoggedToday(false);
    showToast('App reset to clean starter state');
  }, [showToast]);

  const resetToTestData = useCallback(() => {
    attemptedCoverIdsRef.current.clear();
    storageService.resetToTestData();
    const loadedBooks = storageService.getBooks();
    setBooks(loadedBooks);
    setQuotes(storageService.getQuotes());
    setYearlyGoal(storageService.getGoal(new Date().getFullYear()));
    setStreak(storageService.getStreak());
    setHasLoggedToday(storageService.getReadingHistory().includes(getLocalDateString()));
    showToast('Loaded demo test data (5-day streak)');
    backfillMissingCovers(loadedBooks);
  }, [showToast, backfillMissingCovers]);

  return (
    <AppContext.Provider value={{
      books, quotes, streak, yearlyGoal, hasLoggedToday,
      toasts, showToast, dismissToast,
      confirmOptions, showConfirm, dismissConfirm,
      addBook, updateBook, deleteBook,
      addQuote, updateQuote, deleteQuote, toggleFavorite,
      saveGoal, logReadingToday, toggleReadingToday,
      getBookById, getQuotesByBook,
      handleExport, handleImport,
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
