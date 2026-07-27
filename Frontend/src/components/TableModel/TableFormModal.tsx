import React, { useEffect, useState } from 'react';
import styles from './TableFormModal.module.scss';

export interface TableFormValues {
  tableNumber: number;
  capacity: number;
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
  status: 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable';
}

const EMPTY_VALUES: TableFormValues = {
  tableNumber: '' as unknown as number,
  capacity: '' as unknown as number,
  location: '' as unknown as TableFormValues['location'],
  status: '' as unknown as TableFormValues['status'],
};

interface TableFormModalProps {
  mode: 'add' | 'edit';
  initialValues?: TableFormValues;
  /** Shown next to the password field so the user knows which account they're confirming. */
  userEmail?: string;
  /** Add-table flow requires a password confirmation; edit does not. */
  requirePassword?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TableFormValues, password?: string) => void;
}

type FormErrors = Partial<Record<keyof TableFormValues | 'password', string>>;

const TableFormModal: React.FC<TableFormModalProps> = ({
  mode,
  initialValues,
  userEmail,
  requirePassword = false,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  // The parent only mounts this component while the modal is open (and remounts it
  // with a fresh `key` whenever it's opened for a different table), so these
  // initial values only need to be read once, right here — no reset-on-open effect needed.
  const [values, setValues] = useState<TableFormValues>(initialValues || EMPTY_VALUES);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSubmitting, onClose]);

  const setField = <K extends keyof TableFormValues>(field: K, value: TableFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!values.tableNumber || Number(values.tableNumber) <= 0) {
      next.tableNumber = 'Enter a table number greater than 0.';
    }
    if (!values.capacity || Number(values.capacity) <= 0) {
      next.capacity = 'Enter how many guests this table seats.';
    }
    if (!values.location) next.location = 'Choose a location.';
    if (!values.status) next.status = 'Choose a status.';
    if (requirePassword && !password) next.password = 'Password is required.';
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(
      {
        tableNumber: Number(values.tableNumber),
        capacity: Number(values.capacity),
        location: values.location,
        status: values.status,
      },
      requirePassword ? password : undefined
    );
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  return (
    <div className={styles.overlay} onMouseDown={handleBackdropClick} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="table-form-title">
        <div className={styles.modalHeader}>
          <h2 id="table-form-title">{mode === 'add' ? 'Create New Table' : `Manage Table ${initialValues?.tableNumber ?? ''}`}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="tableNumber">Table Number</label>
              <input
                id="tableNumber"
                type="number"
                min={1}
                value={values.tableNumber}
                onChange={(e) => setField('tableNumber', e.target.value as unknown as number)}
                className={errors.tableNumber ? styles.inputError : ''}
              />
              {errors.tableNumber && <span className={styles.errorText}>{errors.tableNumber}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="capacity">Capacity (Guests)</label>
              <input
                id="capacity"
                type="number"
                min={1}
                value={values.capacity}
                onChange={(e) => setField('capacity', e.target.value as unknown as number)}
                className={errors.capacity ? styles.inputError : ''}
              />
              {errors.capacity && <span className={styles.errorText}>{errors.capacity}</span>}
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="location">Location</label>
              <select
                id="location"
                value={values.location}
                onChange={(e) => setField('location', e.target.value as TableFormValues['location'])}
                className={errors.location ? styles.inputError : ''}
              >
                <option value="" disabled>Select location</option>
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Window">Window</option>
                <option value="Balcony">Balcony</option>
              </select>
              {errors.location && <span className={styles.errorText}>{errors.location}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={values.status}
                onChange={(e) => setField('status', e.target.value as TableFormValues['status'])}
                className={errors.status ? styles.inputError : ''}
              >
                <option value="" disabled>Select status</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Reserved">Reserved</option>
                <option value="NotAvailable">Not Available</option>
              </select>
              {errors.status && <span className={styles.errorText}>{errors.status}</span>}
            </div>
          </div>

          {requirePassword && (
            <div className={styles.field}>
              <label htmlFor="password">
                Confirm password{userEmail ? ` for ${userEmail}` : ''}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={errors.password ? styles.inputError : ''}
                placeholder="Your account password"
              />
              {errors.password && <span className={styles.errorText}>{errors.password}</span>}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.confirmButton} disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : mode === 'add' ? 'Create Table' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableFormModal;
