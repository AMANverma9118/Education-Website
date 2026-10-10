import './Input.css';

export default function Input({
  label,
  id,
  error,
  as = 'input',
  children,
  className = '',
  ...props
}) {
  const Tag = as;
  return (
    <label className={`field ${className}`.trim()} htmlFor={id}>
      {label && <span className="field__label">{label}</span>}
      <Tag id={id} className={`field__control ${error ? 'is-error' : ''}`} {...props}>
        {as === 'select' ? children : null}
      </Tag>
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}
