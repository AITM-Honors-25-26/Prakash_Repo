import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './TableManagementPage.module.scss';
import { API_ENDPOINTS } from '../../constants/constants';

import LoaderGif from './../../../img/gif/loading.gif';

export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable';
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
}

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // 2. Renamed state for clarity

  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ensure this endpoint exists in your constants.tsx
      const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
      const data = response.data?.data || response.data?.result || response.data;
      
      if (Array.isArray(data)) {
        setTables(data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // 3. Render Loading State using the renamed Image import
  if (isLoading) {
    return (
      <div className={styles.loader}>
        <img src={LoaderGif} alt="Loading..." />
        <h1>Loading Floor Plan...</h1>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Floor Plan</h1>
        <div className={styles.stats}>
          Total Tables: <strong>{tables.length}</strong>
        </div>
      </header>

      <div className={styles.grid}>
        {tables.length > 0 ? (
          tables.map((table) => {
            const statusClass = table.status.toLowerCase();

            return (
              <div 
                key={table._id} 
                className={`${styles.card} ${styles[statusClass]}`}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.tableId}>T-{table.tableNumber}</span>
                  <span className={`${styles.badge} ${styles[statusClass]}`}>
                    {table.status}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.infoRow}>
                    <span>Capacity:</span>
                    <strong>{table.capacity} Guests</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Location:</span>
                    <strong>{table.location}</strong>
                  </div>
                </div>

                <button className={styles.button}>View Details</button>
              </div>
            );
          })
        ) : (
          <p className={styles.noData}>No tables found in the database.</p>
        )}
      </div>
    </div>
  );
};

export default TableManagement;