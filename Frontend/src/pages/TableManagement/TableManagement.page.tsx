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

  // --- Auth & Session Helpers ---
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
      if (Array.isArray(data)) setTables(data);
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

  // --- Reusable Authorized Action Logic ---
  const requestPasswordConfirm = async (actionTitle: string) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    const { email } = JSON.parse(storedUser);

    const { value: password } = await MySwal.fire({
      title: 'Security Verification',
      text: `Confirm password for ${email} to ${actionTitle}`,
      input: 'password',
      inputPlaceholder: 'Password',
      showCancelButton: true,
      confirmButtonColor: '#d84315',
      inputValidator: (val) => !val && 'Password is required!'
    });
    return password ? { password, email } : null;
  };

  // --- Action Handlers ---
  const handleAddTable = async () => {
    const { value: formValues } = await MySwal.fire({
      title: 'Create New Table',
      background: '#faf7f2',
      color: '#2d1b18',
      html: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px' }}>
          <input id="swal-number" type="number" className="swal2-input" placeholder="Table Number" style={{ margin: '0' }} />
          <input id="swal-capacity" type="number" className="swal2-input" placeholder="Capacity (Guests)" style={{ margin: '0' }} />
          <select id="swal-location" className="swal2-input" style={{ margin: '0' }}>
            <option value="" disabled selected hidden>Location</option>
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Window">Window</option>
            <option value="Balcony">Balcony</option>
          </select>
          <select id="swal-status" className="swal2-input" style={{ margin: '0' }}>
            <option value="" disabled selected hidden>Status</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Reserved">Reserved</option>
            <option value="NotAvailable">Not Available</option>
          </select>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Continue',
      confirmButtonColor: '#d84315',
      preConfirm: () => {
        const tableNumber = (document.getElementById('swal-number') as HTMLInputElement).value;
        const capacity = (document.getElementById('swal-capacity') as HTMLInputElement).value;
        const location = (document.getElementById('swal-location') as HTMLSelectElement).value;
        const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

        const missing = [];
        if (!tableNumber) missing.push("Table Number");
        if (!capacity) missing.push("Capacity");
        if (!location) missing.push("Location");
        if (!status) missing.push("Status");

        if (missing.length > 0) {
          Swal.showValidationMessage(`Missing: ${missing.join(', ')}`);
          return false;
        }
        return { tableNumber: Number(tableNumber), capacity: Number(capacity), location, status };
      }
    });

    if (formValues) {
      const auth = await requestPasswordConfirm('create table');
      if (!auth) return;

      const config = getAuthHeader();
      if (!config) return;

      try {
        await axios.post(API_ENDPOINTS.ADDTABLE, { ...formValues, ...auth }, config);
        toast.success(`Table ${formValues.tableNumber} added successfully!`);
        fetchTables(false);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message || "Verify your credentials.");
        }
      }
    }
  };

  const handleEditTable = async (table: RestaurantTable) => {
    const { value: formValues } = await MySwal.fire({
      title: `Manage Table ${table.tableNumber}`,
      background: '#faf7f2',
      html: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input id="swal-number" type="number" className="swal2-input" defaultValue={table.tableNumber} />
          <input id="swal-capacity" type="number" className="swal2-input" defaultValue={table.capacity} />
          <select id="swal-location" className="swal2-input" defaultValue={table.location}>
            <option value="Indoor">Indoor</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Window">Window</option>
            <option value="Balcony">Balcony</option>
          </select>
          <select id="swal-status" className="swal2-input" defaultValue={table.status}>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Reserved">Reserved</option>
            <option value="NotAvailable">Not Available</option>
          </select>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'Update Changes',
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
        toast.success("Table updated successfully!");
      } catch  {
        toast.error("Update failed.");
      }
    }
  };

  const handleDeleteTable = async (id: string) => {
    const auth = await requestPasswordConfirm('delete this table');
    if (!auth) return;

    const config = getAuthHeader();
    if (!config) return;

    try {
      await axios.delete(`${API_ENDPOINTS.DELETETABLE}/${id}`, { ...config, data: auth });
      toast.success("Table removed.");
      setTables((prev) => prev.filter((t) => t._id !== id));
    } catch {
      toast.error("Deletion failed.");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.loader}>
          <img src={LoaderGif} alt="Loading..." />
          <h1>Synchronizing Floor Plan...</h1>
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
            <p>Active Layout: <strong>{tables.length} Tables</strong></p>
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
                  <h3>Configuration</h3>
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
              <h2>No floor plan data available.</h2>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TableManagement;