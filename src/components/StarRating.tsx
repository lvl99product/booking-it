

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
}

const StarIcon = ({ filled, size = 18 }: { filled: boolean; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'var(--star-color)' : 'none'}
    stroke={filled ? 'var(--star-color)' : 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export function StarRating({ value, onChange, size = 18, readonly = false }: StarRatingProps) {
  if (readonly) {
    return (
      <div className="stars-display" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map(num => (
          <StarIcon key={num} filled={value >= num} size={size} />
        ))}
      </div>
    );
  }

  return (
    <div className="stars-container" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(num => (
        <button
          key={num}
          type="button"
          onClick={() => onChange?.(num === value ? 0 : num)}
          className={`star-button ${value >= num ? 'active' : ''}`}
          aria-label={`${num} star${num > 1 ? 's' : ''}`}
          aria-pressed={value >= num}
        >
          <StarIcon filled={value >= num} size={size} />
        </button>
      ))}
    </div>
  );
}
