import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getLocalDateString } from '../services/storage';
import { DiscoveryQuoteCard } from './DiscoveryQuoteCard';

const BookmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill={filled ? 'var(--ribbon-color)' : 'none'} stroke={filled ? 'var(--ribbon-color)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export function DailyQuote() {
  const { quotes, books, toggleFavorite, showDiscoveryQuotes } = useAppContext();

  const hasSavedQuotes = quotes.length > 0;
  const [mode, setMode] = useState<'saved' | 'discover'>('saved');

  // Determine effective mode based on available quotes and preference
  const activeMode: 'saved' | 'discover' | 'empty' = hasSavedQuotes
    ? (mode === 'discover' && showDiscoveryQuotes ? 'discover' : 'saved')
    : (showDiscoveryQuotes ? 'discover' : 'empty');

  const userFavorites = quotes.filter(q => q.isFavorite);
  const dayKey = getLocalDateString();
  const dayNum = dayKey.split('-').reduce((acc, n) => acc + parseInt(n, 10), 0);

  const [shuffleCount, setShuffleCount] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setIsFading(false);
  }, [shuffleCount]);

  const handleShuffle = () => {
    setIsFading(true);
    setTimeout(() => setShuffleCount(c => c + 1), 130);
  };

  const getSavedQuote = useCallback(() => {
    const pool = userFavorites.length > 0 ? userFavorites : quotes;
    if (pool.length === 0) return null;
    const q = pool[(dayNum + shuffleCount) % pool.length];
    const book = books.find(b => b.id === q.bookId);
    return {
      text: q.text,
      source: book?.title || '',
      author: book?.author || '',
      quoteId: q.id,
      isFavorite: q.isFavorite,
    };
  }, [userFavorites, quotes, books, dayNum, shuffleCount]);

  const modeToggle = hasSavedQuotes && showDiscoveryQuotes ? (
    <div className="quote-mode-switch" role="tablist" aria-label="Passage source">
      <button
        type="button"
        role="tab"
        aria-selected={activeMode === 'saved'}
        onClick={() => setMode('saved')}
        className={`quote-mode-btn ${activeMode === 'saved' ? 'active' : ''}`}
      >
        Yours
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeMode === 'discover'}
        onClick={() => setMode('discover')}
        className={`quote-mode-btn ${activeMode === 'discover' ? 'active' : ''}`}
      >
        Discover
      </button>
    </div>
  ) : null;

  if (activeMode === 'discover') {
    return (
      <section className="home-quote-section" aria-label="Book discovery">
        {modeToggle && <div className="home-quote-switch-bar">{modeToggle}</div>}
        <DiscoveryQuoteCard />
      </section>
    );
  }

  if (activeMode === 'empty') {
    return (
      <div className="daily-quote-card daily-quote-card--empty">
        <span className="daily-quote-label">
          <BookmarkIcon />
          <span>From your highlights</span>
        </span>
        <p className="daily-quote-empty-note">
          Passages you save while reading will resurface here.
        </p>
      </div>
    );
  }

  const current = getSavedQuote();
  if (!current) return null;

  return (
    <section className="home-quote-section" aria-label="Saved highlight">
      {modeToggle && <div className="home-quote-switch-bar">{modeToggle}</div>}
      <div className="daily-quote-card">
        <div className="daily-quote-header">
          <span className="daily-quote-label">
            <BookmarkIcon />
            <span>From your highlights</span>
          </span>
          <div className="daily-quote-header-actions">
            <button
              type="button"
              className={`daily-quote-action-btn ${current.isFavorite ? 'active' : ''}`}
              onClick={() => toggleFavorite(current.quoteId)}
              aria-label={current.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <HeartIcon filled={current.isFavorite} />
            </button>
            {quotes.length > 1 && (
              <button
                type="button"
                className="daily-quote-action-btn"
                onClick={handleShuffle}
                aria-label="Show another saved highlight"
                title="Show another saved highlight"
              >
                <ShuffleIcon />
              </button>
            )}
          </div>
        </div>

        <div className={`daily-quote-content-wrapper ${isFading ? 'faded' : ''}`}>
          <blockquote className="daily-quote-text">
            &ldquo;{current.text}&rdquo;
          </blockquote>

          {(current.source || current.author) && (
            <p className="daily-quote-source">
              {current.source && <strong>{current.source}</strong>}
              {current.source && current.author && ', '}
              {current.author && <span>{current.author}</span>}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
