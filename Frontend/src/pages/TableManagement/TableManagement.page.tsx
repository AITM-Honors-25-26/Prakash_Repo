import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Layout from '../../components/layout/layout';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
      const data = response.data?.data || response.data?.result || response.data;
      if (Array.isArray(data)) setTables(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // Handler for adding a new table (You can replace this with a modal or redirect)
  const handleAddTable = () => {
    console.log("Add New Table clicked. Open a modal or redirect to a form.");
    // Example: navigate('/add-table') or setIsAddModalOpen(true);
  };

  // Handler for deleting a table
  const handleDeleteTable = async (id: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this table?");
    
    if (isConfirmed) {
      try {
        // Uncomment and update with your actual delete endpoint:
        // await axios.delete(`${API_ENDPOINTS.DELETETABLE}/${id}`);
        
        // Optimistically update the UI by removing the deleted table
        setTables((prevTables) => prevTables.filter((table) => table._id !== id));
        console.log(`Table ${id} deleted successfully.`);
      } catch (error) {
        console.error("Failed to delete table:", error);
        alert("There was an error deleting the table.");
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading..." />
          <h1>Loading Floor Plan...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.pageContainer}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Dining Area Management</h1>
            <p>Total Tables: <strong>{tables.length}</strong></p>
          </div>
          {/* ADD TABLE BUTTON */}
          <button className={styles.addButton} onClick={handleAddTable}>
            + Add New Table
          </button>
        </header>

        <div className={styles.grid}>
          {tables.length > 0 ? (
            tables.map((table) => {
              const statusClass = table.status.toLowerCase();

              return (
                <div key={table._id} className={`${styles.profileCard} ${styles[statusClass]}`}>
                  {/* Left/Top Section */}
                  <div className={styles.imageSection}>
                    <div className={styles.iconWrapper}>
                       <span className={styles.tableNumberLarge}>{table.tableNumber}</span>
                    </div>
                    <h2 className={styles.userName}>Table {table.tableNumber}</h2>
                    <p className={`${styles.userRole} ${styles.statusText}`}>{table.status}</p>
                  </div>

                  {/* Right/Bottom Section */}
                  <div className={styles.infoSection}>
                    <h3>Table Details</h3>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Capacity:</span>
                      <span className={styles.value}>{table.capacity} Guests</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Location:</span>
                      <span className={styles.value}>{table.location}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.label}>Status:</span>
                      <span className={`${styles.value} ${styles.statusBadge}`}>{table.status}</span>
                    </div>
                    
                    <div className={styles.buttonGroup}>
                      <button className={styles.editButton}>Manage</button>
                      {/* DELETE TABLE BUTTON */}
                      <button 
                        className={styles.deleteButton} 
                        onClick={() => handleDeleteTable(table._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.errorContainer}>
              <h2>No tables found.</h2>
              <p>Add some tables in the database to see them here.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TableManagement;