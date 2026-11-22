import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface ToastItemProps {
  id: string;
  text: string;
  type: 'success' | 'error';
}

function ToastItem({ id, text, type }: ToastItemProps) {
  const { dismissToast } = useAppContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`toast toast--${type} ${visible ? 'toast--visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast__icon">
        {type === 'success' ? <CheckIcon /> : <AlertIcon />}
      </span>
      <span className="toast__text">{text}</span>
      <button
        className="toast__close"
        onClick={() => dismissToast(id)}
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useAppContext();

  return (
    <div className="toast-container" aria-label="Notifications" aria-live="polite">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
