import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context/AppContext';
import { DailyQuote } from './DailyQuote';
import { AddBookDrawer } from './AddBookDrawer';
import { getLocalDateString } from '../services/storage';

const FlameIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c67d5a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);



export function HomeTab() {
  const { books, quotes, streak, yearlyGoal, hasLoggedToday, saveGoal, toggleReadingToday, addQuote, showToast, addBook, updateBook } = useAppContext();
  const [showAddBook, setShowAddBook] = useState(false);
  const [showScribe, setShowScribe] = useState(false);

  // Goal editing
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(yearlyGoal));

  // Active book pagination & swiping states
  const activeBooks = books.filter(b => b.status === 'reading');
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
          setTimeout(() => {
            setIsAnimating(false);
          }, 220);
        }, 30);
      }, 200);
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
          setTimeout(() => {
            setIsAnimating(false);
          }, 220);
        }, 30);
      }, 200);
    } else {
      setSlideOffset(0);
    }
    setTouchStart(null);
  };

  const safeActiveBookIndex = activeBookIndex >= activeBooks.length ? 0 : activeBookIndex;
  const activeBook = activeBooks[safeActiveBookIndex];

  // Celebratory animation triggers
  const [triggerStreakPop, setTriggerStreakPop] = useState(false);

  useEffect(() => {
    if (hasLoggedToday) {
      setTriggerStreakPop(true);
      const timer = setTimeout(() => setTriggerStreakPop(false), 600);
      return () => clearTimeout(timer);
    }
  }, [hasLoggedToday]);

  // Scribe form
  const [scribeText, setScribeText] = useState('');
  const [scribeBookId, setScribeBookId] = useState(() => {
    return activeBook?.id || '';
  });
  const [scribePage, setScribePage] = useState('');
  const [scribeChapter, setScribeChapter] = useState('');
  const [scribeNotes, setScribeNotes] = useState('');
  const [scribeTags, setScribeTags] = useState('');
  const [showScribeDetails, setShowScribeDetails] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');

  const currentYear = new Date().getFullYear();
  const finishedThisYear = books.filter(b =>
    b.status === 'finished' && b.endDate?.startsWith(currentYear.toString())
  ).length;
  const goalPct = Math.min(100, Math.round((finishedThisYear / (yearlyGoal || 1)) * 100));

  const handleGoalSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(goalDraft, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 500) {
      showToast('Please enter a reading goal between 1 and 500', 'error');
      return;
    }
    saveGoal(parsed);
    setIsEditingGoal(false);
  };

  const handleLogReading = () => {
    toggleReadingToday();
  };

  const handleScribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scribeText.trim()) return;

    let targetBookId = scribeBookId;
    if (scribeBookId === 'create-new') {
      if (!newBookTitle.trim() || !newBookAuthor.trim()) {
        showToast('Please enter book title and author', 'error');
        return;
      }
      const nb = addBook(newBookTitle.trim(), newBookAuthor.trim(), 'reading');
      targetBookId = nb.id;
      setNewBookTitle('');
      setNewBookAuthor('');
    }

    if (!targetBookId) {
      showToast('Please select a book for this highlight', 'error');
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

    // Reset scribe
    setScribeText('');
    setScribePage('');
    setScribeChapter('');
    setScribeNotes('');
    setScribeTags('');
    setShowScribeDetails(false);
    setShowScribe(false);
    setScribeBookId(targetBookId);
    showToast('✦ Quote saved to your collection!');
  };

  return (
    <>
      <div className="home-tab fade-in">

        {/* Daily Quote */}
        <DailyQuote />

        {/* Reading Goal */}
        <div className="glass-card home-goal-card">
          <div className="home-goal-header">
            <span className="section-label">{currentYear} Reading Goal</span>
            {!isEditingGoal && (
              <button
                onClick={() => { setGoalDraft(String(yearlyGoal)); setIsEditingGoal(true); }}
                className="icon-btn"
                title="Edit goal"
                aria-label="Edit reading goal"
              >
                <EditIcon />
              </button>
            )}
          </div>

          {isEditingGoal ? (
            <form onSubmit={handleGoalSave} className="goal-edit-form">
              <label htmlFor="goal-input" className="form-label">Target Books</label>
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
                  {finishedThisYear}
                  <span className="home-goal-of"> of {yearlyGoal} books read</span>
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

        {/* Stats row */}
        <div className="dashboard-stats">
          <div className={`glass-card streak-card ${triggerStreakPop ? 'animate-streak-pop' : ''}`}>
            <FlameIcon className={triggerStreakPop ? 'animate-flame-pop' : ''} />
            <div>
              <div className="streak-number">{streak}</div>
              <div className="streak-label">Day Streak</div>
            </div>
          </div>
          <div className="glass-card stat-card">
            <span className="stat-label">Library</span>
            <span className="stat-value">
              {books.length}
              <span className="stat-unit"> books</span>
            </span>
            <span className="stat-label">{quotes.length} highlights</span>
          </div>
        </div>

        {/* Currently Reading */}
        {activeBooks.length > 0 ? (
          <div
            className="currently-reading-card glass-card"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-8)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 'var(--space-12)', overflow: 'hidden' }}>
              <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  flex: 1,
                  minWidth: 0,
                  transform: `translateX(${slideOffset}px)`,
                  opacity: isAnimating && (slideOffset === 320 || slideOffset === -320) ? 0 : 1,
                  transition: (isDragging || isSnapping) ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s',
                  cursor: activeBooks.length > 1 ? 'grab' : 'default',
                  touchAction: 'pan-y',
                }}
              >
                <div className="currently-reading-info" style={{ textAlign: 'left' }}>
                  <span className="section-label">Currently Reading</span>
                  <div className="currently-reading-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeBook.title}</div>
                  <div className="currently-reading-author" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>by {activeBook.author}</div>
                </div>
              </div>

              <button
                onClick={handleLogReading}
                className={`log-reading-btn ${hasLoggedToday ? 'logged' : ''}`}
                style={{ flexShrink: 0 }}
                aria-label="Log reading today"
              >
                {hasLoggedToday ? <CheckIcon /> : <FlameIcon />}
                <span>{hasLoggedToday ? 'Logged!' : 'Log Day'}</span>
              </button>
            </div>

            {/* Dots indicator */}
            {activeBooks.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '2px' }}>
                {activeBooks.map((_, idx) => (
                  <span
                    key={idx}
                    onClick={() => setActiveBookIndex(idx)}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: idx === safeActiveBookIndex ? 'var(--accent-color)' : 'var(--text-tertiary)',
                      opacity: idx === safeActiveBookIndex ? 1 : 0.35,
                      transition: 'opacity 0.2s, background-color 0.2s',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          (() => {
            const backlogBooks = books.filter(b => b.status === 'to-read');
            if (backlogBooks.length > 0) {
              return (
                <div 
                  className="currently-reading-empty glass-card interactive-card" 
                  style={{ 
                    borderStyle: 'dashed', 
                    borderWidth: '2px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 'var(--space-12)', 
                    alignItems: 'center', 
                    textAlign: 'center', 
                    padding: 'var(--space-20)' 
                  }}
                >
                  <div style={{ fontSize: '24px' }}>📚</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Start your next read</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    You have {backlogBooks.length} book{backlogBooks.length !== 1 ? 's' : ''} in your backlog.
                  </p>
                  
                  <div style={{ width: '100%', maxWidth: '240px', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
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
                            showToast(`Started reading "${targetBook.title}"!`);
                          }
                        }
                      }}
                    >
                      <option value="" disabled>Select from Backlog...</option>
                      {backlogBooks.map(b => (
                        <option key={b.id} value={b.id}>{b.title} ({b.author})</option>
                      ))}
                    </select>
                    
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>or</span>
                    
                    <button 
                      type="button" 
                      onClick={() => setShowAddBook(true)}
                      className="btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12px', width: '100%' }}
                    >
                      + Add a New Book
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div 
                className="currently-reading-empty glass-card interactive-card" 
                onClick={() => setShowAddBook(true)}
                style={{ 
                  borderStyle: 'dashed', 
                  borderWidth: '2px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 'var(--space-8)', 
                  alignItems: 'center', 
                  textAlign: 'center', 
                  padding: 'var(--space-24)' 
                }}
              >
                <div style={{ fontSize: '24px' }}>📖</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Start your next great read</div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  No active books on your shelf right now.
                </p>
                <button 
                  type="button" 
                  className="btn-primary"
                  style={{ marginTop: 'var(--space-8)', padding: '8px 16px', fontSize: '13px' }}
                >
                  + Add Book
                </button>
              </div>
            );
          })()
        )}

        {/* Action buttons */}
        <div className="home-actions">
          <button
            onClick={() => setShowAddBook(true)}
            className="btn-secondary home-action-btn"
          >
            + Add Book
          </button>
          <button
            onClick={() => setShowScribe(true)}
            className="btn-primary home-action-btn"
          >
            ✦ Add Quote
          </button>
        </div>
      </div>

      {/* Add Book Drawer */}
      {showAddBook && (
        <AddBookDrawer
          initialStatus="to-read"
          onClose={() => setShowAddBook(false)}
        />
      )}

      {/* Scribe Highlight Drawer */}
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
                <h3 id="scribe-drawer-title" className="drawer-title">Add a Quote</h3>
                <p className="drawer-subtitle">Capture a passage from your reading</p>
              </div>
              <button onClick={() => setShowScribe(false)} className="drawer-close-btn" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleScribeSubmit}>
              <div className="form-group">
                <label htmlFor="scribe-text" className="form-label">Quote / Passage</label>
                <textarea
                  id="scribe-text"
                  placeholder="Type or paste the highlight..."
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
                  {books.map(b => (
                    <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
                  ))}
                  <option value="create-new">+ Register New Book...</option>
                </select>
              </div>

              {scribeBookId === 'create-new' && (
                <div className="new-book-inline glass-card">
                  <div className="form-group">
                    <label htmlFor="new-book-title-inline" className="form-label">Book Title</label>
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
                {showScribeDetails ? '− Hide details' : '+ Page, chapter & tags'}
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
                  <label htmlFor="scribe-thoughts" className="form-label">Your Reflection</label>
                  <textarea id="scribe-thoughts" placeholder="Why does this stand out?" value={scribeNotes} onChange={e => setScribeNotes(e.target.value)} className="form-textarea scribe-notes-textarea" />
                </div>
                <div className="form-group">
                  <label htmlFor="scribe-tags" className="form-label">Tags (comma-separated)</label>
                  <input id="scribe-tags" type="text" placeholder="habits, discipline" value={scribeTags} onChange={e => setScribeTags(e.target.value)} className="form-input" />
                </div>
              </div>

              <div className="drawer-actions">
                <button type="submit" className="btn-primary">Save Quote</button>
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
