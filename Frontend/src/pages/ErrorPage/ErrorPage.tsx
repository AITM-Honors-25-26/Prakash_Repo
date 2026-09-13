import React from 'react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ErrorPage.module.scss';
import wrongGif from '../../../img/gif/wrong.gif'
import { API_ENDPOINTS } from '../../constants/constants';

const ErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const errorType = searchParams.get('type');
  const [availableTables, setAvailableTables] = useState<number[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const state = location.state as { title?: string; message?: string; showTableChoices?: boolean } | null;

  let errorTitle = state?.title || "Oops! Wrong Turn...";
  let errorMessage = state?.message || "We can't find the page you are searching for.";

  if (errorType === 'invalid-qr') {
    errorTitle = "Invalid QR Code";
    errorMessage = "The table you are looking for doesn't exist, or you might have scanned an invalid QR code.";
  }

  const showTableChoices = state?.showTableChoices || errorType === 'table-unavailable';

  useEffect(() => {
    if (!showTableChoices) return;

    setLoadingTables(true);
    axios
      .get(API_ENDPOINTS.AVAILABLE_TABLES)
      .then(({ data }) => {
        const tables: unknown[] = Array.isArray(data?.data) ? data.data : [];
        setAvailableTables(tables.filter((table): table is number => Number.isInteger(table)));
      })
      .catch(() => setAvailableTables([]))
      .finally(() => setLoadingTables(false));
  }, [showTableChoices]);

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard}>
        <div className={styles.iconWrapper}>
          <img src={wrongGif} alt="" />
          <h1 className={styles.title}>{errorTitle}</h1>
          <p className={styles.message}>{errorMessage}</p>
          {showTableChoices && (
            <>
              <h2 className={styles.choiceTitle}>Choose another table</h2>
              {loadingTables ? (
                <p className={styles.message}>Loading available tables...</p>
              ) : availableTables.length > 0 ? (
                <div className={styles.tableChoices}>
                  {availableTables.map((tableNumber) => (
                    <button
                      key={tableNumber}
                      type="button"
                      className={styles.tableButton}
                      onClick={() => navigate(`/MenuPage/${tableNumber}`)}
                    >
                      Table {tableNumber}
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.message}>No other tables are available right now.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;