import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Layout from '../../components/layout/layout';
import styles from './TableManagementPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS } from '../../constants/constants';

const MySwal = withReactContent(Swal);

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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // 1. Fetch Tables
  const fetchTables = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
      const data = response.data?.data || response.data?.result || response.data;
      if (Array.isArray(data)) {
        setTables(data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load floor plan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAdmin(userData.role === 'Admin');
      } catch (e) {
        console.error("Parsing Error", e);
      }
    }
    fetchTables();
  }, [fetchTables]);

  // 2. Add Table Function
  const handleAddTable = async () => {
    const { value: formValues } = await MySwal.fire({
      title: 'Add New Table Details',
      background: '#faf7f2',
      color: '#2d1b18',
      html: `
        <input id="swal-number" type="number" class="swal2-input" placeholder="Table Number">
        <input id="swal-capacity" type="number" class="swal2-input" placeholder="Capacity (Guests)">
        <select id="swal-location" class="swal2-input">
          <option value="Indoor">Indoor</option>
          <option value="Outdoor">Outdoor</option>
          <option value="Window">Window</option>
          <option value="Balcony">Balcony</option>
        </select>
        <select id="swal-status" class="swal2-input">
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Reserved">Reserved</option>
          <option value="NotAvailable">Not Available</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Create Table',
      confirmButtonColor: '#d84315',
      cancelButtonColor: '#2d1b18',
      preConfirm: () => {
        const tableNumber = (document.getElementById('swal-number') as HTMLInputElement).value;
        const capacity = (document.getElementById('swal-capacity') as HTMLInputElement).value;
        if (!tableNumber || !capacity) {
          Swal.showValidationMessage('Table Number and Capacity are required');
          return false;
        }
        return {
          tableNumber: Number(tableNumber),
          capacity: Number(capacity),
          location: (document.getElementById('swal-location') as HTMLSelectElement).value,
          status: (document.getElementById('swal-status') as HTMLSelectElement).value,
        };
      }
    });

    if (formValues) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(API_ENDPOINTS.ADDTABLE, formValues, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        toast.success(`Table ${formValues.tableNumber} added successfully!`);
        await fetchTables(false);
      } catch {
        toast.error("Failed to add new table.");
      }
    }
  };

  // 3. Delete Table Function
  const handleDeleteTable = async (id: string) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const userData = JSON.parse(storedUser);
    const userEmail = userData.email;

    const { value: password } = await MySwal.fire({
      title: 'Security Verification',
      text: `Enter password for ${userEmail} to delete table`,
      input: 'password',
      showCancelButton: true,
      confirmButtonColor: '#d84315',
    });

    if (password) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_ENDPOINTS.DELETETABLE}/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: { password: password, email: userEmail }
        });

        toast.success("Table removed.");
        await fetchTables(false);
      } catch {
        toast.error("Delete failed.");
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
          {isAdmin && (
            <button className={styles.addButton} onClick={handleAddTable}>
              + Add New Table
            </button>
          )}
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
                      {isAdmin && (
                        <button 
                          className={styles.deleteButton} 
                          onClick={() => handleDeleteTable(table._id)}
                        >
                          Delete
                        </button>
                      )}
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