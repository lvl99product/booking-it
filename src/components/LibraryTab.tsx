import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BookCover } from './BookCover';
import { BookDetailDrawer } from './BookDetailDrawer';
import { AddBookDrawer } from './AddBookDrawer';
import { getBookProgress } from '../services/storage';
import type { Book } from '../types';

const LibraryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" /><path d="M5 12h14" />
  </svg>
);

type LibraryFilter = 'reading' | 'finished' | 'to-read' | 'all';

const FILTER_LABELS: Record<LibraryFilter, string> = {
  reading: 'Reading',
  finished: 'Finished',
  'to-read': 'Want to read',
  all: 'All',
};

export function LibraryTab() {
  const { books, getQuotesByBook } = useAppContext();
  const [filter, setFilter] = useState<LibraryFilter>('reading');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);

  const filteredBooks = books.filter(b => (filter === 'all' ? true : b.status === filter));
  const selectedBook: Book | null = selectedBookId ? books.find(b => b.id === selectedBookId) || null : null;

  return (
    <div className="library-tab fade-in">
      {/* Filter tabs + compact add button */}
      <div className="library-toolbar">
        <div className="library-filter-tabs" role="tablist" aria-label="Book shelf filter">
          {(Object.keys(FILTER_LABELS) as LibraryFilter[]).map(f => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`library-filter-tab ${filter === f ? 'active' : ''}`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAddBook(true)}
          className="btn-primary library-add-pill"
          aria-label="Add book"
        >
          <PlusIcon />
          <span>Add</span>
        </button>
      </div>

      {/* Book grid with legible captions below covers */}
      {filteredBooks.length > 0 ? (
        <div className="book-card-grid">
          {filteredBooks.map(book => {
            const quoteCount = getQuotesByBook(book.id).length;
            const progress = book.status === 'reading' ? getBookProgress(book) : null;

            return (
              <div
                key={book.id}
                className="book-item-card"
                onClick={() => setSelectedBookId(book.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelectedBookId(book.id)}
                aria-label={`${book.title} by ${book.author}`}
              >
                <BookCover
                  coverColor={book.coverColor}
                  coverUrl={book.coverUrl}
                  title={book.title}
                  author={book.author}
                  size="large"
                  status={filter === 'all' ? book.status : undefined}
                  rating={book.rating}
                  quoteCount={quoteCount}
                />
                <div className="book-item-caption">
                  <div className="book-item-title">{book.title}</div>
                  <div className="book-item-author">{book.author}</div>
                  {progress && progress.hasPercent && (
                    <div className="book-item-progress">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <LibraryIcon />
          <h3>No books on this shelf</h3>
          <p>
            {filter === 'reading' && 'Add a book to Reading to track your progress.'}
            {filter === 'finished' && 'Finished books will appear here with your ratings.'}
            {filter === 'to-read' && 'Save books you want to read next.'}
            {filter === 'all' && 'Add your first book to build your library.'}
          </p>
        </div>
      )}

      {selectedBook && (
        <BookDetailDrawer
          book={selectedBook}
          onClose={() => setSelectedBookId(null)}
        />
      )}

      {showAddBook && (
        <AddBookDrawer
          initialStatus={filter === 'reading' ? 'reading' : 'to-read'}
          onClose={() => setShowAddBook(false)}
        />
      )}
    </div>
  );
}
