import Button from './Button.jsx';
import './FormDone.css';

/**
 * Replaces a form after a successful save — keeps the page from looking unfinished.
 */
export default function FormDone({
  title = 'Saved',
  message,
  actionLabel = 'Continue',
  onContinue,
}) {
  return (
    <div className="form-done panel" role="status">
      <div className="form-done__mark" aria-hidden="true" />
      <p className="form-done__eyebrow">Complete</p>
      <h2 className="form-done__title">{title}</h2>
      {message && <p className="form-done__msg">{message}</p>}
      {onContinue && (
        <Button type="button" variant="clay" onClick={onContinue}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
