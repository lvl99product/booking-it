import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Book } from '../types';
import { useAppContext } from '../context/AppContext';
import { StarRating } from './StarRating';
import { BookCover } from './BookCover';
import { getLocalDateString } from '../services/storage';

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

interface BookDetailDrawerProps {
  book: Book;
  onClose: () => void;
}

function formatReadingDuration(startDate?: string, endDate?: string): string | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Less than a day';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  const weeks = Math.floor(days / 7);
  const remaining = days % 7;
  if (remaining === 0) return `${weeks} week${weeks > 1 ? 's' : ''}`;
  return `${weeks}w ${remaining}d`;
}

export function BookDetailDrawer({ book, onClose }: BookDetailDrawerProps) {
  const { updateBook, deleteBook, getQuotesByBook, showConfirm, showToast } = useAppContext();

  const [editStatus, setEditStatus] = useState<'reading' | 'finished' | 'to-read'>(book.status);
  const [editStartDate, setEditStartDate] = useState(book.startDate || '');
  const [editEndDate, setEditEndDate] = useState(book.endDate || '');
  const [editRating, setEditRating] = useState(book.rating || 0);
  const [editThoughts, setEditThoughts] = useState(book.thoughts || '');
  const [editCurrentPage, setEditCurrentPage] = useState(book.currentPage !== undefined ? String(book.currentPage) : '');
  const [editTotalPages, setEditTotalPages] = useState(book.totalPages !== undefined ? String(book.totalPages) : '');

  useEffect(() => {
    setEditStatus(book.status);
    setEditStartDate(book.startDate || '');
    setEditEndDate(book.endDate || '');
    setEditRating(book.rating || 0);
    setEditThoughts(book.thoughts || '');
    setEditCurrentPage(book.currentPage !== undefined ? String(book.currentPage) : '');
    setEditTotalPages(book.totalPages !== undefined ? String(book.totalPages) : '');
  }, [book]);

  const bookQuotes = getQuotesByBook(book.id);
  const duration = formatReadingDuration(editStartDate, editStatus === 'finished' ? editEndDate : undefined);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = editTotalPages.trim() ? parseInt(editTotalPages, 10) : undefined;
    const parsedCurrent = editCurrentPage.trim() ? parseInt(editCurrentPage, 10) : undefined;
    const validTotal = parsedTotal && parsedTotal > 0 ? parsedTotal : undefined;
    const validCurrent = parsedCurrent !== undefined && !isNaN(parsedCurrent)
      ? (validTotal ? Math.min(validTotal, Math.max(0, parsedCurrent)) : Math.max(0, parsedCurrent))
      : undefined;

    const nextPercent = editStatus === 'finished'
      ? 100
      : validCurrent !== undefined && validTotal
        ? Math.min(100, Math.round((validCurrent / validTotal) * 100))
        : book.progressPercent;

    updateBook({
      ...book,
      status: editStatus,
      startDate: editStartDate || undefined,
      endDate: editStatus === 'finished' ? (editEndDate || getLocalDateString()) : undefined,
      rating: editStatus === 'finished' ? editRating : undefined,
      thoughts: editThoughts || undefined,
      totalPages: validTotal,
      currentPage: editStatus === 'finished' ? (validTotal ?? validCurrent) : validCurrent,
      progressPercent: nextPercent,
      progressMode: validCurrent !== undefined ? 'pages' : book.progressMode,
    });
    showToast('Book updated');
    onClose();
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Remove Book?',
      message: `"${book.title}" and all ${bookQuotes.length} associated highlight${bookQuotes.length !== 1 ? 's' : ''} will be permanently deleted.`,
      confirmLabel: 'Remove Book',
      isDanger: true,
      onConfirm: () => {
        deleteBook(book.id);
        showToast(`"${book.title}" removed from library`);
        onClose();
      },
    });
  };

  return createPortal(
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
      onClick={onClose}
    >
      <div className="drawer-content" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />

        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-book">
            <BookCover coverColor={book.coverColor} coverUrl={book.coverUrl} title={book.title} author={book.author} size="mini" />
            <div className="drawer-header-info">
              <h3 id="book-detail-title" className="drawer-title">{book.title}</h3>
              <p className="drawer-subtitle">by {book.author}</p>
              {duration && editStatus !== 'to-read' && (
                <p className="drawer-reading-duration">
                  {editStatus === 'finished' ? 'Read in ' : 'Reading for '}
                  <strong>{duration}</strong>
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="drawer-close-btn" aria-label="Close drawer">
            <XIcon />
          </button>
        </div>

        {/* Tabs & Form */}
        <form onSubmit={handleSave} className="drawer-detail-form">
          <div className="form-group">
            <label className="form-label">Reading Status</label>
            <div className="status-toggle-group" style={{ marginBottom: 'var(--space-12)' }}>
              <button
                type="button"
                onClick={() => setEditStatus('to-read')}
                className={`status-toggle-btn ${editStatus === 'to-read' ? 'active' : ''}`}
              >
                Want to read
              </button>
              <button
                type="button"
                onClick={() => setEditStatus('reading')}
                className={`status-toggle-btn ${editStatus === 'reading' ? 'active' : ''}`}
              >
                Reading now
              </button>
              <button
                type="button"
                onClick={() => setEditStatus('finished')}
                className={`status-toggle-btn ${editStatus === 'finished' ? 'active' : ''}`}
              >
                Finished
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', marginBottom: 'var(--space-16)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="edit-start-date" className="form-label">Date Started</label>
              <input
                id="edit-start-date"
                type="date"
                className="form-input"
                value={editStartDate}
                onChange={e => setEditStartDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="edit-end-date" className="form-label">Date Finished</label>
              <input
                id="edit-end-date"
                type="date"
                className="form-input"
                value={editEndDate}
                disabled={editStatus !== 'finished'}
                onChange={e => setEditEndDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', marginBottom: 'var(--space-16)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="edit-current-page" className="form-label">Current Page</label>
              <input
                id="edit-current-page"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 142"
                className="form-input"
                disabled={editStatus === 'to-read'}
                value={editCurrentPage}
                onChange={e => setEditCurrentPage(e.target.value.replace(/\D/g, '').slice(0, 5))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="edit-total-pages" className="form-label">Total Pages</label>
              <input
                id="edit-total-pages"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 320"
                className="form-input"
                value={editTotalPages}
                onChange={e => setEditTotalPages(e.target.value.replace(/\D/g, '').slice(0, 5))}
              />
            </div>
          </div>

          {editStatus === 'finished' && (
            <div className="form-group">
              <label className="form-label">My Rating</label>
              <div style={{ display: 'flex', gap: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                <StarRating value={editRating} onChange={setEditRating} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="edit-thoughts" className="form-label">Thoughts & Review</label>
            <textarea
              id="edit-thoughts"
              placeholder="What did you think of this book? Write a short review..."
              className="form-input"
              rows={3}
              value={editThoughts}
              onChange={e => setEditThoughts(e.target.value)}
            />
          </div>

          <div className="drawer-actions">
            <button type="submit" className="btn-primary">Save Changes</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>

        {/* Quotes Section */}
        <div className="drawer-quotes-section">
          <h4 className="drawer-section-title">Saved Highlights ({bookQuotes.length})</h4>
          {bookQuotes.length > 0 ? (
            <div className="drawer-quotes-list">
              {bookQuotes.map(quote => (
                <div key={quote.id} className="drawer-quote-item">
                  <p className="drawer-quote-text">“{quote.text}”</p>
                  {(quote.chapter || quote.page || quote.notes) && (
                    <div className="drawer-quote-meta">
                      {quote.chapter && <span className="drawer-quote-loc">Ch. {quote.chapter}</span>}
                      {quote.page && <span className="drawer-quote-loc">Pg. {quote.page}</span>}
                      {quote.notes && <p className="drawer-quote-notes">{quote.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="drawer-quotes-empty">No highlights saved for this book yet.</p>
          )}
        </div>

        {/* Danger zone */}
        <div className="drawer-danger-zone">
          <button
            type="button"
            onClick={handleDelete}
            className="btn-ghost-danger"
          >
            <TrashIcon /> Remove Book from Library
          </button>
        </div>
      </div>
    </div>,
    document.querySelector('.app-container') || document.body
  );
}
