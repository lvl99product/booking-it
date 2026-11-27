import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface AddBookDrawerProps {
  initialStatus?: 'reading' | 'to-read';
  onClose: () => void;
  onAdded?: (bookId: string) => void;
}

export function AddBookDrawer({ initialStatus = 'to-read', onClose, onAdded }: AddBookDrawerProps) {
  const { addBook, showToast } = useAppContext();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<'reading' | 'to-read'>(initialStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    const book = addBook(title.trim(), author.trim(), status);
    showToast(`"${book.title}" added to your library`);
    onAdded?.(book.id);
    onClose();
  };

  return createPortal(
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-book-title"
      onClick={onClose}
    >
      <div className="drawer-content" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div>
            <h3 id="add-book-title" className="drawer-title">Add a Book</h3>
            <p className="drawer-subtitle">Add to your reading shelf or want-to-read list</p>
          </div>
          <button onClick={onClose} className="drawer-close-btn" aria-label="Close drawer">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="add-book-title-input" className="form-label">Book Title</label>
            <input
              id="add-book-title-input"
              type="text"
              placeholder="e.g. Meditations"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="add-book-author-input" className="form-label">Author</label>
            <input
              id="add-book-author-input"
              type="text"
              placeholder="e.g. Marcus Aurelius"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reading Status</label>
            <div className="status-toggle-group" role="group" aria-label="Reading status">
              <button
                type="button"
                onClick={() => setStatus('to-read')}
                className={`status-toggle-btn ${status === 'to-read' ? 'active' : ''}`}
              >
                Want to read
              </button>
              <button
                type="button"
                onClick={() => setStatus('reading')}
                className={`status-toggle-btn ${status === 'reading' ? 'active' : ''}`}
              >
                Reading now
              </button>
            </div>
          </div>

          <div className="drawer-actions">
            <button type="submit" className="btn-primary">Add Book</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>,
    document.querySelector('.app-container') || document.body
  );
}
