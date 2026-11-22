import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CURATED_LITERARY_QUOTES, getLocalDateString } from '../services/storage';

const ShuffleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill={filled ? '#ff3b30' : 'none'} stroke={filled ? '#ff3b30' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

export function DailyQuote() {
  const { quotes, books, toggleFavorite } = useAppContext();

  // Determine pool: user's favorites first, then all user quotes, then curated
  const userFavorites = quotes.filter(q => q.isFavorite);
  const allUserQuotes = quotes;

  // Pick a "daily" quote — seeded by day so it stays stable within a day
  const dayKey = getLocalDateString();
  const dayNum = dayKey.split('-').reduce((acc, n) => acc + parseInt(n), 0);

  const [shuffleCount, setShuffleCount] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setIsFading(false);
  }, [shuffleCount]);

  const handleShuffle = () => {
    setIsFading(true);
    setTimeout(() => {
      setShuffleCount(c => c + 1);
    }, 150);
  };

  const getQuote = useCallback(() => {
    const seed = (dayNum + shuffleCount);
    if (userFavorites.length > 0) {
      const idx = seed % userFavorites.length;
      const q = userFavorites[idx];
      const book = books.find(b => b.id === q.bookId);
      return { text: q.text, source: book?.title || '', author: book?.author || '', quoteId: q.id, isFavorite: q.isFavorite };
    }
    if (allUserQuotes.length > 0) {
      const idx = seed % allUserQuotes.length;
      const q = allUserQuotes[idx];
      const book = books.find(b => b.id === q.bookId);
      return { text: q.text, source: book?.title || '', author: book?.author || '', quoteId: q.id, isFavorite: q.isFavorite };
    }
    // Fall back to curated
    const idx = seed % CURATED_LITERARY_QUOTES.length;
    const c = CURATED_LITERARY_QUOTES[idx];
    return { text: c.text, source: c.bookTitle, author: c.author, quoteId: null, isFavorite: false };
  }, [userFavorites, allUserQuotes, books, dayNum, shuffleCount]);

  const current = getQuote();

  return (
    <div className="daily-quote-card">
      <div className="daily-quote-header">
        <span className="daily-quote-label">✦ Daily Quote</span>
        <div className="daily-quote-header-actions">
          {current.quoteId && (
            <button
              className={`daily-quote-action-btn ${current.isFavorite ? 'active' : ''}`}
              onClick={() => toggleFavorite(current.quoteId!)}
              aria-label={current.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <HeartIcon filled={current.isFavorite} />
            </button>
          )}
          <button
            className="daily-quote-action-btn"
            onClick={handleShuffle}
            aria-label="Shuffle quote"
          >
            <ShuffleIcon />
          </button>
        </div>
      </div>

      <div className={`daily-quote-content-wrapper ${isFading ? 'faded' : ''}`}>
        <blockquote className="daily-quote-text">
          &ldquo;{current.text}&rdquo;
        </blockquote>

        {(current.source || current.author) && (
          <p className="daily-quote-source">
            {current.source && <strong>{current.source}</strong>}
            {current.source && current.author && ' · '}
            {current.author && <span>{current.author}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
