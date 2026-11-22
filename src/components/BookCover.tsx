import { useState, useEffect } from 'react';

interface BookCoverProps {
  coverColor: string;
  coverUrl?: string;
  title: string;
  author: string;
  size?: 'mini' | 'large';
  quoteCount?: number;
  rating?: number;
  status?: 'reading' | 'finished' | 'to-read';
}

export function BookCover({ coverColor, coverUrl, title, author, size = 'large', quoteCount, rating, status }: BookCoverProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [coverUrl]);

  const showImage = coverUrl && !imageError;

  if (size === 'mini') {
    return (
      <div className="book-cover-mini" style={{ background: coverColor }}>
        {showImage ? (
          <img 
            src={coverUrl} 
            alt={title} 
            className="book-cover-img"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              zIndex: 0 
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <>
            <span className="cover-title-text" style={{ zIndex: 1 }}>{title}</span>
            <span className="cover-author-text" style={{ zIndex: 1 }}>{author}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="book-cover-large" style={{ background: coverColor }}>
      {showImage ? (
        <img 
          src={coverUrl} 
          alt={title} 
          className="book-cover-img"
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            zIndex: 0 
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="book-cover-large-title" style={{ zIndex: 1 }}>{title}</div>
      )}

      {status && (
        <span 
          className={`book-status-badge book-status-badge--${status}`} 
          style={{ zIndex: 1, textShadow: showImage ? '0 1px 3px rgba(0,0,0,0.3)' : 'none' }}
        >
          {status === 'reading' && 'Reading'}
          {status === 'finished' && 'Finished'}
          {status === 'to-read' && 'To Read'}
        </span>
      )}

      <div className="book-cover-meta" style={{ zIndex: 1 }}>
        {!showImage && (
          <div className="book-cover-large-author">by {author}</div>
        )}
        <div className="book-cover-badges">
          {rating !== undefined && rating > 0 && (
            <span className="book-cover-rating" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {'★'.repeat(rating)}
            </span>
          )}
          {quoteCount !== undefined && quoteCount > 0 && (
            <span className="book-cover-quote-count" style={{ backdropFilter: showImage ? 'blur(4px)' : 'none', background: showImage ? 'rgba(0,0,0,0.45)' : undefined }}>
              {quoteCount} 💬
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
