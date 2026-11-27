import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { DailyQuote } from './DailyQuote';
import { AddBookDrawer } from './AddBookDrawer';
import { BookCover } from './BookCover';
import { BookDetailDrawer } from './BookDetailDrawer';
import { ProgressDrawer } from './ProgressDrawer';
import { getLocalDateString, getBookProgress } from '../services/storage';

const FlameIcon = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = ({ size = 14 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" /><path d="M5 12h14" />
  </svg>
);

const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const WEEKDAY_LABELS = [
  { short: 'M', full: 'Monday' },
  { short: 'T', full: 'Tuesday' },
  { short: 'W', full: 'Wednesday' },
  { short: 'T', full: 'Thursday' },
  { short: 'F', full: 'Friday' },
  { short: 'S', full: 'Saturday' },
  { short: 'S', full: 'Sunday' },
];

function getCurrentWeekDays() {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const dayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);

  return WEEKDAY_LABELS.map((meta, idx) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    const dateStr = getLocalDateString(d);
    return {
      ...meta,
      dateStr,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    };
  });
}

function formatStartedAgo(startDate?: string): string | null {
  if (!startDate) return null;
  const parts = startDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const start = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.max(0, Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  if (days === 0) return 'started today';
  if (days === 1) return 'started yesterday';
  if (days < 14) return `started ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `started ${weeks} week${weeks > 1 ? 's' : ''} ago`;
}

export function HomeTab() {
  const {
    books, streak, yearlyGoal, hasLoggedToday, readingDates,
    saveGoal, toggleReadingToday, addQuote, showToast, addBook, updateBook,
  } = useAppContext();

  const [showAddBook, setShowAddBook] = useState(false);
  const [showScribe, setShowScribe] = useState(false);
  const [progressBookId, setProgressBookId] = useState<string | null>(null);
  const [detailBookId, setDetailBookId] = useState<string | null>(null);

  // Goal editing
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(yearlyGoal));

  // Active book pagination & swiping states
  const activeBooks = useMemo(() => books.filter(b => b.status === 'reading'), [books]);
  const otherBooks = useMemo(() => books.filter(b => b.status !== 'reading'), [books]);
  const [activeBookIndex, setActiveBookIndex] = useState(0);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isAnimating || !touchStart || activeBooks.length <= 1) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart;
    const clampedDiff = Math.max(-140, Math.min(140, diff));
    setSlideOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (isAnimating) return;
    setIsDragging(false);
    if (!touchStart || activeBooks.length <= 1) {
      setSlideOffset(0);
      return;
    }
    const minSwipeDistance = 50;
    if (slideOffset < -minSwipeDistance) {
      setIsAnimating(true);
      setSlideOffset(-320);
      setTimeout(() => {
        setIsSnapping(true);
        setActiveBookIndex(prev => (prev + 1) % activeBooks.length);
        setSlideOffset(320);
        setTimeout(() => {
          setIsSnapping(false);
          setSlideOffset(0);
          setTimeout(() => setIsAnimating(false), 200);
        }, 30);
      }, 180);
    } else if (slideOffset > minSwipeDistance) {
      setIsAnimating(true);
      setSlideOffset(320);
      setTimeout(() => {
        setIsSnapping(true);
        setActiveBookIndex(prev => (prev - 1 + activeBooks.length) % activeBooks.length);
        setSlideOffset(-320);
        setTimeout(() => {
          setIsSnapping(false);
          setSlideOffset(0);
          setTimeout(() => setIsAnimating(false), 200);
        }, 30);
      }, 180);
    } else {
      setSlideOffset(0);
    }
    setTouchStart(null);
  };

  const safeActiveBookIndex = activeBookIndex >= activeBooks.length ? 0 : activeBookIndex;
  const activeBook = activeBooks[safeActiveBookIndex];
  const progressBook = progressBookId ? books.find(b => b.id === progressBookId) || null : null;
  const detailBook = detailBookId ? books.find(b => b.id === detailBookId) || null : null;

  // Celebratory feedback trigger
  const [triggerStreakPop, setTriggerStreakPop] = useState(false);

  useEffect(() => {
    if (hasLoggedToday) {
      setTriggerStreakPop(true);
      const timer = setTimeout(() => setTriggerStreakPop(false), 400);
      return () => clearTimeout(timer);
    }
  }, [hasLoggedToday]);

  // Highlight form
  const [scribeText, setScribeText] = useState('');
  const [scribeBookId, setScribeBookId] = useState('');
  const [scribePage, setScribePage] = useState('');
  const [scribeChapter, setScribeChapter] = useState('');
  const [scribeNotes, setScribeNotes] = useState('');
  const [scribeTags, setScribeTags] = useState('');
  const [showScribeDetails, setShowScribeDetails] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

  useEffect(() => {
    if (!showScribe) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowScribe(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showScribe]);

  const openHighlightDrawer = (preferredBookId?: string, prefillPage?: number) => {
    const defaultBookId = preferredBookId || activeBook?.id || books[0]?.id || '';
    setScribeBookId(defaultBookId);
    setScribePage(prefillPage !== undefined && prefillPage > 0 ? String(prefillPage) : '');
    setShowScribe(true);
  };

  const currentYear = new Date().getFullYear();
  const finishedThisYear = books.filter(b =>
    b.status === 'finished' && b.endDate?.startsWith(currentYear.toString())
  ).length;
  const goalPct = Math.min(100, Math.round((finishedThisYear / (yearlyGoal || 1)) * 100));

  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const readingDateSet = useMemo(() => new Set(readingDates), [readingDates]);
  const canLogReading = activeBooks.length > 0;

  const handleGoalSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(goalDraft, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 500) {
      showToast('Enter a reading goal between 1 and 500', 'error');
      return;
    }
    saveGoal(parsed);
    setIsEditingGoal(false);
  };

  const handleLogReading = () => {
    if (!canLogReading) return;
    toggleReadingToday();
  };

  const handleHighlightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scribeText.trim()) return;

    let targetBookId = scribeBookId;
    if (scribeBookId === 'create-new') {
      if (!newBookTitle.trim() || !newBookAuthor.trim()) {
        showToast('Enter both book title and author', 'error');
        return;
      }
      const nb = addBook(newBookTitle.trim(), newBookAuthor.trim(), 'reading');
      targetBookId = nb.id;
      setNewBookTitle('');
      setNewBookAuthor('');
    }

    if (!targetBookId) {
      showToast('Select a book for this highlight', 'error');
      return;
    }

    addQuote({
      bookId: targetBookId,
      text: scribeText.trim(),
      chapter: scribeChapter.trim() || undefined,
      page: scribePage.trim() || undefined,
      notes: scribeNotes.trim() || undefined,
      tags: scribeTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      isFavorite: false,
    });

    setScribeText('');
    setScribePage('');
    setScribeChapter('');
    setScribeNotes('');
    setScribeTags('');
    setShowScribeDetails(false);
    setShowScribe(false);
    setScribeBookId(targetBookId);
    showToast('Highlight saved');
  };

  const activeProgress = activeBook ? getBookProgress(activeBook) : null;
  const activeStarted = activeBook ? formatStartedAgo(activeBook.startDate) : null;

  return (
    <>
      <div className="home-tab fade-in">

        {/* 1. Currently Reading Hero (with subtle Library index tabs) */}
        {activeBooks.length > 0 ? (
          <section className="cr-folder-section" aria-label="Currently reading">
            <div className="cr-folder-tabs" role="tablist" aria-label="Currently reading books">
              {activeBooks.length > 1 ? (
                activeBooks.map((b, idx) => (
                  <button
                    key={b.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === safeActiveBookIndex}
                    onClick={() => setActiveBookIndex(idx)}
                    className={`cr-folder-tab ${idx === safeActiveBookIndex ? 'active' : ''}`}
                    title={b.title}
                  >
                    {b.title}
                  </button>
                ))
              ) : (
                <span className="cr-folder-tab active" role="tab" aria-selected="true">
                  Reading now
                </span>
              )}
            </div>

            <div className="currently-reading-card currently-reading-card--tabbed glass-card">
              <div
                className="cr-book-body"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  transform: `translateX(${slideOffset}px)`,
                  opacity: isAnimating && (slideOffset === 320 || slideOffset === -320) ? 0 : 1,
                  transition: (isDragging || isSnapping) ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s',
                  cursor: activeBooks.length > 1 ? 'grab' : 'default',
                  touchAction: 'pan-y',
                }}
              >
                <button
                  type="button"
                  className="cr-book-summary-btn"
                  onClick={() => setDetailBookId(activeBook.id)}
                  aria-label={`Open details for ${activeBook.title}`}
                >
                  <BookCover
                    coverColor={activeBook.coverColor}
                    coverUrl={activeBook.coverUrl}
                    title={activeBook.title}
                    author={activeBook.author}
                    size="medium"
                  />
                  <div className="currently-reading-info">
                    <h2 className="currently-reading-title">{activeBook.title}</h2>
                    <div className="currently-reading-author">
                      {activeBook.author}
                      {activeStarted && <span className="cr-duration-text">, {activeStarted}</span>}
                    </div>

                    {activeProgress ? (
                      <div className="cr-progress-block">
                        <div className="cr-progress-meta">
                          <span>{activeProgress.label}</span>
                          {activeProgress.hasPercent && (
                            <span className="cr-progress-pct">{activeProgress.percent}%</span>
                          )}
                        </div>
                        {activeProgress.hasPercent && (
                          <div className="progress-bar-container cr-progress-bar">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${activeProgress.percent}%` }}
                              role="progressbar"
                              aria-valuenow={activeProgress.percent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="cr-progress-empty">
                        {activeBook.totalPages
                          ? `${activeBook.totalPages} pages, not tracked yet`
                          : 'No progress logged yet'}
                      </div>
                    )}
                  </div>
                </button>
              </div>

              <div className="cr-card-actions">
                <button
                  type="button"
                  onClick={() => setProgressBookId(activeBook.id)}
                  className="btn-secondary cr-action-btn"
                >
                  Update progress
                </button>
                <button
                  type="button"
                  onClick={() => openHighlightDrawer(activeBook.id, activeBook.currentPage)}
                  className="btn-primary cr-action-btn"
                >
                  Add highlight
                </button>
              </div>
            </div>
          </section>
        ) : (
          (() => {
            const backlogBooks = books.filter(b => b.status === 'to-read');
            if (backlogBooks.length > 0) {
              return (
                <div className="currently-reading-empty glass-card">
                  <div className="currently-reading-empty-icon"><BookOpenIcon /></div>
                  <div className="currently-reading-empty-title">Start your next read</div>
                  <p className="currently-reading-empty-sub">
                    You have {backlogBooks.length} book{backlogBooks.length !== 1 ? 's' : ''} waiting on your shelf.
                  </p>
                  <div className="currently-reading-empty-controls">
                    <select
                      className="form-select"
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                      defaultValue=""
                      onChange={(e) => {
                        const bookId = e.target.value;
                        if (bookId) {
                          const targetBook = books.find(b => b.id === bookId);
                          if (targetBook) {
                            updateBook({ ...targetBook, status: 'reading', startDate: getLocalDateString() });
                            showToast(`Started reading "${targetBook.title}"`);
                          }
                        }
                      }}
                    >
                      <option value="" disabled>Pick from want-to-read...</option>
                      {backlogBooks.map(b => (
                        <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddBook(true)}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12.5px' }}
                    >
                      <PlusIcon size={13} /> Add a new book
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                className="currently-reading-empty glass-card interactive-card"
                onClick={() => setShowAddBook(true)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setShowAddBook(true)}
              >
                <div className="currently-reading-empty-icon"><BookOpenIcon /></div>
                <div className="currently-reading-empty-title">Start your reading log</div>
                <p className="currently-reading-empty-sub">
                  Add a book you are reading to track progress and daily streaks.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: 'auto', marginTop: '4px', padding: '9px 16px', fontSize: '13px' }}
                >
                  <PlusIcon size={14} /> Add book
                </button>
              </div>
            );
          })()
        )}

        {/* 2. Consolidated Goal & Streak Card */}
        <div className="glass-card home-progress-card">
          <div className="home-goal-section">
            <div className="home-goal-header">
              <span className="section-label">{currentYear} reading goal</span>
              {!isEditingGoal && (
                <button
                  type="button"
                  onClick={() => { setGoalDraft(String(yearlyGoal)); setIsEditingGoal(true); }}
                  className="icon-btn"
                  title="Edit reading goal"
                  aria-label="Edit reading goal"
                >
                  <EditIcon />
                </button>
              )}
            </div>

            {isEditingGoal ? (
              <form onSubmit={handleGoalSave} className="goal-edit-form">
                <label htmlFor="goal-input" className="form-label">Target books</label>
                <div className="goal-edit-row">
                  <input
                    id="goal-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="12"
                    value={goalDraft}
                    onChange={e => setGoalDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    onFocus={e => e.target.select()}
                    className="form-input goal-number-input"
                    autoFocus
                  />
                  <button type="submit" className="btn-primary">Save</button>
                  <button type="button" onClick={() => setIsEditingGoal(false)} className="btn-secondary">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="home-goal-progress-label">
                  <span className="home-goal-count">
                    {finishedThisYear} of {yearlyGoal}
                    <span className="home-goal-of">books finished</span>
                  </span>
                  <span className="home-goal-pct">{goalPct}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${goalPct}%` }}
                    role="progressbar"
                    aria-valuenow={goalPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </>
            )}
          </div>

          <div className="home-streak-strip">
            <div className="home-streak-top-row">
              <div className={`home-streak-badge ${triggerStreakPop ? 'animate-streak-pop' : ''}`}>
                <FlameIcon className={`home-streak-flame ${triggerStreakPop ? 'animate-flame-pop' : ''}`} size={16} />
                <span className="home-streak-num">{streak}</span>
                <span className="home-streak-text">day streak</span>
              </div>

              <button
                type="button"
                onClick={handleLogReading}
                disabled={!canLogReading}
                className={`log-reading-pill ${hasLoggedToday && canLogReading ? 'logged' : ''}`}
                title={canLogReading ? (hasLoggedToday ? 'Remove today reading log' : 'Log reading today') : 'Add a currently reading book to log a day'}
                aria-label={canLogReading ? (hasLoggedToday ? 'Remove today reading log' : 'Log reading today') : 'Log reading unavailable until you have a currently reading book'}
                aria-pressed={canLogReading && hasLoggedToday}
              >
                {hasLoggedToday && canLogReading && <CheckIcon />}
                <span>{hasLoggedToday && canLogReading ? 'Logged today' : 'Log day'}</span>
              </button>
            </div>

            <div className="week-dots" role="list" aria-label="This week's reading activity">
              {weekDays.map(day => {
                const isLogged = readingDateSet.has(day.dateStr);
                return (
                  <div
                    key={day.dateStr}
                    role="listitem"
                    className={`week-dot-item ${isLogged ? 'logged' : ''} ${day.isToday ? 'today' : ''} ${day.isFuture ? 'future' : ''}`}
                    aria-label={`${day.full}: ${isLogged ? 'read' : 'not logged'}`}
                    title={`${day.full}: ${isLogged ? 'Logged' : 'Not logged'}`}
                  >
                    <span className="week-dot-circle" />
                    <span className="week-dot-label">{day.short}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Quiet Editorial Daily Highlight */}
        <DailyQuote />

        {/* 4. Single Secondary Action to Add a Book */}
        {activeBooks.length > 0 && (
          <div className="home-footer-action">
            <button
              type="button"
              onClick={() => setShowAddBook(true)}
              className="btn-secondary home-action-btn"
            >
              <PlusIcon size={14} /> Add book
            </button>
          </div>
        )}
      </div>

      {/* Add Book Drawer */}
      {showAddBook && (
        <AddBookDrawer
          initialStatus={activeBooks.length === 0 ? 'reading' : 'to-read'}
          onClose={() => setShowAddBook(false)}
        />
      )}

      {/* Update Progress Drawer */}
      {progressBook && (
        <ProgressDrawer
          book={progressBook}
          onClose={() => setProgressBookId(null)}
          onMarkFinished={finished => setDetailBookId(finished.id)}
        />
      )}

      {/* Book Detail Drawer */}
      {detailBook && (
        <BookDetailDrawer
          book={detailBook}
          onClose={() => setDetailBookId(null)}
        />
      )}

      {/* Add Highlight Drawer */}
      {showScribe && createPortal(
        <div
          className="drawer-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scribe-drawer-title"
          onClick={() => setShowScribe(false)}
        >
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-handle" />
            <div className="drawer-header">
              <div>
                <h3 id="scribe-drawer-title" className="drawer-title">Add highlight</h3>
                <p className="drawer-subtitle">Save a passage from your reading</p>
              </div>
              <button type="button" onClick={() => setShowScribe(false)} className="drawer-close-btn" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleHighlightSubmit}>
              <div className="form-group">
                <label htmlFor="scribe-text" className="form-label">Passage</label>
                <textarea
                  id="scribe-text"
                  placeholder="Type or paste the passage..."
                  value={scribeText}
                  onChange={e => setScribeText(e.target.value)}
                  className="form-textarea"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="scribe-book-select" className="form-label">Book</label>
                <select
                  id="scribe-book-select"
                  value={scribeBookId}
                  onChange={e => setScribeBookId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="" disabled>Select a book...</option>
                  {activeBooks.length > 0 && (
                    <optgroup label="Currently reading">
                      {activeBooks.map(b => (
                        <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
                      ))}
                    </optgroup>
                  )}
                  {otherBooks.length > 0 && (
                    <optgroup label="Other books">
                      {otherBooks.map(b => (
                        <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
                      ))}
                    </optgroup>
                  )}
                  <option value="create-new">+ Add new book...</option>
                </select>
              </div>

              {scribeBookId === 'create-new' && (
                <div className="new-book-inline glass-card">
                  <div className="form-group">
                    <label htmlFor="new-book-title-inline" className="form-label">Book title</label>
                    <input id="new-book-title-inline" type="text" placeholder="e.g. Atomic Habits" value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} className="form-input" required={scribeBookId === 'create-new'} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="new-book-author-inline" className="form-label">Author</label>
                    <input id="new-book-author-inline" type="text" placeholder="e.g. James Clear" value={newBookAuthor} onChange={e => setNewBookAuthor(e.target.value)} className="form-input" required={scribeBookId === 'create-new'} />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowScribeDetails(!showScribeDetails)}
                className="details-toggle-btn"
              >
                {showScribeDetails ? 'Hide details' : 'Add page, chapter & tags'}
              </button>

              <div className={`expandable-fields ${showScribeDetails ? 'show' : ''}`}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="scribe-chapter" className="form-label">Chapter</label>
                    <input id="scribe-chapter" type="text" placeholder="Chapter 4" value={scribeChapter} onChange={e => setScribeChapter(e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="scribe-page" className="form-label">Page</label>
                    <input id="scribe-page" type="text" placeholder="214" value={scribePage} onChange={e => setScribePage(e.target.value)} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="scribe-thoughts" className="form-label">Reflection</label>
                  <textarea id="scribe-thoughts" placeholder="Why did this stand out?" value={scribeNotes} onChange={e => setScribeNotes(e.target.value)} className="form-textarea scribe-notes-textarea" />
                </div>
                <div className="form-group">
                  <label htmlFor="scribe-tags" className="form-label">Tags (comma-separated)</label>
                  <input id="scribe-tags" type="text" placeholder="habits, discipline" value={scribeTags} onChange={e => setScribeTags(e.target.value)} className="form-input" />
                </div>
              </div>

              <div className="drawer-actions">
                <button type="submit" className="btn-primary">Save highlight</button>
                <button type="button" onClick={() => setShowScribe(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>,
        document.querySelector('.app-container') || document.body
      )}
    </>
  );
}
