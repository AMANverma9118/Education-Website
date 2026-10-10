import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  loading = false,
  loadingText,
  disabled,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`btn btn--${variant} ${loading ? 'btn--loading' : ''} ${className}`.trim()}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span className="btn__label">{loading ? loadingText || children : children}</span>
    </button>
  );
}
