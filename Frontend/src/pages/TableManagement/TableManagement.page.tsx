import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/layout';
import styles from './TableManagementPage.module.scss';
import LoaderGif from './../../../img/gif/loading.gif';
import { API_ENDPOINTS } from '../../constants/constants';

const MySwal = withReactContent(Swal);

// --- Types ---
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
  const navigate = useNavigate();

  // --- Auth Helpers ---
  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.error("Session expired. Please log in again.");
    navigate('/login');
  }, [navigate]);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      handleSessionExpired();
      return null;
    }
    return { 
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
  }, [handleSessionExpired]);

  // --- Data Fetching ---
  const fetchTables = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.LISTALLTABLE);
      const data = response.data?.data || response.data?.result || response.data;
      if (Array.isArray(data)) {
        setTables(data);
      }
    } catch (error: unknown) {
      console.error("Fetch Error:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        handleSessionExpired();
      } else {
        toast.error("Failed to load floor plan.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setIsAdmin(userData.role === 'Admin');
      } catch (e) {
        console.error("User Parse Error", e);
      }
    }
    fetchTables();

    const interval = setInterval(() => fetchTables(false), 5000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  // --- Action Handlers ---
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
      showCancelButton: true,
      confirmButtonText: 'Create Table',
      confirmButtonColor: '#d84315',
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
      const config = getAuthHeader();
      if (!config) return;

      try {
        await axios.post(API_ENDPOINTS.ADDTABLE, formValues, config);
        toast.success(`Table ${formValues.tableNumber} added successfully!`);
        fetchTables(false);
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          handleSessionExpired();
        } else {
          toast.error("Failed to add new table.");
        }
      }
    }
  };

  const handleEditTable = async (table: RestaurantTable) => {
    const { value: formValues } = await MySwal.fire({
      title: `Edit Table ${table.tableNumber}`,
      background: '#faf7f2',
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <input id="swal-number" type="number" class="swal2-input" value="${table.tableNumber}">
          <input id="swal-capacity" type="number" class="swal2-input" value="${table.capacity}">
          <select id="swal-location" class="swal2-input">
            <option value="Indoor" ${table.location === 'Indoor' ? 'selected' : ''}>Indoor</option>
            <option value="Outdoor" ${table.location === 'Outdoor' ? 'selected' : ''}>Outdoor</option>
            <option value="Window" ${table.location === 'Window' ? 'selected' : ''}>Window</option>
            <option value="Balcony" ${table.location === 'Balcony' ? 'selected' : ''}>Balcony</option>
          </select>
          <select id="swal-status" class="swal2-input">
            <option value="Available" ${table.status === 'Available' ? 'selected' : ''}>Available</option>
            <option value="Occupied" ${table.status === 'Occupied' ? 'selected' : ''}>Occupied</option>
            <option value="Reserved" ${table.status === 'Reserved' ? 'selected' : ''}>Reserved</option>
            <option value="NotAvailable" ${table.status === 'NotAvailable' ? 'selected' : ''}>Not Available</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Table',
      confirmButtonColor: '#d84315',
      preConfirm: () => ({
        tableNumber: Number((document.getElementById('swal-number') as HTMLInputElement).value),
        capacity: Number((document.getElementById('swal-capacity') as HTMLInputElement).value),
        location: (document.getElementById('swal-location') as HTMLSelectElement).value,
        status: (document.getElementById('swal-status') as HTMLSelectElement).value,
      })
    });

    if (formValues) {
      const config = getAuthHeader();
      if (!config) return;

      try {
        await axios.put(`${API_ENDPOINTS.UPDATETABLE}/${table._id}`, formValues, config);
        setTables((prev) => prev.map((t) => t._id === table._id ? { ...t, ...formValues } : t));
        toast.success(`Table ${formValues.tableNumber} updated!`);
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          handleSessionExpired();
        } else {
          toast.error("Update failed.");
        }
      }
    }
  };

  const handleDeleteTable = async (id: string) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const { email } = JSON.parse(storedUser);

    const { value: password } = await MySwal.fire({
      title: 'Security Verification',
      text: `Enter password for ${email}`,
      input: 'password',
      showCancelButton: true,
      confirmButtonColor: '#d84315',
    });

    if (password) {
      const config = getAuthHeader();
      if (!config) return;

      try {
        await axios.delete(`${API_ENDPOINTS.DELETETABLE}/${id}`, {
          ...config,
          data: { password, email }
        });
        toast.success("Table removed.");
        setTables((prev) => prev.filter((t) => t._id !== id));
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          handleSessionExpired();
        } else {
          toast.error("Delete failed.");
        }
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
          <div className={styles.title}>
            <h1>Dining Area Management</h1>
            <p>Total Tables: <strong>{tables.length}</strong></p>
          </div>
          {isAdmin && (
            <button className={styles.addButton} onClick={handleAddTable}>
              <span>+</span> Add Table
            </button>
          )}
        </header>
        <div className={styles.grid}>
          {tables.length > 0 ? (
            tables.map((table) => (
              <div key={table._id} className={`${styles.profileCard} ${styles[table.status.toLowerCase()] || ''}`}>
                <div className={styles.imageSection}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.tableNumberLarge}>{table.tableNumber}</span>
                  </div>
                  <h2 className={styles.userName}>Table {table.tableNumber}</h2>
                  <p className={styles.statusText}>{table.status}</p>
                </div>
                <div className={styles.infoSection}>
                  <h3>Details</h3>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Capacity:</span>
                    <span className={styles.value}>{table.capacity} Guests</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Location:</span>
                    <span className={styles.value}>{table.location}</span>
                  </div>
                  <div className={styles.buttonGroup}>
                    <button className={styles.editButton} onClick={() => handleEditTable(table)}>Manage</button>
                    {isAdmin && (
                      <button className={styles.deleteButton} onClick={() => handleDeleteTable(table._id)}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.errorContainer}>
              <h2>No tables found.</h2>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TableManagement;