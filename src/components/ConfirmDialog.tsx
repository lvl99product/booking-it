
import { useAppContext } from '../context/AppContext';

export function ConfirmDialog() {
  const { confirmOptions, dismissConfirm } = useAppContext();

  if (!confirmOptions) return null;

  const handleConfirm = () => {
    confirmOptions.onConfirm();
    dismissConfirm();
  };

  return (
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={dismissConfirm}
    >
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__handle" />
        <h3 id="confirm-dialog-title" className="confirm-dialog__title">
          {confirmOptions.title}
        </h3>
        <p className="confirm-dialog__message">{confirmOptions.message}</p>
        <div className="confirm-dialog__actions">
          <button
            onClick={dismissConfirm}
            className="btn-secondary confirm-dialog__cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={confirmOptions.isDanger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmOptions.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
