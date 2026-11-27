import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CURATED_LITERARY_QUOTES, getLocalDateString } from '../services/storage';

const CompassIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const ShuffleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" /><path d="M5 12h14" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface DiscoveryQuoteCardProps {
  seedOffset?: number;
  headerRight?: React.ReactNode;
  showDisableLink?: boolean;
}

export function DiscoveryQuoteCard({
  seedOffset = 0,
  headerRight,
  showDisableLink = false,
}: DiscoveryQuoteCardProps) {
  const { books, addBook, showToast, toggleDiscoveryQuotes } = useAppContext();

  const dayKey = getLocalDateString();
  const dayNum = dayKey.split('-').reduce((acc, n) => acc + parseInt(n, 10), 0);

  const [shuffleCount, setShuffleCount] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    setIsFading(false);
  }, [shuffleCount]);

  // Prefer books not yet in the user's library; fall back to full list if all added
  const ownedTitles = useMemo(
    () => new Set(books.map(b => b.title.trim().toLowerCase())),
    [books]
  );

  const pool = useMemo(() => {
    const unread = CURATED_LITERARY_QUOTES.filter(
      q => !ownedTitles.has(q.bookTitle.trim().toLowerCase())
    );
    return unread.length > 0 ? unread : CURATED_LITERARY_QUOTES;
  }, [ownedTitles]);

  const current = pool[(dayNum + seedOffset + shuffleCount) % pool.length];
  const isAlreadyInLibrary = ownedTitles.has(current.bookTitle.trim().toLowerCase());

  const handleShuffle = () => {
    setIsFading(true);
    setTimeout(() => setShuffleCount(c => c + 1), 130);
  };

  const handleAddWantToRead = () => {
    if (isAlreadyInLibrary) return;
    addBook(current.bookTitle, current.author, 'to-read');
    showToast(`Added "${current.bookTitle}" to Want to read`);
  };

  return (
    <div className="discovery-card" aria-label="Book discovery suggestion">
      <div className="discovery-card-header">
        <div className="discovery-badge-group">
          <span className="discovery-badge">
            <CompassIcon />
            <span>Book discovery</span>
          </span>
          <span className="discovery-genre">{current.genre}</span>
        </div>

        <div className="discovery-header-actions">
          {headerRight}
          <button
            type="button"
            className="daily-quote-action-btn"
            onClick={handleShuffle}
            aria-label="Show another book suggestion"
            title="Show another book suggestion"
          >
            <ShuffleIcon />
          </button>
        </div>
      </div>

      <div className={`daily-quote-content-wrapper ${isFading ? 'faded' : ''}`}>
        <blockquote className="discovery-quote-text">
          &ldquo;{current.text}&rdquo;
        </blockquote>

        <div className="discovery-footer">
          <div className="discovery-source">
            <strong>{current.bookTitle}</strong>
            <span>{current.author}</span>
          </div>

          <button
            type="button"
            onClick={handleAddWantToRead}
            disabled={isAlreadyInLibrary}
            className={`discovery-add-btn ${isAlreadyInLibrary ? 'added' : ''}`}
          >
            {isAlreadyInLibrary ? <CheckIcon /> : <PlusIcon />}
            <span>{isAlreadyInLibrary ? 'On shelf' : 'Want to read'}</span>
          </button>
        </div>
      </div>

      {showDisableLink && (
        <div className="discovery-prefs-row">
          <span className="discovery-prefs-hint">Suggested from books you might enjoy</span>
          <button
            type="button"
            onClick={toggleDiscoveryQuotes}
            className="discovery-prefs-btn"
          >
            Turn off
          </button>
        </div>
      )}
    </div>
  );
}
