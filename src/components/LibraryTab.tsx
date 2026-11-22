import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BookCover } from './BookCover';
import { BookDetailDrawer } from './BookDetailDrawer';
import { AddBookDrawer } from './AddBookDrawer';
import type { Book } from '../types';

const LibraryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

type LibraryFilter = 'reading' | 'finished' | 'to-read' | 'all';

const FILTER_LABELS: Record<LibraryFilter, string> = {
  reading: '📖 Reading',
  finished: '✓ Finished',
  'to-read': '📚 To Read',
  all: '📂 All',
};

export function LibraryTab() {
  const { books, getQuotesByBook } = useAppContext();
  const [filter, setFilter] = useState<LibraryFilter>('reading');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBook, setShowAddBook] = useState(false);

  const filteredBooks = books.filter(b => filter === 'all' ? true : b.status === filter);

  const handleBookAdded = () => {
    // After adding, switch to show the relevant status
  };

  return (
    <div className="library-tab fade-in">
      {/* Filter tabs */}
      <div className="library-filter-tabs" role="tablist" aria-label="Book shelf filter">
        {(Object.keys(FILTER_LABELS) as LibraryFilter[]).map(f => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`library-filter-tab ${filter === f ? 'active' : ''}`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Add book button */}
      <button
        onClick={() => setShowAddBook(true)}
        className="btn-secondary library-add-btn"
      >
        + Add Book
      </button>

      {/* Book grid */}
      {filteredBooks.length > 0 ? (
        <div className="book-card-grid">
          {filteredBooks.map(book => {
            const quoteCount = getQuotesByBook(book.id).length;
            return (
              <div
                key={book.id}
                className="book-item-card"
                onClick={() => setSelectedBook(book)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelectedBook(book)}
                aria-label={`${book.title} by ${book.author}`}
              >
                <BookCover
                  coverColor={book.coverColor}
                  coverUrl={book.coverUrl}
                  title={book.title}
                  author={book.author}
                  size="large"
                  status={book.status}
                  rating={book.rating}
                  quoteCount={quoteCount}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <LibraryIcon />
          <h3>No books here yet</h3>
          <p>
            {filter === 'reading' && 'Start reading a book by adding it to your library.'}
            {filter === 'finished' && 'Mark a book as finished to see it here.'}
            {filter === 'to-read' && 'Add books you want to read to your backlog.'}
            {filter === 'all' && 'Add your first book to get started!'}
          </p>
        </div>
      )}

      {/* Book Detail Drawer */}
      {selectedBook && (
        <BookDetailDrawer
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Add Book Drawer */}
      {showAddBook && (
        <AddBookDrawer
          initialStatus={filter === 'reading' ? 'reading' : 'to-read'}
          onClose={() => setShowAddBook(false)}
          onAdded={handleBookAdded}
        />
      )}
    </div>
  );
}
