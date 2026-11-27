import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Book } from '../types';
import { useAppContext } from '../context/AppContext';
import { BookCover } from './BookCover';
import { getLocalDateString } from '../services/storage';

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface ProgressDrawerProps {
  book: Book;
  onClose: () => void;
  onMarkFinished?: (finishedBook: Book) => void;
}

export function ProgressDrawer({ book, onClose, onMarkFinished }: ProgressDrawerProps) {
  const { updateBook, logReadingToday, showToast } = useAppContext();

  const initialMode: 'pages' | 'percent' =
    book.progressMode || (book.progressPercent !== undefined && book.currentPage === undefined ? 'percent' : 'pages');

  const [mode, setMode] = useState<'pages' | 'percent'>(initialMode);
  const [currentPageStr, setCurrentPageStr] = useState(
    book.currentPage !== undefined ? String(book.currentPage) : ''
  );
  const [totalPagesStr, setTotalPagesStr] = useState(
    book.totalPages !== undefined ? String(book.totalPages) : ''
  );
  const [percent, setPercent] = useState(() => {
    if (book.progressPercent !== undefined) return Math.min(100, Math.max(0, Math.round(book.progressPercent)));
    if (book.currentPage !== undefined && book.totalPages && book.totalPages > 0) {
      return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
    }
    return 0;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const parsedCurrent = currentPageStr.trim() === '' ? undefined : parseInt(currentPageStr, 10);
  const parsedTotal = totalPagesStr.trim() === '' ? undefined : parseInt(totalPagesStr, 10);

  const computedPercent = mode === 'pages'
    ? (parsedCurrent !== undefined && parsedTotal && parsedTotal > 0
      ? Math.min(100, Math.max(0, Math.round((parsedCurrent / parsedTotal) * 100)))
      : null)
    : percent;

  const isAtEnd = mode === 'percent'
    ? percent >= 100
    : Boolean(parsedTotal && parsedTotal > 0 && parsedCurrent !== undefined && parsedCurrent >= parsedTotal);

  const handleSwitchMode = (nextMode: 'pages' | 'percent') => {
    if (nextMode === mode) return;
    if (nextMode === 'percent' && computedPercent !== null) {
      setPercent(computedPercent);
    } else if (nextMode === 'pages' && parsedTotal && parsedTotal > 0) {
      setCurrentPageStr(String(Math.round((percent / 100) * parsedTotal)));
    }
    setMode(nextMode);
  };

  const bumpPages = (delta: number) => {
    const base = parsedCurrent ?? 0;
    const rawNext = Math.max(0, base + delta);
    const next = parsedTotal && parsedTotal > 0 ? Math.min(parsedTotal, rawNext) : rawNext;
    setCurrentPageStr(String(next));
  };

  const bumpPercent = (delta: number) => {
    setPercent(prev => Math.min(100, Math.max(0, prev + delta)));
  };

  const buildUpdatedBook = (markFinished: boolean): Book => {
    let nextCurrentPage = book.currentPage;
    const nextTotalPages = parsedTotal && parsedTotal > 0 ? parsedTotal : undefined;
    let nextPercent = book.progressPercent;

    if (mode === 'pages') {
      const clampedCurrent = parsedCurrent !== undefined
        ? (nextTotalPages ? Math.min(nextTotalPages, Math.max(0, parsedCurrent)) : Math.max(0, parsedCurrent))
        : undefined;
      nextCurrentPage = clampedCurrent;
      nextPercent = clampedCurrent !== undefined && nextTotalPages
        ? Math.min(100, Math.round((clampedCurrent / nextTotalPages) * 100))
        : undefined;
    } else {
      nextPercent = Math.min(100, Math.max(0, Math.round(percent)));
      if (nextTotalPages) {
        nextCurrentPage = Math.round((nextPercent / 100) * nextTotalPages);
      }
    }

    if (markFinished) {
      return {
        ...book,
        status: 'finished',
        endDate: book.endDate || getLocalDateString(),
        progressMode: mode,
        totalPages: nextTotalPages,
        currentPage: nextTotalPages ?? nextCurrentPage,
        progressPercent: 100,
      };
    }

    return {
      ...book,
      progressMode: mode,
      currentPage: nextCurrentPage,
      totalPages: nextTotalPages,
      progressPercent: nextPercent,
    };
  };

  const handleSave = (e: React.FormEvent, markFinished = false) => {
    e.preventDefault();
    if (mode === 'pages' && parsedCurrent === undefined && !markFinished) {
      showToast('Enter a page number or switch to % mode', 'error');
      return;
    }

    const updated = buildUpdatedBook(markFinished);
    updateBook(updated);
    const newlyLogged = logReadingToday(true);

    if (markFinished) {
      showToast(`Finished "${book.title}"`);
      onClose();
      onMarkFinished?.(updated);
      return;
    }

    showToast(newlyLogged ? 'Progress saved and day logged' : 'Reading progress updated');
    onClose();
  };

  return createPortal(
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-drawer-title"
      onClick={onClose}
    >
      <div className="drawer-content" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-header">
          <div className="drawer-header-book">
            <BookCover
              coverColor={book.coverColor}
              coverUrl={book.coverUrl}
              title={book.title}
              author={book.author}
              size="mini"
            />
            <div className="drawer-header-info">
              <h3 id="progress-drawer-title" className="drawer-title">Update Progress</h3>
              <p className="drawer-subtitle">{book.title} · {book.author}</p>
            </div>
          </div>
          <button onClick={onClose} className="drawer-close-btn" aria-label="Close drawer">
            <XIcon />
          </button>
        </div>

        <form onSubmit={e => handleSave(e, false)}>
          <div className="form-group">
            <label className="form-label">Track By</label>
            <div className="status-toggle-group" role="group" aria-label="Progress tracking unit">
              <button
                type="button"
                onClick={() => handleSwitchMode('pages')}
                className={`status-toggle-btn ${mode === 'pages' ? 'active' : ''}`}
              >
                Pages
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('percent')}
                className={`status-toggle-btn ${mode === 'percent' ? 'active' : ''}`}
              >
                Percentage (%)
              </button>
            </div>
          </div>

          {mode === 'pages' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="progress-current-page" className="form-label">Current Page</label>
                  <input
                    id="progress-current-page"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 142"
                    value={currentPageStr}
                    onChange={e => setCurrentPageStr(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    onFocus={e => e.target.select()}
                    className="form-input"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="progress-total-pages" className="form-label">Total Pages (optional)</label>
                  <input
                    id="progress-total-pages"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 320"
                    value={totalPagesStr}
                    onChange={e => setTotalPagesStr(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="progress-quick-bumps" aria-label="Quick add pages">
                {[10, 25, 50].map(step => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => bumpPages(step)}
                    className="progress-bump-chip"
                  >
                    +{step}p
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <div className="progress-percent-header">
                  <label htmlFor="progress-percent-slider" className="form-label" style={{ marginBottom: 0 }}>
                    Completion
                  </label>
                  <div className="progress-percent-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Completion percentage"
                      value={String(percent)}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setPercent(cleaned === '' ? 0 : Math.min(100, parseInt(cleaned, 10)));
                      }}
                      onFocus={e => e.target.select()}
                      className="form-input progress-percent-num"
                    />
                    <span className="progress-percent-suffix">%</span>
                  </div>
                </div>
                <input
                  id="progress-percent-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={percent}
                  onChange={e => setPercent(parseInt(e.target.value, 10))}
                  className="progress-range-slider"
                />
              </div>

              <div className="progress-quick-bumps" aria-label="Quick add percentage">
                {[5, 10, 25].map(step => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => bumpPercent(step)}
                    className="progress-bump-chip"
                  >
                    +{step}%
                  </button>
                ))}
              </div>
            </>
          )}

          {computedPercent !== null && (
            <div className="progress-drawer-preview">
              <div className="progress-drawer-preview-row">
                <span>Progress preview</span>
                <strong>{computedPercent}%</strong>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${computedPercent}%` }}
                  role="progressbar"
                  aria-valuenow={computedPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {isAtEnd && (
            <div className="progress-finish-banner">
              <span>You reached the end. Ready to mark this book as finished?</span>
            </div>
          )}

          <div className="drawer-actions">
            {isAtEnd ? (
              <>
                <button
                  type="button"
                  onClick={e => handleSave(e, true)}
                  className="btn-primary"
                >
                  Save &amp; mark finished
                </button>
                <button type="submit" className="btn-secondary">
                  Save progress only
                </button>
              </>
            ) : (
              <>
                <button type="submit" className="btn-primary">Save progress</button>
                <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.querySelector('.app-container') || document.body
  );
}
