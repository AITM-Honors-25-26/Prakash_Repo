import React from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './ErrorPage.module.scss';
import wrongGif from '../../../img/gif/wrong.gif'


const ErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorType = searchParams.get('type');

  let errorTitle = "Oops! Wrong Turn...";
  let errorMessage = " We can't find the page you are searching for.";

  if (errorType === 'invalid-qr') {
    errorTitle = "Invalid QR Code";
    errorMessage = "The table you are looking for doesn't exist, or you might have scanned an invalid QR code.";
  }

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <div className={styles.iconWrapper}>
          <img src={wrongGif} alt="" />
          <h1 className={styles.title}>{errorTitle}</h1>
          <p className={styles.message}>{errorMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;