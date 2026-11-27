import { useState } from 'react';
import type { Quote } from '../types';
import { useAppContext } from '../context/AppContext';
import { BookCover } from './BookCover';

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill={filled ? 'var(--ribbon-color)' : 'none'} stroke={filled ? 'var(--ribbon-color)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface QuoteCardProps {
  quote: Quote;
  onTagClick: (tag: string) => void;
}

export function QuoteCard({ quote, onTagClick }: QuoteCardProps) {
  const { getBookById, toggleFavorite, deleteQuote, updateQuote, showConfirm, showToast } = useAppContext();
  const book = getBookById(quote.bookId);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(quote.text);
  const [editNotes, setEditNotes] = useState(quote.notes || '');
  const [editTags, setEditTags] = useState(quote.tags.join(', '));

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    updateQuote({
      ...quote,
      text: editText.trim(),
      notes: editNotes.trim() || undefined,
      tags: editTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
    });
    setIsEditing(false);
    showToast('Highlight updated');
  };

  const handleCancelEdit = () => {
    setEditText(quote.text);
    setEditNotes(quote.notes || '');
    setEditTags(quote.tags.join(', '));
    setIsEditing(false);
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Delete Highlight?',
      message: 'This quote will be permanently removed from your collection.',
      confirmLabel: 'Delete',
      isDanger: true,
      onConfirm: () => {
        deleteQuote(quote.id);
        showToast('Highlight removed');
      },
    });
  };

  return (
    <div className="quote-card glass-card">
      {isEditing ? (
        <div className="quote-edit-form">
          <textarea
            className="form-textarea quote-edit-textarea"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            autoFocus
            aria-label="Edit quote text"
          />
          <input
            className="form-input"
            placeholder="Your notes (optional)"
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            aria-label="Edit notes"
          />
          <input
            className="form-input"
            placeholder="Tags, comma-separated"
            value={editTags}
            onChange={e => setEditTags(e.target.value)}
            aria-label="Edit tags"
          />
          <div className="quote-edit-actions">
            <button className="btn-primary quote-edit-save" onClick={handleSaveEdit} aria-label="Save edits">
              <CheckIcon /> Save
            </button>
            <button className="btn-secondary quote-edit-cancel" onClick={handleCancelEdit} aria-label="Cancel editing">
              <XIcon /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="quote-card-accent" />
          <div className="quote-card-body">
            <blockquote className="quote-text">&ldquo;{quote.text}&rdquo;</blockquote>

            <div className="quote-source">
              {book && (
                <BookCover
                  coverColor={book.coverColor}
                  coverUrl={book.coverUrl}
                  title={book.title}
                  author={book.author}
                  size="mini"
                />
              )}
              <div className="quote-source-info">
                <div className="quote-book-title">{book?.title ?? 'Unknown Book'}</div>
                <div className="quote-book-author">{book?.author ?? 'Unknown'}</div>
                {(quote.chapter || quote.page) && (
                  <div className="quote-location">
                    {quote.chapter}{quote.chapter && quote.page && ', '}{quote.page && `p. ${quote.page}`}
                  </div>
                )}
              </div>
            </div>

            {quote.notes && (
              <div className="quote-notes">{quote.notes}</div>
            )}

            <div className="quote-footer">
              <div className="quote-tags">
                {quote.tags.map(tag => (
                  <button
                    key={tag}
                    className="tag"
                    onClick={() => onTagClick(tag)}
                    aria-label={`Filter by tag ${tag}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              <div className="quote-actions">
                <button
                  onClick={() => setIsEditing(true)}
                  className="action-btn"
                  title="Edit highlight"
                  aria-label="Edit highlight"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => toggleFavorite(quote.id)}
                  className={`action-btn favorite ${quote.isFavorite ? 'active' : ''}`}
                  title={quote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  aria-label={quote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={quote.isFavorite}
                >
                  <HeartIcon filled={quote.isFavorite} />
                </button>
                <button
                  onClick={handleDelete}
                  className="action-btn action-btn--delete"
                  title="Delete highlight"
                  aria-label="Delete highlight"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
