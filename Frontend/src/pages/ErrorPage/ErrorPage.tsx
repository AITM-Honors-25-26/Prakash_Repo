import React from 'react';
import {  useLocation } from 'react-router-dom';
import styles from './ErrorPage.module.scss';
import wrong from '../../../img/gif/wrong.webp'

interface LocationState {
  title?: string;
  message?: string;
}

const ErrorPage: React.FC = () => {
  const location = useLocation();
  
  const state = location.state as LocationState;
  const errorTitle = state?.title || "Oops! Something went wrong.";
  const errorMessage = state?.message || "The table you are looking for doesn't exist, or you might have scanned an invalid QR code.";

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <div className={styles.iconWrapper}>
          <img src={wrong} alt="" />
        </div>
        <h1 className={styles.title}>hello{errorTitle}</h1>
        <p className={styles.message}>{errorMessage}</p>

      </div>
    </div>
  );
};

export default ErrorPage;