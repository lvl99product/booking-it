import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { QuoteCard } from './QuoteCard';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
    fill={filled ? '#ff3b30' : 'none'} stroke={filled ? '#ff3b30' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const HighlightsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" /><path d="M6 10h10" /><path d="M6 14h10" />
  </svg>
);

type SortOption = 'newest' | 'oldest' | 'book';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  book: 'By Book',
};

export function HighlightsTab() {
  const { quotes, books, getBookById } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const allTags = useMemo(() =>
    Array.from(new Set(quotes.flatMap(q => q.tags))).sort(),
    [quotes]
  );

  const filteredQuotes = useMemo(() => {
    let result = quotes.filter(quote => {
      const matchesSearch = !searchQuery ||
        quote.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quote.notes && quote.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesBook = !selectedBookId || quote.bookId === selectedBookId;
      const matchesTag = !selectedTag || quote.tags.includes(selectedTag);
      const matchesFavorite = !favoriteOnly || quote.isFavorite;
      return matchesSearch && matchesBook && matchesTag && matchesFavorite;
    });

    if (sortBy === 'oldest') result = [...result].sort((a, b) => a.createdAt - b.createdAt);
    else if (sortBy === 'book') result = [...result].sort((a, b) => {
      const bookA = getBookById(a.bookId)?.title ?? '';
      const bookB = getBookById(b.bookId)?.title ?? '';
      return bookA.localeCompare(bookB);
    });
    else result = [...result].sort((a, b) => b.createdAt - a.createdAt); // newest

    return result;
  }, [quotes, searchQuery, selectedBookId, selectedTag, favoriteOnly, sortBy, getBookById]);

  const hasActiveFilters = selectedBookId || selectedTag || searchQuery || favoriteOnly;

  const clearAllFilters = () => {
    setSelectedBookId(null);
    setSelectedTag(null);
    setSearchQuery('');
    setFavoriteOnly(false);
  };

  return (
    <div className="highlights-tab fade-in">
      {/* Search + Favorite toggle */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search highlights..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            aria-label="Search highlights"
          />
        </div>
        <button
          onClick={() => setFavoriteOnly(!favoriteOnly)}
          className={`action-btn filter-btn ${favoriteOnly ? 'active' : ''}`}
          title="Favorites only"
          aria-label="Show favorites only"
          aria-pressed={favoriteOnly}
        >
          <HeartIcon filled={favoriteOnly} />
        </button>
      </div>

      {/* Book filter + Sort */}
      <div className="highlights-controls">
        {books.length > 0 && (
          <select
            value={selectedBookId || ''}
            onChange={e => setSelectedBookId(e.target.value || null)}
            className="form-select highlights-book-filter"
            aria-label="Filter by book"
          >
            <option value="">All Books</option>
            {books.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        )}
        <div className="sort-toggle" role="group" aria-label="Sort order">
          {(Object.keys(SORT_LABELS) as SortOption[]).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`sort-btn ${sortBy === s ? 'active' : ''}`}
              aria-pressed={sortBy === s}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="filter-chips">
          {selectedBookId && (
            <span className="filter-chip">
              📖 {getBookById(selectedBookId)?.title}
              <button onClick={() => setSelectedBookId(null)} className="filter-chip-remove" aria-label="Remove book filter">×</button>
            </span>
          )}
          {selectedTag && (
            <span className="filter-chip">
              #{selectedTag}
              <button onClick={() => setSelectedTag(null)} className="filter-chip-remove" aria-label="Remove tag filter">×</button>
            </span>
          )}
          {favoriteOnly && (
            <span className="filter-chip filter-chip--heart">
              ❤️ Favorites
              <button onClick={() => setFavoriteOnly(false)} className="filter-chip-remove" aria-label="Remove favorites filter">×</button>
            </span>
          )}
          <button onClick={clearAllFilters} className="clear-filters-btn">Clear all</button>
        </div>
      )}

      {/* Tag pill bar */}
      {allTags.length > 0 && (
        <div className="tag-scroll-container">
          <div className="tag-scroll" role="list" aria-label="Filter by tag">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`tag tag--btn ${selectedTag === tag ? 'active' : ''}`}
                role="listitem"
                aria-pressed={selectedTag === tag}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quote count */}
      <div className="highlights-count">
        {filteredQuotes.length} highlight{filteredQuotes.length !== 1 ? 's' : ''}
        {hasActiveFilters && ` · filtered`}
      </div>

      {/* Quote list */}
      <div className="quote-list">
        {filteredQuotes.length > 0 ? (
          filteredQuotes.map(quote => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onTagClick={tag => setSelectedTag(tag === selectedTag ? null : tag)}
            />
          ))
        ) : (
          <div className="empty-state">
            <HighlightsIcon />
            <h3>No highlights found</h3>
            <p>{hasActiveFilters ? 'Try clearing some filters.' : 'Scribe your first highlight from the Home tab.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
