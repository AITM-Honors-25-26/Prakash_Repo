import React, { useEffect, useState } from 'react';
import styles from './PasswordConfirmModal.module.scss';

interface PasswordConfirmModalProps {
  title: string;
  message: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => void;
}

const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  title,
  message,
  isSubmitting = false,
  onCancel,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSubmitting, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required.');
      return;
    }
    onConfirm(password);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) onCancel();
  };

  return (
    <div className={styles.overlay} onMouseDown={handleBackdropClick} role="presentation">
      <form className={styles.modal} role="dialog" aria-modal="true" onSubmit={handleSubmit}>
        <h2>{title}</h2>
        <p>{message}</p>
        <input
          type="password"
          autoFocus
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          className={error ? styles.inputError : ''}
        />
        {error && <span className={styles.errorText}>{error}</span>}
        <div className={styles.actions}>
          <button type="button" onClick={onCancel} disabled={isSubmitting} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={styles.confirmButton}>
            {isSubmitting ? 'Please wait…' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordConfirmModal;
